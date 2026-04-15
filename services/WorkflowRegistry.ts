
import { Task, WorkflowInput } from '../types';
import { WorkflowHookProps } from '../strategies/types';
import { atoDecisorioStrategies } from '../features/ato-decisorio/strategy';
import { templateStrategies } from '../features/template/strategy';
import { ementaStrategies } from '../features/ementa/strategy';
import { peticaoStrategies } from '../features/peticao/strategy';
import { revisorStrategies } from '../features/revisor/strategy';
import { editorStrategies } from '../features/editor/strategy';
import { createWorkflowHandler } from './WorkflowFactory';

type WorkflowHandler = (props: WorkflowHookProps, userInput: WorkflowInput) => Promise<void>;

export const getWorkflowHandler = (task: Task | null): WorkflowHandler | null => {
    switch (task) {
        case Task.ATO_DECISORIO:
            return createWorkflowHandler(atoDecisorioStrategies);
        case Task.TEMPLATE:
            return createWorkflowHandler(templateStrategies);
        case Task.EMENTA:
            return createWorkflowHandler(ementaStrategies);
        case Task.PETICAO:
            return createWorkflowHandler(peticaoStrategies);
        case Task.REVISOR:
            return createWorkflowHandler(revisorStrategies);
        case Task.EDITOR:
            return createWorkflowHandler(editorStrategies);
        default:
            return null;
    }
};
