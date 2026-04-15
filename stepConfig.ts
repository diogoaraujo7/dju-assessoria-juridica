
import { Step, StepType, Language, SidebarSubItem, SuggestionButton } from './types';
import { ZodType } from 'zod';
import { getAtoConfig } from './features/ato-decisorio/config';
import { getPeticaoConfig } from './features/peticao/config';
import { getGeneralConfig } from './features/general/config';
import { getTemplateConfig } from './features/template/config';
import { getEmentaConfig } from './features/ementa/config';
import { getRevisorConfig } from './features/revisor/config';
import { getEditorConfig } from './features/editor/config';

export interface StepConfig {
    title: string;
    subtitle?: string;
    stepType: StepType;
    options?: string[];
    suggestionButtons?: SuggestionButton[] | string[];
    hasUniversalInput?: boolean;
    hasProceedButton?: boolean;
    sidebarSubItems?: SidebarSubItem[];
    isFinalDocument?: boolean;
    isPrimaryInput?: boolean;
    hideTitle?: boolean;
    outputSchema?: ZodType<any>;
}

export const getStepConfig = (lang: Language, atoType?: string | null): Record<Step, StepConfig> => {
    return {
        ...getGeneralConfig(lang),
        ...getAtoConfig(lang, atoType),
        ...getPeticaoConfig(lang),
        ...getTemplateConfig(lang),
        ...getEmentaConfig(lang),
        ...getRevisorConfig(lang),
        ...getEditorConfig(lang),
    } as Record<Step, StepConfig>;
};
