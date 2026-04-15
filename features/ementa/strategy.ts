
import { Step, StepData, Task } from '../../types';
import { getStepConfig } from '../../stepConfig';
import { getPrompts } from '../../prompts/index';
import { prepareInputParts } from '../../utils/fileUtils';
import { determineNextStep } from '../../services/workflowStateMachine';
import { StepStrategy } from '../../strategies/types';

/**
 * Strategy Map for Ementa Generation Workflow.
 */
export const ementaStrategies: Record<string, StepStrategy> = {
    [Step.EMENTA_UPLOAD]: async (props, userInput) => {
        const { state, gemini, engine, handleFailure, onProcessComplete } = props;
        const { language, atoType } = state;
        const { chat, failedRequest } = gemini;
        const STEP_CONFIG = getStepConfig(language, atoType);
        const PROMPTS = getPrompts(language);

        const instructionResult = await PROMPTS.ementaGerar(); 
        const prompt = await prepareInputParts(userInput, instructionResult.contents);
        
        const nextStep = determineNextStep(Step.EMENTA_UPLOAD, Task.EMENTA, state);
        const stepDataToAdd = { [nextStep]: { ...(STEP_CONFIG[nextStep] as StepData), content: '', input: null, lastPrompt: prompt } };
        
        await engine.executeStep({
            chat, prompt, nextStep, stepDataToAdd, failedRequest, handleFailure, onComplete: onProcessComplete
        });
    },

    [Step.EMENTA_RESULTADO]: async (props, userInput) => {
        const { state, gemini, engine } = props;
        await engine.rewriteWithInstruction(userInput.text, { state, geminiState: gemini }, userInput.files);
    }
};
