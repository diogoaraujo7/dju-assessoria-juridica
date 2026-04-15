
import { Language } from '../types';
import { PromptFactoryResult } from './types';
import { textPart } from './helpers';
import { fileToGenerativePart } from '../utils/fileUtils';

export const getGeneralPrompts = (lang: Language) => {
    const isPT = lang === 'pt-BR';

    return {
        menuComplementar: async (item: string, contextText: string, contextFiles?: File[]): Promise<PromptFactoryResult> => {
            const fileParts = contextFiles ? await Promise.all(contextFiles.map(fileToGenerativePart)) : [];
            let text = isPT 
                ? `[MENU COMPLEMENTAR] O usuário selecionou a opção "${item}".\n\n` 
                : `[COMPLEMENTARY MENU] The user selected the option "${item}".\n\n`;
            
            if (contextText && contextText.trim() !== '') {
                text += isPT ? `CONTEXTO DO PROCESSO:\n${contextText}\n\n` : `CASE CONTEXT:\n${contextText}\n\n`;
            }
            
            text += isPT 
                ? `Analise os autos do processo e forneça uma resposta detalhada sobre o item solicitado.\n\nIMPORTANTE: Você DEVE utilizar a ferramenta de pesquisa do Google para fundamentar sua resposta com fontes atualizadas da web, jurisprudência ou doutrina, sempre que o tema exigir embasamento legal ou factual externo aos autos.`
                : `Analyze the case files and provide a detailed response about the requested item.\n\nIMPORTANT: You MUST use the Google Search tool to ground your response with updated web sources, case law, or doctrine, whenever the topic requires legal or factual grounding external to the case files.`;
                
            text += isPT
                ? `\n\nDIRETRIZES VINCULANTES: O Dju Assessoria Jurídica é estritamente PROIBIDO de mencionar exemplos fictícios ou meramente ilustrativos de dados públicos e oficiais, quais sejam, jurisprudência (ementa, acórdão, tese de julgamento, Súmula, Tema Repetitivo, RE, REsp, etc.), legislação, doutrina, números de processos, nomes, datas (data de julgamento; data de publicação de acórdão no DJe ou PJe, por exemplo), mesmo que a intenção seja reforçar algum argumento. O Dju Assessoria Jurídica SOMENTE transcreve trechos de dados públicos e oficiais verificados com exatidão. Quando não há certeza acerca da literalidade de algum trecho, o Dju - Assessoria Jurídica apenas se abstém de mencionar ou transcrever.`
                : `\n\nBINDING GUIDELINES: Dju Legal Assistant is strictly FORBIDDEN from mentioning fictitious or merely illustrative examples of public and official data, namely, jurisprudence (syllabus, judgment, judgment thesis, Precedent, Repetitive Theme, RE, REsp, etc.), legislation, doctrine, case numbers, names, dates (judgment date; publication date of judgment in DJe or PJe, for example), even if the intention is to reinforce an argument. Dju Legal Assistant ONLY transcribes excerpts of public and official data verified with exactness. When there is no certainty about the literalness of an excerpt, Dju Legal Assistant simply refrains from mentioning or transcribing it.`;

            return { contents: [...fileParts, textPart(text)] };
        },

        pesquisaGoogle: async (point: string, contextInstruction: string): Promise<string> => {
            return `Realize uma pesquisa na web sobre: "${point}".\n\n${contextInstruction}\n\nVocê DEVE utilizar a ferramenta de pesquisa do Google para fundamentar sua resposta. Retorne uma resposta estritamente formatada em MARKDOWN (texto puro), seguindo EXATAMENTE esta estrutura de seções:\n\n# ANÁLISE\n[análise detalhada do tema]...\n\n# ARGUMENTOS\n\n## ARGUMENTO: [Título Curto 1]\n[Fundamentação 1]...\n\n## ARGUMENTO: [Título Curto 2]\n[Fundamentação 2]...\n\n(etc.)\n\nIMPORTANTE: 1. NÃO use JSON. 2. NÃO invente links.`;
        },

        continuarGeracao: async (lastChunk: string): Promise<PromptFactoryResult> => {
            const text = isPT 
                ? `[SISTEMA: CONTINUAÇÃO] A geração do texto anterior foi interrompida. Continue a redação EXATAMENTE de onde parou, mantendo a coerência, o estilo e a formatação do documento. O trecho final foi:\n"...${lastChunk}"\n\nNÃO repita o trecho final acima. Comece imediatamente a completar a frase ou parágrafo.` 
                : `[SYSTEM: CONTINUATION] The previous text generation was interrupted. Continue writing EXACTLY from where it left off, maintaining the document's coherence, style, and formatting. The final excerpt was:\n"...${lastChunk}"\n\nDO NOT repeat the final excerpt above. Start immediately to complete the sentence or paragraph.`;
            return { contents: [textPart(text)] };
        }
    };
};
