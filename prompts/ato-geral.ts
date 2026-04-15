import { Language, WorkflowTriggers } from '../types';
import { PromptFactoryResult } from './types';
import { textPart, getStyleInstructions } from './helpers';
import { fileToGenerativePart } from '../utils/fileUtils';
import * as schemas from '../schemas';
import { WRITING_GUIDELINES } from './guidelines';
import { Part } from '@google/genai';

export const getAtoGeralPrompts = (lang: Language) => {
    const isPT = lang === 'pt-BR';

    return {
        atoElaborarAto: async (userInputText: string): Promise<PromptFactoryResult> => {
            const text = isPT 
                ? `O usuário solicitou uma nova elaboração do ato com as seguintes instruções: ${userInputText}` 
                : `The user requested a new draft of the act with the following instructions: ${userInputText}`;
            return { contents: [textPart(text)] };
        },

        atoDadosProcesso: async (atoType: string | null, userText: string, userFiles?: File[]): Promise<PromptFactoryResult> => {
            const fileParts = userFiles ? await Promise.all(userFiles.map(fileToGenerativePart)) : [];
            const promptText = `[INÍCIO DO FLUXO] Tarefa: Elaborar Ato Decisório ou Parecer.
Tipo de Ato: ${atoType}.
Siga as 'INSTRUÇÕES PARA ELABORAÇÃO DE ATO'.
Analise os documentos e o relato do usuário para:
1. Gerar o relato detalhado (com minúcias) e completo dos fatos do processo. OBRIGATÓRIO: Use sintaxe Markdown estrita, com títulos (##) e subtítulos (###) sempre em linhas isoladas, precedidos por duas quebras de linha (\\n\\n). Evite blocos de texto contínuos com marcações no meio da frase.
2. Identificar os PONTOS CONTROVERTIDOS.
3. Identificar até 5 PEÇAS/DECISÕES CHAVES do processo para sugestão de botões, considerando as teses jurídicas e as petições e decisões anteriores, se houver, possivelmente relevantes para a solução da controvérsia.
Responda com um objeto JSON.`;
            
            const contents: Part[] = [...fileParts];
            if (userText && userText.trim() !== '') {
                contents.push(textPart(`Informações sobre o processo: ${userText}`));
            }
            contents.push(textPart(promptText));
            
            return {
                contents,
                schema: schemas.analiseProcessualSchema,
                zodSchema: schemas.zAnaliseProcessualSchema
            };
        },

        atoGerarSugestoes: async (pontosControvertidosText: string, contextText: string | null, contextFiles?: File[]): Promise<PromptFactoryResult> => {
            const contextFileParts = contextFiles ? await Promise.all(contextFiles.map(fileToGenerativePart)) : [];
            const promptText = `Apresente sugestões de argumentos jurídicos válidos em relação aos pontos controvertidos:\n${pontosControvertidosText}\n\n
Preencha os campos solicitados com os argumentos favoráveis e contrários para cada ponto controvertido.
IMPORTANTE: As listas de argumentos ('argumentosFavoraveis', 'argumentosContrarios') são OBRIGATÓRIAS. Se não houver argumentos para um lado, retorne uma lista vazia. NÃO omita os campos.
${WRITING_GUIDELINES}`;

            const parts: Part[] = [textPart(promptText)];
            if (contextText || contextFileParts.length > 0) {
                parts.push(textPart("--- DADOS DO PROCESSO (Contexto para embasar as sugestões) ---"));
                if (contextText) parts.push(textPart(`Informações sobre o processo: ${contextText}`));
                parts.push(...contextFileParts);
            }

            return {
                contents: parts,
                schema: schemas.atoGerarSugestoesSchema,
                zodSchema: schemas.zAtoGerarSugestoesSchema
            };
        },

        atoElaborarMinutaFinal: async (atoType: string | null, summary: string, points: string, basesInputText: string, userTemplateText: string, templateFiles?: File[], contextFiles?: File[], argumentFiles?: File[], lengthValue?: number, toneValue?: number): Promise<PromptFactoryResult> => {
            const templateFileParts = templateFiles ? await Promise.all(templateFiles.map(fileToGenerativePart)) : [];
            const contextFileParts = contextFiles ? await Promise.all(contextFiles.map(fileToGenerativePart)) : [];
            const argumentFileParts = argumentFiles ? await Promise.all(argumentFiles.map(fileToGenerativePart)) : [];

            let mainPromptText = `Tipo de Ato: ${atoType}. \n\nResumo: ${summary}. \n\nPONTOS:\n${points}. A partir de agora, assuma a persona do jurista responsável pela elaboração do ato. Após a leitura do BLOCO DE ANOTAÇÕES (Texto do Bloco de Anotações e Anexos do Bloco de Anotações), apresente a minuta do ato elaborado, com redação inteiramente original. MUITO IMPORTANTE: O BLOCO DE ANOTAÇÕES em si, de uso interno, NÃO faz parte do processo e, portanto, NUNCA é mencionado no texto do ato. O que pode ser mencionado no texto do ato, por exemplo, é a legislação, doutrina e/ou jurisprudência que constem no BLOCO DE ANOTAÇÕES. Os textos e anexos que compõem o BLOCO DE ANOTAÇÕES são a fonte soberana do seu entendimento e do seu raciocínio jurídico subjacente à elaboração da fundamentação do texto do ato, pois contém argumentos, legislação, doutrina e/ou jurisprudência cujos entendimentos você adotou, por suas razões e convicções, enquanto responsável pela elaboração do texto do ato, a partir de suas pesquisas anteriores, conhecimento prévio e/ou convicção pessoal, ainda que sejam entendimentos contrários às alegações das partes e/ou à jurisprudência.`;

            if (basesInputText.includes(WorkflowTriggers.ANALYSIS_DISMISSED) || basesInputText.includes(WorkflowTriggers.DISPENSE_CMD)) { 
                mainPromptText += ` IMPORTANTE: Para os pontos controvertidos onde estiver indicado que "a análise foi dispensada", NÃO elabore qualquer análise ou fundamentação. O ato final deve omitir completamente qualquer menção a esses pontos, como se eles não existissem, sem nenhuma justificativa para a ausência da análise.`; 
            }

            mainPromptText += getStyleInstructions(lengthValue, toneValue);

            const contents: Part[] = [
                textPart(mainPromptText),
                textPart(`\n\n<INÍCIO DO BLOCO DE ANOTAÇÕES>\n Texto do Bloco de Anotações: ${basesInputText}.\n\nAnexos do Bloco de Anotações:`),
                ...argumentFileParts,
                textPart(`</FINAL DO BLOCO DE ANOTAÇÕES>`), 
                textPart(`\n\n--- DADOS DO PROCESSO: ---`),
                ...contextFileParts,                    
            ];
            
            if (userTemplateText || templateFileParts.length > 0) {
                contents.push(textPart(`\n\nTEMPLATE/INSTRUÇÕES:`));
                contents.push(...templateFileParts);
                if (userTemplateText) contents.push(textPart(userTemplateText));
            }

            return { contents };
        }
    };
};
