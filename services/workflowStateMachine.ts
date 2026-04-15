
import { Step, Task, Language, isDivergent, isSpecialPetition } from '../types';
import { workflows } from '../configs/workflowConfig';

interface WorkflowContextData {
    atoType?: string | null;
    petitionType?: string | null;
    language: Language;
}

export const determineNextStep = (
    currentStep: Step, 
    task: Task, 
    context: WorkflowContextData
): Step => {
    const workflowPaths = workflows[task];
    
    if (!workflowPaths) {
        console.error(`No workflow configuration found for task: ${task}`);
        return currentStep;
    }

    let steps: Step[];

    if (task === Task.ATO_DECISORIO && isDivergent(context.atoType)) {
        steps = workflowPaths.divergent || workflowPaths.default;
    } else if (task === Task.PETICAO && isSpecialPetition(context.petitionType)) {
        steps = workflowPaths.special || workflowPaths.default;
    } else {
        steps = workflowPaths.default;
    }

    const currentIndex = steps.indexOf(currentStep);

    if (currentIndex !== -1 && currentIndex < steps.length - 1) {
        return steps[currentIndex + 1];
    }

    return currentStep;
};
