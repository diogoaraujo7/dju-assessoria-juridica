
import { Part } from '@google/genai';
import { Step, StepType, StepData, Task, PetitionIdentifiers } from '../../types';
import { getStepConfig } from '../../stepConfig';
import { getPrompts } from '../../prompts/index';
import { prepareInputParts } from '../../utils/fileUtils';
import { determineNextStep } from '../../services/workflowStateMachine';
import { StepStrategy } from '../../strategies/types';

/**
 * Strategy Map for Template Generation Workflow.
 */
export const templateStrategies: Record<string, StepStrategy> = {
    [Step.TEMPLATE_TIPO_DE_ATO]: async (props, userInput) => {
        const { state, gemini, dispatch, engine, handleFailure, onProcessComplete } = props;
        const { language, atoType } = state;
        const { chat, failedRequest } = gemini;
        const STEP_CONFIG = getStepConfig(language, atoType);
        const PROMPTS = getPrompts(language);
        const isPT = language === 'pt-BR';

        let prompt: string | Part[];
        let nextStep: Step;

        if (userInput.text.includes(PetitionIdentifiers.SPECIFY_PLACEHOLDER_PT) || 
            userInput.text.includes(PetitionIdentifiers.SPECIFY_PLACEHOLDER_EN) || 
            userInput.text.startsWith('7.5')) {
            
            dispatch({ type: 'UPDATE_STEP_DATA', payload: { step: Step.TEMPLATE_TIPO_DE_ATO, data: {
                stepType: StepType.DOCUMENT,
                content: isPT 
                    ? "Por favor, especifique qual o tipo de ato para o qual deseja gerar um template:" 
                    : "Please specify which type of act you want to create a template for:",
                input: null
            }}});
            onProcessComplete();
            return;
        }

        if (userInput.text.includes(PetitionIdentifiers.TEMPLATE_PETITION_OPTION)) {
            const peticaoOptions = STEP_CONFIG[Step.TEMPLATE_PETICAO_SUBTIPO].options!.join('\n');
            const result = await PROMPTS.templateApresentarSubtipos(peticaoOptions);
            prompt = result.contents;
            nextStep = Step.TEMPLATE_PETICAO_SUBTIPO;
        } else {
            const result = await PROMPTS.templatePedirExemplos(userInput.text);
            prompt = result.contents;
            nextStep = determineNextStep(Step.TEMPLATE_TIPO_DE_ATO, Task.TEMPLATE, state);
        }

        const stepDataToAdd = { [nextStep]: { ...(STEP_CONFIG[nextStep] as StepData), content: '', input: null, lastPrompt: prompt } };
        
        await engine.executeStep({
            chat, prompt, nextStep, stepDataToAdd, failedRequest, handleFailure, onComplete: onProcessComplete
        });
    },

    [Step.TEMPLATE_PETICAO_SUBTIPO]: async (props, userInput) => {
        const { state, gemini, engine, handleFailure, onProcessComplete, dispatch } = props;
        const { language, atoType } = state;
        const { chat, failedRequest } = gemini;
        const STEP_CONFIG = getStepConfig(language, atoType);
        const PROMPTS = getPrompts(language);
        const isPT = language === 'pt-BR';

        if (userInput.text.startsWith('7.5') || userInput.text.includes(PetitionIdentifiers.SPECIFY_PLACEHOLDER_PT)) {
             dispatch({ type: 'UPDATE_STEP_DATA', payload: { step: Step.TEMPLATE_PETICAO_SUBTIPO, data: {
                stepType: StepType.DOCUMENT,
                content: isPT 
                    ? "Por favor, especifique qual o tipo de recurso:" 
                    : "Please specify the type of appeal:",
                input: null
            }}});
            onProcessComplete();
            return;
        }

        const result = await PROMPTS.templatePedirExemplos(userInput.text);
        const prompt = result.contents;
        
        const nextStep = Step.TEMPLATE_UPLOAD;

        const stepDataToAdd = { [nextStep]: { ...(STEP_CONFIG[nextStep] as StepData), content: '', input: null, lastPrompt: prompt } };
        
        await engine.executeStep({
            chat, prompt, nextStep, stepDataToAdd, failedRequest, handleFailure, onComplete: onProcessComplete
        });
    },

    [Step.TEMPLATE_UPLOAD]: async (props, userInput) => {
        const { state, gemini, engine, handleFailure, onProcessComplete } = props;
        const { language, stepData, atoType } = state;
        const { chat, failedRequest } = gemini;
        const STEP_CONFIG = getStepConfig(language, atoType);
        const PROMPTS = getPrompts(language);

        const tipoDeAto = stepData[Step.TEMPLATE_PETICAO_SUBTIPO]?.input?.text || stepData[Step.TEMPLATE_TIPO_DE_ATO]?.input?.text || '';
        const instructionResult = await PROMPTS.templateGerar(tipoDeAto); 
        const prompt = await prepareInputParts(userInput, instructionResult.contents);
        
        const nextStep = determineNextStep(Step.TEMPLATE_UPLOAD, Task.TEMPLATE, state);
        
        const stepDataToAdd = { [nextStep]: { ...(STEP_CONFIG[nextStep] as StepData), content: '', input: null, lastPrompt: prompt } };
        
        await engine.executeStep({
            chat, prompt, nextStep, stepDataToAdd, failedRequest, handleFailure, onComplete: onProcessComplete
        });
    },

    [Step.TEMPLATE_RESULTADO]: async (props, userInput) => {
        const { state, gemini, engine } = props;
        await engine.rewriteWithInstruction(userInput.text, { state, geminiState: gemini }, userInput.files);
    }
};
