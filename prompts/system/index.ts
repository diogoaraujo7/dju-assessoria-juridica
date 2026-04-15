
import { GENERAL_SYSTEM_PROMPT } from './general';
import { MODULE_ATO_DECISORIO } from './ato-decisorio';
import { MODULE_TEMPLATE } from './template';
import { MODULE_EMENTA } from './ementa';
import { MODULE_PETICAO } from './peticao';
import { MODULE_REVISOR } from './revisor';

export * from './general';
export * from './ato-decisorio';
export * from './template';
export * from './ementa';
export * from './peticao';
export * from './revisor';

export const systemPromptRaw = GENERAL_SYSTEM_PROMPT + MODULE_ATO_DECISORIO + MODULE_TEMPLATE + MODULE_EMENTA + MODULE_PETICAO + MODULE_REVISOR;
