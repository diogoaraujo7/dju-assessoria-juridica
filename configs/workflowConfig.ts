
import { Step, Task } from '../types';

type WorkflowPaths = {
    default: Step[];
    [key: string]: Step[];
};

export const workflows: Record<Task, WorkflowPaths> = {
    [Task.ATO_DECISORIO]: {
        default: [
            Step.ATO_TIPO,
            Step.ATO_DADOS_PROCESSO,
            Step.ATO_ANALISE_PROCESSUAL,
            Step.ATO_TEMPLATE,
            Step.ELABORAR_ATO,
        ],
        divergent: [
            Step.ATO_TIPO,
            Step.ATO_DADOS_PROCESSO,
            Step.ATO_VOTO_RELATOR,
            Step.ATO_PONTOS_DIVERGENCIA,
            Step.ATO_ANALISE_PROCESSUAL,
            Step.ATO_TEMPLATE,
            Step.ELABORAR_ATO,
        ]
    },
    [Task.TEMPLATE]: {
        default: [
            Step.TEMPLATE_TIPO_DE_ATO,
            Step.TEMPLATE_UPLOAD,
            Step.TEMPLATE_RESULTADO,
        ]
    },
    [Task.EMENTA]: {
        default: [
            Step.EMENTA_UPLOAD,
            Step.EMENTA_RESULTADO,
        ]
    },
    [Task.PETICAO]: {
        default: [
            Step.PETICAO_TIPO,
            Step.PETICAO_DADOS,
            Step.PETICAO_ANALISE,
            Step.PETICAO_TEMPLATE,
            Step.ELABORAR_PETICAO,
        ],
        special: [
            Step.PETICAO_TIPO,
            Step.PETICAO_DADOS,
            Step.PETICAO_ANALISE,
            Step.PETICAO_TEMPLATE,
            Step.ELABORAR_PETICAO,
        ]
    },
    [Task.REVISOR]: {
        default: [
            Step.REVISOR_UPLOAD_LINHA_BASE,
            Step.REVISOR_UPLOAD_DOC_ANALISE,
            Step.REVISOR_ANALISE,
            Step.REVISOR_RESULTADO_FINAL,
        ]
    },
    [Task.EDITOR]: {
        default: [
            Step.EDITOR_EDITAR_TEXTO,
        ],
        chat: [
            Step.EDITOR_CHAT_LIVRE,
        ]
    }
};
