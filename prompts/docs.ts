
import { Language } from '../types';
import { PromptFactoryResult } from './types';
import { textPart } from './helpers';
import { fileToGenerativePart } from '../utils/fileUtils';
import { MODULE_EMENTA } from './system';

export const getDocPrompts = (_lang: Language) => {
    return {
        // --- TEMPLATE ---
        templateApresentarSubtipos: async (peticaoOptions: string): Promise<PromptFactoryResult> => {
            return { contents: [textPart(`O usuário selecionou 'Petição'. Apresente os subtipos de petição. As opções são EXATAMENTE estas:\n${peticaoOptions}`)] };
        },
        templatePedirExemplos: async (userText: string): Promise<PromptFactoryResult> => {
            return { contents: [textPart(`Siga as 'INSTRUÇÕES PARA CRIAÇÃO DE TEMPLATES'. O usuário selecionou o tipo de ato '${userText || 'Não informado'}'. Solicite o envio de até três modelos de exemplo.`)] };
        },
        templateGerar: async (tipoDeAto: string, userFiles?: File[]): Promise<PromptFactoryResult> => {
            const fileParts = userFiles ? await Promise.all(userFiles.map(fileToGenerativePart)) : [];
            return { 
                contents: [
                    ...fileParts,
                    textPart(`Siga as 'INSTRUÇÕES PARA CRIAÇÃO DE TEMPLATES'. O tipo de ato é '${tipoDeAto}'. O usuário forneceu os seguintes modelos. Analise-os detalhadamente (estrutura, vocabulário, estilo, formatação) e gere o template final, composto de {Instruções} e {Esqueleto}.`)
                ] 
            };
        },

        // --- EMENTA ---
        ementaGerar: async (userFiles?: File[]): Promise<PromptFactoryResult> => {
            const fileParts = userFiles ? await Promise.all(userFiles.map(fileToGenerativePart)) : [];
            return {
                contents: [
                    ...fileParts,
                    textPart(MODULE_EMENTA + `\n\nO usuário forneceu os seguintes dados. Analise-os e elabore a Ementa seguindo RIGOROSAMENTE o padrão e as diretrizes de formatação do Módulo 3. OBRIGATÓRIO: Use as tags [INÍCIO DA EMENTA] e [FINAL DA EMENTA] para envolver o texto da ementa. Somente APÓS a tag [FINAL DA EMENTA], encerre a resposta.`)
                ]
            };
        },
        ementaDoAtoFinal: async (atoContent: string): Promise<PromptFactoryResult> => {
            return {
                contents: [textPart(MODULE_EMENTA + `\n\nCom base nos dados do ato decisório a seguir, elabore a Ementa seguindo RIGOROSAMENTE o padrão e as diretrizes de formatação do Módulo 3. OBRIGATÓRIO: Use as tags [INÍCIO DA EMENTA] e [FINAL DA EMENTA] para envolver o texto da ementa. Somente APÓS a tag [FINAL DA EMENTA], encerre a resposta.\n\nATO DECISÓRIO:\n${atoContent}`)]
            };
        }
    };
};
