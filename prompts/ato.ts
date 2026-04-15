
import { Language } from '../types';
import { getAtoGeralPrompts } from './ato-geral';
import { getAtoDivergentePrompts } from './ato-divergente';

export const getAtoPrompts = (lang: Language) => {
    return {
        ...getAtoGeralPrompts(lang),
        ...getAtoDivergentePrompts(lang)
    };
};
