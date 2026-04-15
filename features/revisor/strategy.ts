
import { Step, StepData, Task, WorkflowTriggers } from '../../types';
import { getStepConfig } from '../../stepConfig';
import { getPrompts } from '../../prompts/index';
import { determineNextStep } from '../../services/workflowStateMachine';
import { StepStrategy } from '../../strategies/types';

/**
 * Strategy Map for Revisor Workflow.
 */
export const revisorStrategies: Record<string, StepStrategy> = {
    [Step.REVISOR_UPLOAD_LINHA_BASE]: async (props, userInput) => {
        const { state, dispatch, onProcessComplete } = props;
        const { language, atoType } = state;
        const STEP_CONFIG = getStepConfig(language, atoType);

        dispatch({ type: 'SET_WORKFLOW_STATE', payload: { crossStepContext: { textPayload: userInput.text, contextFiles: userInput.files } } });
        const nextStep = determineNextStep(Step.REVISOR_UPLOAD_LINHA_BASE, Task.REVISOR, state);
        
        let content = language === 'pt-BR' ? "Linha de base recebida. Agora, anexe o **Documento para Análise** (o documento que você quer que eu revise ou audite)." : "Baseline received. Now, attach the **Document for Analysis** (the document you want to review or audit).";

        const stepDataToAdd = { [nextStep]: { ...(STEP_CONFIG[nextStep] as StepData), content, input: null } };
        dispatch({ type: 'ADVANCE_STEP', payload: { nextStep, stepDataToAdd } });
        onProcessComplete();
    },

    [Step.REVISOR_UPLOAD_DOC_ANALISE]: async (props, userInput) => {
        const { state, gemini, engine, handleFailure, onProcessComplete } = props;
        const { language, atoType } = state;
        const { chat, failedRequest } = gemini;
        const STEP_CONFIG = getStepConfig(language, atoType);
        const PROMPTS = getPrompts(language);

        const result = await PROMPTS.revisorAnalisar(
            state.crossStepContext?.textPayload || '',
            state.crossStepContext?.contextFiles,
            userInput.text,
            userInput.files
        );
        const prompt = result.contents;

        const nextStep = determineNextStep(Step.REVISOR_UPLOAD_DOC_ANALISE, Task.REVISOR, state);
        props.dispatch({ type: 'SET_WORKFLOW_STATE', payload: { crossStepContext: null } });

        const stepDataToAddSubmit = { [nextStep]: { ...(STEP_CONFIG[nextStep] as StepData), content: '', input: null, lastPrompt: prompt } };
        
        await engine.executeStep({
            chat, prompt, nextStep, stepDataToAdd: stepDataToAddSubmit, failedRequest, handleFailure, onComplete: onProcessComplete
        });
    },

    [Step.REVISOR_ANALISE]: async (props, userInput) => {
        const { state, gemini, engine, handleFailure, onProcessComplete } = props;
        const { language, stepData, atoType } = state;
        const { chat, failedRequest } = gemini;
        const STEP_CONFIG = getStepConfig(language, atoType);
        const PROMPTS = getPrompts(language);

        if (userInput.text.startsWith(WorkflowTriggers.CMD_APLICAR_SOLUCOES)) {
            const reportContent = stepData[Step.REVISOR_ANALISE]?.content || '';
            const originalDocText = stepData[Step.REVISOR_UPLOAD_DOC_ANALISE]?.input?.text || '';
            
            let selectedIds: string[] | undefined;
            const parts = userInput.text.split('|||');
            if (parts.length > 1) {
                try {
                    selectedIds = JSON.parse(parts[1]);
                } catch (e) {
                    console.error("Failed to parse selectedIds", e);
                }
            }
            
            const result = await PROMPTS.revisorAplicarCorrecoes(reportContent, originalDocText, selectedIds);
            const prompt = result.contents;
            
            const nextStep = Step.REVISOR_RESULTADO_FINAL;
            const stepDataToAdd = { [nextStep]: { ...(STEP_CONFIG[nextStep] as StepData), content: '', input: null, lastPrompt: prompt } };

            await engine.executeStep({
                chat, prompt, nextStep, stepDataToAdd, failedRequest, handleFailure, onComplete: onProcessComplete
            });

        }
    }
};
