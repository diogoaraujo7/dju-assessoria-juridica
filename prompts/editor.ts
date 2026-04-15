import { Language } from '../types';
import { PromptFactoryResult } from './types';
import { textPart } from './helpers';
import { fileToGenerativePart } from '../utils/fileUtils';
import { Part } from '@google/genai';

export const getEditorPrompts = (_lang: Language) => {
    return {
        editorContinuar: async (userText: string, userFiles?: File[], currentContent?: string, isChatResponse?: boolean): Promise<PromptFactoryResult> => {
            const fileParts = userFiles ? await Promise.all(userFiles.map(fileToGenerativePart)) : [];
            const contents: Part[] = [...fileParts];
            
            let msg = `O usuário enviou uma nova mensagem/arquivo.`;
            if (userText && userText.trim() !== '') {
                msg = `O usuário enviou uma nova mensagem/arquivo: "${userText}".`;
            }

            if (currentContent && currentContent.trim() !== '') {
                msg += `\n\nTEXTO ATUAL NO EDITOR:\n${currentContent}`;
            }

            if (isChatResponse) {
                msg += `\n\nResponda de forma natural e prestativa, como um assistente jurídico. O usuário pode estar fazendo perguntas sobre o TEXTO ATUAL NO EDITOR. Em suas mensagens no chat, o Dju NUNCA se oferece espontaneamente para realizar pesquisas. No entanto, se o usuário fizer uma pergunta ou pedir uma pesquisa (ex: jurisprudência, doutrina, leis), utilize o Google Search para buscar informações atualizadas e precisas. Ao final da sua resposta, anexe as fontes e links utilizados. IMPORTANTE: NÃO modifique o texto do editor, apenas responda à pergunta do usuário no chat.`;
            } else if (currentContent && currentContent.trim() !== '') {
                msg += `\n\nPor favor, aplique as alterações solicitadas ao TEXTO ATUAL NO EDITOR e retorne o texto completo revisado. IMPORTANTE: RETORNE APENAS O TEXTO REVISADO. NÃO INCLUA SAUDAÇÕES, EXPLICAÇÕES, OU QUALQUER TEXTO CONVERSACIONAL (ex: "Aqui está o texto revisado..."). O SEU RETORNO SUBSTITUIRÁ DIRETAMENTE O CONTEÚDO DO EDITOR. Se o usuário pedir para completar ou continuar o texto, retorne o texto atual acrescido da continuação lógica, sem adicionar nenhum comentário seu.`;
            } else {
                msg += `\n\nPor favor, gere o texto solicitado pelo usuário. IMPORTANTE: RETORNE APENAS O TEXTO GERADO. NÃO INCLUA SAUDAÇÕES, EXPLICAÇÕES, OU QUALQUER TEXTO CONVERSACIONAL. O SEU RETORNO SERÁ INSERIDO DIRETAMENTE NO EDITOR.`;
            }
            
            msg += `\n\nDIRETRIZES VINCULANTES: O Dju Assessoria Jurídica é estritamente PROIBIDO de mencionar exemplos fictícios ou meramente ilustrativos de dados públicos e oficiais, quais sejam, jurisprudência (ementa, acórdão, tese de julgamento, Súmula, Tema Repetitivo, RE, REsp, etc.), legislação, doutrina, números de processos, nomes, datas (data de julgamento; data de publicação de acórdão no DJe ou PJe, por exemplo), mesmo que a intenção seja reforçar algum argumento. O Dju Assessoria Jurídica SOMENTE transcreve trechos de dados públicos e oficiais verificados com exatidão. Quando não há certeza acerca da literalidade de algum trecho, o Dju - Assessoria Jurídica apenas se abstém de mencionar ou transcrever.`;

            contents.push(textPart(msg));
            
            return { contents };
        }
    };
};
