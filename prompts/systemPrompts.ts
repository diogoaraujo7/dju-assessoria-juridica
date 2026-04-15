
import { Language, Task } from '../types';
import { 
    GENERAL_SYSTEM_PROMPT, 
    MODULE_ATO_DECISORIO, 
    MODULE_TEMPLATE, 
    MODULE_EMENTA, 
    MODULE_PETICAO, 
    MODULE_REVISOR,
    systemPromptRaw
} from './system';

export const getSystemPrompt = (lang: Language, task?: Task) => {
    const isPT = lang === 'pt-BR';
    const languageInstruction = isPT ? "" : "\n\n# LANGUAGE OVERRIDE: YOU MUST INTERACT, ANALYZE, AND GENERATE ALL DOCUMENTS IN ENGLISH (US). USE STANDARD US LEGAL TERMINOLOGY WHERE APPLICABLE.\n\n";

    if (!task) {
        // Fallback or full context if needed (e.g. initial greeting)
        return languageInstruction + systemPromptRaw;
    }

    let specificModule = "";

    switch (task) {
        case Task.ATO_DECISORIO:
            specificModule = MODULE_ATO_DECISORIO;
            break;
        case Task.TEMPLATE:
            specificModule = MODULE_TEMPLATE;
            break;
        case Task.EMENTA:
            specificModule = MODULE_EMENTA;
            break;
        case Task.PETICAO:
            specificModule = MODULE_PETICAO;
            break;
        case Task.REVISOR:
            specificModule = MODULE_REVISOR;
            break;
        case Task.EDITOR:
            specificModule = "";
            break;
        default:
            specificModule = "";
    }

    // Combine General Guidelines + Specific Module
    return languageInstruction + GENERAL_SYSTEM_PROMPT + specificModule;
}
