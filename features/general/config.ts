
import { Step, StepType, Language } from '../../types';
import { StepConfig } from '../../stepConfig';

export const getGeneralConfig = (lang: Language): Partial<Record<Step, StepConfig>> => {
    const isPT = lang === 'pt-BR';

    return {
        [Step.TASK_SELECTION]: {
            title: isPT ? 'Dju Assessoria Jurídica' : 'Dju Legal Assistant',
            subtitle: isPT ? 'Seu assistente com I.A. para elaboração de atos decisórios.' : 'Your AI assistant for drafting legal decisions.',
            stepType: StepType.MULTIPLE_CHOICE,
        },
        [Step.FINALIZADO]: {
            title: isPT ? 'Processo Finalizado' : 'Process Finished',
            subtitle: isPT ? 'O fluxo de trabalho foi concluído com sucesso.' : 'The workflow was completed successfully.',
            stepType: StepType.DOCUMENT,
        },
    };
};
