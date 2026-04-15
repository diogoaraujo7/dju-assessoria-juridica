
import { Chat, Part, GoogleGenAI, Content } from "@google/genai";
import { GoogleSearchResult, Argument } from '../types';
import { sanitizeJsonOutput } from '../utils/textUtils';
import { GeminiError, GeminiErrorCode } from '../types/errors';
import { getApiKey } from './configService';
import { z } from 'zod';


export const getAIClient = (apiKey: string): GoogleGenAI => {
    return new GoogleGenAI({ apiKey });
};

export const DEFAULT_MODEL = 'models/gemini-3-flash-preview';
export const PRO_MODEL = 'models/gemini-3.1-pro-preview';

export const createChatSession = (model: string, systemInstruction?: string, history?: Content[], tools?: any[]): Chat => {
    const apiKey = getApiKey();
    const ai = getAIClient(apiKey);
    return ai.chats.create({
        model: model,
        config: { systemInstruction, tools },
        history: history,
    });
};

const MAX_AUTO_RETRIES = 3;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function executeWithRetry(
    operation: (attempt: number) => Promise<void>,
    onFinalFailure: (error: GeminiError, manualRetryFn: () => void) => void,
    attempt: number = 1
) {
    const manualRetryFn = () => executeWithRetry(operation, onFinalFailure, 1);
    
    try {
        await operation(attempt);
    } catch (rawError) {
        const error = GeminiError.fromError(rawError);
        console.error(`Error during operation (Attempt ${attempt}):`, error);

        if (error.isRetryable && attempt <= MAX_AUTO_RETRIES) {
            const backoffTime = Math.pow(2.5, attempt - 1) * 1000;
            await delay(backoffTime);
            return executeWithRetry(operation, onFinalFailure, attempt + 1);
        }

        onFinalFailure(error, manualRetryFn);
    }
}

export const generateStructuredContent = async <T = any>(
  model: string,
  prompt: string | Part[],
  schema: any, 
  onComplete: (jsonObj: T) => void,
  onFailure?: (retryFn: () => void, error: GeminiError) => void,
  zodSchema?: z.ZodType<T> 
) => {
    const operation = async (_attempt: number) => {
        const apiKey = getApiKey();
        const ai = getAIClient(apiKey);
        const result = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema
            }
        });

        const responseText = result.text || '{}';
        
        try {
            const cleanJsonStr = sanitizeJsonOutput(responseText);
            const parsedJson = JSON.parse(cleanJsonStr);
            
            if (zodSchema) {
                const validatedData = zodSchema.parse(parsedJson);
                onComplete(validatedData);
            } else {
                onComplete(parsedJson as T);
            }
        } catch (e) {
            console.error("JSON Parse/Validation Error:", e);
            throw new GeminiError(GeminiErrorCode.PARSING, "Falha ao processar a resposta JSON da IA.", e);
        }
    };

    const onFinalFailure = (error: GeminiError, manualRetryFn: () => void) => {
        if (onFailure) {
            onFailure(manualRetryFn, error);
        } else {
             console.error("Critical failure in structured generation:", error);
             onComplete({ error: error.message } as unknown as T);
        }
    };
    
    await executeWithRetry(operation, onFinalFailure);
};

export const processStream = async (
  chat: Chat,
  message: string | Part[],
  onUpdate: (text: string) => void,
  onComplete: (metadata?: any) => void,
  onFailure?: (retryFn: () => void, error: GeminiError) => void
) => {
  if (!message || (Array.isArray(message) && message.length === 0)) {
     onUpdate("Erro interno: Mensagem vazia enviada para a IA.");
     onComplete();
     return;
  }

  const operation = async (attempt: number) => {
    if (attempt > 1) {
       onUpdate(`⚠️ O modelo está com alto tráfego. Realizando tentativa automática ${attempt - 1} de ${MAX_AUTO_RETRIES}... Aguarde um instante.`);
    }

    const result = await chat.sendMessageStream({ message });
    let text = '';
    let firstChunk = true;
    let finalGroundingMetadata: any = null;

    for await (const chunk of result) {
      if (firstChunk) {
        onUpdate(''); 
        firstChunk = false;
      }
      const chunkText = chunk.text;
      if (chunkText) {
          text += chunkText;
          onUpdate(text);
      }
      if (chunk.candidates?.[0]?.groundingMetadata) {
          finalGroundingMetadata = chunk.candidates[0].groundingMetadata;
      }
    }

    if (finalGroundingMetadata) {
        const groundingChunks = finalGroundingMetadata.groundingChunks || [];
        const groundingSupports = finalGroundingMetadata.groundingSupports || [];

        if (groundingSupports.length > 0 && groundingChunks.length > 0) {
            const sortedSupports = [...groundingSupports].sort(
                (a, b) => (b.segment?.endIndex ?? 0) - (a.segment?.endIndex ?? 0),
            );

            const encoder = new TextEncoder();
            const decoder = new TextDecoder();
            const responseBytes = encoder.encode(text);

            for (const support of sortedSupports) {
                const endIndex = support.segment?.endIndex;
                if (endIndex === undefined || !support.groundingChunkIndices?.length) {
                    continue;
                }

                const citationLinks = support.groundingChunkIndices
                    .map((i: number) => {
                        const uri = groundingChunks[i]?.web?.uri;
                        if (uri) {
                            return ` [${i + 1}](${uri})`;
                        }
                        return null;
                    })
                    .filter(Boolean);

                if (citationLinks.length > 0) {
                    const citationString = citationLinks.join("");
                    
                    try {
                        const textBefore = decoder.decode(responseBytes.slice(0, endIndex));
                        const jsIndex = textBefore.length;
                        text = text.slice(0, jsIndex) + citationString + text.slice(jsIndex);
                    } catch (e) {
                        text = text.slice(0, endIndex) + citationString + text.slice(endIndex);
                    }
                }
            }
            
        }
    }

    if (firstChunk) onUpdate('');
    onUpdate(text); 
    onComplete(finalGroundingMetadata);
  };
  
  const onFinalFailure = (error: GeminiError, manualRetryFn: () => void) => {
     if (onFailure) {
      let msg = `Ocorreu um erro na requisição: ${error.message}`;
      
      if (error.code === GeminiErrorCode.OVERLOAD || error.code === GeminiErrorCode.TOKEN_LIMIT || error.code === GeminiErrorCode.QUOTA_EXCEEDED || error.code === GeminiErrorCode.FILE_SIZE_LIMIT) {
          msg = error.message;
      }
      
      onUpdate(msg);
      onFailure(manualRetryFn, error);
    } else {
      onUpdate(`Erro fatal: ${error.message}`);
      onComplete();
    }
  };

  await executeWithRetry(operation, onFinalFailure);
};

export const rewriteTextWithGemini = async (
    text: string,
    instruction: string,
    context?: string,
    modelName: string = DEFAULT_MODEL
): Promise<string> => {
    let result = text;
    
    const operation = async (attempt: number) => {
        console.log(`Rewrite attempt ${attempt} for text:`, text.substring(0, 50) + "...");
        const apiKey = getApiKey();
        const ai = getAIClient(apiKey);
        
        const prompt = `Você é um assistente jurídico especializado em redação.
Sua tarefa é reescrever o texto selecionado de acordo com a seguinte instrução: "${instruction}".

${context ? `Contexto do documento (para referência):\n${context}\n\n` : ''}Texto selecionado para reescrever:
"${text}"

Retorne APENAS o texto reescrito, sem aspas, sem explicações adicionais e mantendo a formatação markdown se houver.`;

        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
        });
        
        if (response.text) {
            result = response.text.trim();
            console.log("Rewrite successful");
        } else {
            console.warn("Rewrite returned empty text, using original.");
        }
    };

    const onFinalFailure = (error: GeminiError, _manualRetryFn: () => void) => {
        console.error("Rewrite final failure:", error);
    };

    await executeWithRetry(operation, onFinalFailure);
    return result;
};

export const performGoogleSearch = async (
    model: string,
    prompt: string,
    systemInstruction: string,
): Promise<GoogleSearchResult> => {
    return new Promise<GoogleSearchResult>((resolve) => {
        const operation = async (_attempt: number) => {
            const apiKey = getApiKey();
            const ai = getAIClient(apiKey);
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                    systemInstruction,
                }
            });

            let responseText = response.text || '';
            const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
            const groundingChunks = groundingMetadata?.groundingChunks || [];
            const groundingSupports = groundingMetadata?.groundingSupports || [];

            if (groundingSupports.length > 0 && groundingChunks.length > 0) {
                const sortedSupports = [...groundingSupports].sort(
                    (a, b) => (b.segment?.endIndex ?? 0) - (a.segment?.endIndex ?? 0),
                );

                const encoder = new TextEncoder();
                const decoder = new TextDecoder();
                const responseBytes = encoder.encode(responseText);

                for (const support of sortedSupports) {
                    const endIndex = support.segment?.endIndex;
                    if (endIndex === undefined || !support.groundingChunkIndices?.length) {
                        continue;
                    }

                    const citationLinks = support.groundingChunkIndices
                        .slice(0, 3)
                        .map((i: number) => {
                            const uri = groundingChunks[i]?.web?.uri;
                            if (uri) {
                                return `[${i + 1}](${uri})`;
                            }
                            return null;
                        })
                        .filter(Boolean);

                    if (citationLinks.length > 0) {
                        const citationString = citationLinks.join("");
                        
                        try {
                            const textBefore = decoder.decode(responseBytes.slice(0, endIndex));
                            const jsIndex = textBefore.length;
                            responseText = responseText.slice(0, jsIndex) + citationString + responseText.slice(jsIndex);
                        } catch (e) {
                            responseText = responseText.slice(0, endIndex) + citationString + responseText.slice(endIndex);
                        }
                    }
                }
            }

            const sources = groundingChunks;
            
            const analysisMatch = responseText.match(/(?:^|\n)#*\s*ANÁLISE[^\n]*\n([\s\S]*?)(?=(?:^|\n)#*\s*ARGUMENTOS|$)/i);
            let analysisText = responseText;
            if (analysisMatch && analysisMatch[1].trim()) {
                analysisText = analysisMatch[1].trim();
            } else {
                const fallbackMatch = responseText.match(/^([\s\S]*?)(?=(?:^|\n)#*\s*ARGUMENTOS|$)/i);
                if (fallbackMatch && fallbackMatch[1].trim()) {
                    analysisText = fallbackMatch[1].trim();
                }
            }
            
            const searchArguments: Argument[] = [];
            
            const argsSectionMatch = responseText.match(/(?:^|\n)#*\s*ARGUMENTOS[^\n]*\n([\s\S]*)/i);
            const argsSectionText = argsSectionMatch ? argsSectionMatch[1] : responseText;
            
            const argsRegex = /(?:^|\n)#*\s*ARGUMENTO:?\s*([^\n]+)\n([\s\S]*?)(?=(?:^|\n)#*\s*ARGUMENTO:?|$)/gi;
            
            const citationCleanupRegex = /\s*\[[\d., ]+\](?:\([^)]*\))?/g;

            let match;
            while ((match = argsRegex.exec(argsSectionText)) !== null) {
                if (match[1].trim() && match[2].trim()) {
                    const cleanTitle = match[1].trim().replace(citationCleanupRegex, '').trim();
                    const cleanContent = match[2].trim().replace(citationCleanupRegex, '').trim();
                    searchArguments.push({ titulo: cleanTitle, fundamentacao: cleanContent });
                }
            }
            resolve({ analysis: analysisText || "Análise indisponível.", searchArguments, sources });
        };

        const onFinalFailure = (error: GeminiError, _manualRetryFn: () => void) => {
            console.error(`Google Search Error (Model: ${model}):`, error);
            const isOverload = error.code === GeminiErrorCode.OVERLOAD || error.code === GeminiErrorCode.QUOTA_EXCEEDED;
            const errorResult: GoogleSearchResult = {
                analysis: isOverload ? "Serviço indisponível momentaneamente (Erro 503 ou Cota)." : "Ocorreu um erro na pesquisa.",
                searchArguments: [],
                sources: [],
                error: isOverload ? 'overloaded' : 'other'
            };
            resolve(errorResult);
        };
        
        executeWithRetry(operation, onFinalFailure).catch((e) => {
            console.error("Catastrophic failure in performGoogleSearch retry mechanism:", e);
            resolve({
                analysis: "Ocorreu um erro crítico na pesquisa.",
                searchArguments: [],
                sources: [],
                error: 'other'
            });
        });
    });
};
