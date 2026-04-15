import { Step, StepType, Language } from '../../types';
import { StepConfig } from '../../stepConfig';

export const getEditorConfig = (lang: Language): Partial<Record<Step, StepConfig>> => {
    const isPT = lang === 'pt-BR';

    return {
        [Step.EDITOR_EDITAR_TEXTO]: {
            title: isPT ? 'Editor de Texto' : 'Text Editor',
            subtitle: isPT ? 'Cole ou digite o texto que deseja editar. Você pode usar a funcionalidade "Ajustar com IA" para fazer alterações.' : 'Paste or type the text you want to edit. You can use the "Adjust with AI" feature to make changes.',
            stepType: StepType.DOCUMENT,
            isFinalDocument: true,
            suggestionButtons: isPT ? [
                { label: "Reescrever", promptText: "rewrite" }
            ] : [
                { label: "Rewrite", promptText: "rewrite" }
            ]
        },
        [Step.EDITOR_CHAT_LIVRE]: {
            title: isPT ? 'Dju Assessoria Jurídica' : 'Dju Legal Assistant',
            subtitle: isPT ? 'Converse livremente ou anexe arquivos para análise.' : 'Chat freely or attach files for analysis.',
            stepType: StepType.CHAT,
            hideTitle: true,
            isFinalDocument: false,
        },
        [Step.EDITOR_PENDING_EDIT]: {
            title: isPT ? 'Edição Pendente' : 'Pending Edit',
            stepType: StepType.DOCUMENT,
            isFinalDocument: false,
        }
    };
};
