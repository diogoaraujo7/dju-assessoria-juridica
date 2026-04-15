
import { Language } from '../types';
import { getAtoPrompts } from './ato';
import { getPeticaoPrompts } from './peticao';
import { getRevisorPrompts } from './revisor';
import { getEditorPrompts } from './editor';
import { getDocPrompts } from './docs';
import { getGeneralPrompts } from './general';

export { WRITING_GUIDELINES } from './guidelines';
export { getSystemPrompt } from './systemPrompts';
export * from './types';

export const getPrompts = (lang: Language) => {
    return {
        ...getAtoPrompts(lang),
        ...getPeticaoPrompts(lang),
        ...getRevisorPrompts(lang),
        ...getEditorPrompts(lang),
        ...getDocPrompts(lang),
        ...getGeneralPrompts(lang)
    };
};
