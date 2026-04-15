
import { Step, StepType, Language } from '../../types';
import { StepConfig } from '../../stepConfig';

export const getEmentaConfig = (lang: Language): Partial<Record<Step, StepConfig>> => {
    const isPT = lang === 'pt-BR';

    return {
        [Step.EMENTA_UPLOAD]: {
            title: isPT ? '1. Dados para Ementa' : '1. Syllabus Data',
            subtitle: isPT ? 'Forneça os dados do processo e/ou o voto judicial a ser analisado para a elaboração da ementa.' : 'Provide case data and/or judicial vote to be analyzed for syllabus drafting.',
            stepType: StepType.DOCUMENT,
            hasUniversalInput: true,
            isPrimaryInput: true,
        },
        [Step.EMENTA_RESULTADO]: {
            title: isPT ? '2. Ementa Gerada' : '2. Generated Syllabus',
            subtitle: isPT ? 'Esta é a ementa elaborada seguindo o padrão e as diretrizes de formatação e estilo.' : 'This is the syllabus drafted following formatting and style guidelines.',
            stepType: StepType.DOCUMENT,
            isFinalDocument: true,
        },
    };
};
