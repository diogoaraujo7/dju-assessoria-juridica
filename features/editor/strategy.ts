import { Step, StepData } from '../../types';
import { getStepConfig } from '../../stepConfig';
import { getPrompts } from '../../prompts/index';
import { StepStrategy } from '../../strategies/types';
import { generateStructuredContent, DEFAULT_MODEL } from '../../services/geminiService';
import { revisorIntentSchema } from '../../schemas';

/**
 * Strategy Map for Editor Workflow.
 */
export const editorStrategies: Record<string, StepStrategy> = {
    [Step.EDITOR_EDITAR_TEXTO]: async (props, userInput) => {
        const { state, gemini, engine, handleFailure, onProcessComplete, dispatch } = props;
        const { language, stepData, atoType } = state;
        const { chat, failedRequest } = gemini;
        const STEP_CONFIG = getStepConfig(language, atoType);
        const PROMPTS = getPrompts(language);

        const currentStepData = stepData[Step.EDITOR_EDITAR_TEXTO];
        const currentChatData = stepData[Step.EDITOR_CHAT_LIVRE];
        
        let chatContent = currentChatData?.content || '';
        
        const editorContent = userInput.currentEditorContent ?? currentStepData?.content;
        
        if (userInput.text === 'rewrite') {
            const instruction = language === 'pt-BR' ? 'Reescrever com outras palavras mantendo o sentido original.' : 'Rewrite with other words keeping the original meaning.';
            const result = await PROMPTS.editorContinuar(instruction, userInput.files, editorContent);
            const prompt = result.contents;

            if (chatContent && !chatContent.endsWith('\n\n---\n\n')) {
                chatContent += '\n\n---\n\n';
            }

            chatContent += `**Você:**\n${instruction}\n\n---\n\n`;

            const nextStep = Step.EDITOR_EDITAR_TEXTO;
            const targetStep = Step.EDITOR_PENDING_EDIT;
            const stepDataToAdd = { 
                [targetStep]: { ...(STEP_CONFIG[targetStep] as StepData), content: '', input: null, lastPrompt: prompt },
                [Step.EDITOR_CHAT_LIVRE]: { ...(STEP_CONFIG[Step.EDITOR_CHAT_LIVRE] as StepData), content: chatContent, input: null }
            };

            await engine.executeStep({
                chat, 
                prompt, 
                nextStep, 
                targetStep,
                stepDataToAdd, 
                failedRequest, 
                handleFailure, 
                onComplete: () => {
                    dispatch({ 
                        type: 'UPDATE_STEP_DATA', 
                        payload: { 
                            step: Step.EDITOR_CHAT_LIVRE, 
                            data: { 
                                content: chatContent + `**Dju Assessoria Jurídica:**\nElaborei uma nova versão do texto. Por favor, confirme se deseja aplicá-la ao Editor.\n\n---\n\n` 
                            } 
                        } 
                    });
                    onProcessComplete();
                }
            });
            return;
        }
        
        let intent = 'CHAT_RESPONSE'; 
        
        if (userInput.text || (userInput.files && userInput.files.length > 0)) {
            const textToClassify = userInput.text || "Anexei um arquivo para análise.";
            try {
                await new Promise<void>((resolve) => {
                    generateStructuredContent<{ intent: string }>(
                        DEFAULT_MODEL,
                        `Classifique a intenção do usuário: "${textToClassify}". Responda com 'EDIT_DOCUMENT' APENAS se o usuário pedir explicitamente para alterar, reescrever, formatar, resumir ou modificar o texto no editor. Responda com 'CHAT_RESPONSE' em todos os outros casos, como quando o usuário faz uma pergunta, pede uma pesquisa, pede para analisar um documento anexado, ou apenas conversa (ex: 'oi', 'tudo bem').`,
                        revisorIntentSchema,
                        (data) => {
                            if (data && data.intent) {
                                intent = data.intent;
                            }
                            resolve();
                        },
                        (_retryFn, err) => {
                            console.error("Failed to classify intent:", err);
                            resolve();
                        }
                    );
                });
            } catch (e) {
                console.error("Error during intent classification:", e);
            }
        }

        let userMessage = userInput.text || '';
        if (userInput.files && userInput.files.length > 0) {
            const fileNames = userInput.files.map(f => `\`📎 ${f.name}\``).join(' ');
            userMessage += `\n\n**Arquivos anexados:**\n${fileNames}`;
        }

        if (chatContent && !chatContent.endsWith('\n\n---\n\n')) {
            chatContent += '\n\n---\n\n';
        }

        chatContent += `**Você:**\n${userMessage.trim()}\n\n---\n\n`;

        if (intent === 'CHAT_RESPONSE') {
            const result = await PROMPTS.editorContinuar(userInput.text, userInput.files, editorContent, true);
            const prompt = result.contents;
            
            const targetStep = Step.EDITOR_CHAT_LIVRE;
            const nextStep = Step.EDITOR_EDITAR_TEXTO; 
            let initialContent = chatContent + '**Dju Assessoria Jurídica:**\n';
            
            const stepDataToAdd = { 
                [targetStep]: { ...(STEP_CONFIG[targetStep] as StepData), content: initialContent, input: null, lastPrompt: prompt } 
            };

            await engine.executeStep({
                chat, prompt, nextStep, targetStep, stepDataToAdd, failedRequest, handleFailure, onComplete: onProcessComplete, initialContent
            });
            return;
        }

        const result = await PROMPTS.editorContinuar(userInput.text, userInput.files, editorContent);
        const prompt = result.contents;

        const nextStep = Step.EDITOR_EDITAR_TEXTO;
        const targetStep = Step.EDITOR_PENDING_EDIT;
        const stepDataToAdd = { 
            [targetStep]: { ...(STEP_CONFIG[targetStep] as StepData), content: '', input: null, lastPrompt: prompt },
            [Step.EDITOR_CHAT_LIVRE]: { ...(STEP_CONFIG[Step.EDITOR_CHAT_LIVRE] as StepData), content: chatContent, input: null }
        };

        await engine.executeStep({
            chat, 
            prompt, 
            nextStep, 
            targetStep,
            stepDataToAdd, 
            failedRequest, 
            handleFailure, 
            onComplete: () => {
                dispatch({ 
                    type: 'UPDATE_STEP_DATA', 
                    payload: { 
                        step: Step.EDITOR_CHAT_LIVRE, 
                        data: { 
                            content: chatContent + `**Dju Assessoria Jurídica:**\nElaborei uma nova versão do texto. Por favor, confirme se deseja aplicá-la ao Editor.\n\n---\n\n` 
                        } 
                    } 
                });
                onProcessComplete();
            }
        });
    },

    [Step.EDITOR_CHAT_LIVRE]: async (props, userInput) => {
        const { state, gemini, engine, handleFailure, onProcessComplete } = props;
        const { language, stepData, atoType } = state;
        const { chat, failedRequest } = gemini;
        const STEP_CONFIG = getStepConfig(language, atoType);
        const PROMPTS = getPrompts(language);

        if (userInput.text === 'rewrite') {
            const editorContent = userInput.currentEditorContent ?? stepData[Step.EDITOR_EDITAR_TEXTO]?.content;
            const instruction = language === 'pt-BR' ? 'Reescrever com outras palavras mantendo o sentido original.' : 'Rewrite with other words keeping the original meaning.';
            const result = await PROMPTS.editorContinuar(instruction, userInput.files, editorContent);
            const prompt = result.contents;

            let chatContent = stepData[Step.EDITOR_CHAT_LIVRE]?.content || '';
            if (chatContent && !chatContent.endsWith('\n\n---\n\n')) {
                chatContent += '\n\n---\n\n';
            }
            chatContent += `**Você:**\n${instruction}\n\n---\n\n`;

            const nextStep = Step.EDITOR_EDITAR_TEXTO;
            const targetStep = Step.EDITOR_PENDING_EDIT;
            const stepDataToAdd = { 
                [targetStep]: { ...(STEP_CONFIG[targetStep] as StepData), content: '', input: null, lastPrompt: prompt },
                [Step.EDITOR_CHAT_LIVRE]: { ...(STEP_CONFIG[Step.EDITOR_CHAT_LIVRE] as StepData), content: chatContent, input: null }
            };

            await engine.executeStep({
                chat, 
                prompt, 
                nextStep, 
                targetStep,
                stepDataToAdd, 
                failedRequest, 
                handleFailure, 
                onComplete: () => {
                    props.dispatch({ 
                        type: 'UPDATE_STEP_DATA', 
                        payload: { 
                            step: Step.EDITOR_CHAT_LIVRE, 
                            data: { 
                                content: chatContent + `**Dju Assessoria Jurídica:**\nElaborei uma nova versão do texto. Por favor, confirme se deseja aplicá-la ao Editor.\n\n---\n\n` 
                            } 
                        } 
                    });
                    onProcessComplete();
                }
            });
            return;
        }

        const currentStepData = stepData[Step.EDITOR_CHAT_LIVRE];
        const editorContent = userInput.currentEditorContent ?? stepData[Step.EDITOR_EDITAR_TEXTO]?.content;

        const result = await PROMPTS.editorContinuar(userInput.text, userInput.files, editorContent, true);
        const prompt = result.contents;

        const nextStep = Step.EDITOR_CHAT_LIVRE;
        
        let userMessage = userInput.text || '';
        if (userInput.files && userInput.files.length > 0) {
            const fileNames = userInput.files.map(f => `\`📎 ${f.name}\``).join(' ');
            userMessage += `\n\n**Arquivos anexados:**\n${fileNames}`;
        }

        const userMessageMarkdown = `**Você:**\n${userMessage.trim()}`;
        
        let currentContent = currentStepData?.content || '';
        if (currentContent && !currentContent.endsWith('\n\n---\n\n')) {
            currentContent += '\n\n---\n\n';
        }
        
        let initialContent = currentContent ? currentContent + userMessageMarkdown + '\n\n---\n\n**Dju Assessoria Jurídica:**\n' : userMessageMarkdown + '\n\n---\n\n**Dju Assessoria Jurídica:**\n';
        
        const stepDataToAdd = { [nextStep]: { ...(STEP_CONFIG[nextStep] as StepData), content: initialContent, input: null, lastPrompt: prompt } };

        await engine.executeStep({
            chat, prompt, nextStep, stepDataToAdd, failedRequest, handleFailure, onComplete: onProcessComplete, initialContent
        });
    }
};
