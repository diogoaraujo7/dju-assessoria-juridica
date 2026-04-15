import { StepStrategy, WorkflowHookProps } from '../strategies/types';
import { WorkflowInput } from '../types';

export const createWorkflowHandler = (strategies: Record<string, StepStrategy>) => {
    return async (props: WorkflowHookProps, userInput: WorkflowInput) => {
        const { state, onProcessComplete } = props;
        const currentStep = state.currentStep;
        
        const strategy = strategies[currentStep];

        if (strategy) {
            try {
                await strategy(props, userInput);
            } catch (error) {
                console.error(`Erro ao executar estratégia para o passo ${currentStep}:`, error);
                onProcessComplete();
            }
        } else {
            onProcessComplete();
        }
    };
};