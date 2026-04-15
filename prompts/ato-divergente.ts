import { Language, WorkflowTriggers } from '../types';
import { PromptFactoryResult } from './types';
import { textPart, getStyleInstructions } from './helpers';
import { fileToGenerativePart } from '../utils/fileUtils';
import * as schemas from '../schemas';
import { WRITING_GUIDELINES } from './guidelines';
import { Part } from '@google/genai';

export const getAtoDivergentePrompts = (_lang: Language) => {
    return {
        atoVotoRelator: async (atoType: string | null, userText: string, userFiles: File[] | undefined, contextText: string, contextFiles: File[] | undefined): Promise<PromptFactoryResult> => {
            const relatorFileParts = userFiles ? await Promise.all(userFiles.map(fileToGenerativePart)) : [];
            const dadosProcessoParts = contextFiles ? await Promise.all(contextFiles.map(fileToGenerativePart)) : [];
            
            const promptText = `[INÍCIO DO FLUXO - VOTO DIVERGENTE]
Tipo de Ato: ${atoType}.
O usuário forneceu os DADOS DO PROCESSO (arquivos/texto anteriores) e agora forneceu o VOTO DO RELATOR (arquivos/texto atuais).
Sua tarefa é analisar TUDO e gerar um objeto JSON com três chaves:
1. 'sinteseVoto': Uma síntese detalhada do voto do relator.
2. 'pontosControvertidos': Uma string contendo a lista dos pontos controvertidos identificados no voto.
3. 'sugestoesBotoes': Identificar até 5 PEÇAS/DECISÕES CHAVES do processo para sugestão de botões, considerando as teses jurídicas e as petições e decisões anteriores, se houver, possivelmente relevantes para fundamentar a divergência em relação ao voto do relator.
Responda com um objeto JSON.`;


            const contents: Part[] = [
                textPart(promptText),
                textPart("--- DADOS DO PROCESSO ---"),
                ...dadosProcessoParts,
            ];
            if (contextText && contextText.trim() !== '') {
                contents.push(textPart(`Informações sobre o processo: ${contextText}`));
            }
            contents.push(textPart("--- VOTO DO RELATOR ---"));
            contents.push(...relatorFileParts);
            if (userText && userText.trim() !== '') {
                contents.push(textPart(`Texto do voto do relator: ${userText}`));
            }

            return {
                contents,
                schema: schemas.analiseVotoRelatorSchema,
                zodSchema: schemas.zAnaliseVotoRelatorSchema
            };
        },

        atoGerarSugestoesDivergencia: async (pontosSelecionados: string, contextText: string | null, votoRelatorText: string | null, contextFiles?: File[]): Promise<PromptFactoryResult> => {
            const contextFileParts = contextFiles ? await Promise.all(contextFiles.map(fileToGenerativePart)) : [];
            const promptText = `[ATO DECISÓRIO - VOTO DIVERGENTE] Apresente sugestões de argumentos jurídicos válidos para divergir do Voto do Relator em relação aos seguintes pontos:\n${pontosSelecionados}\n\n
Preencha os campos solicitados com os argumentos para divergir (contrários) para cada ponto controvertido.
IMPORTANTE: A lista de argumentos ('argumentosContrarios') é OBRIGATÓRIA. Se não houver argumentos para um ponto, retorne uma lista vazia. NÃO omita o campo.
${WRITING_GUIDELINES}`;

            const parts: Part[] = [textPart(promptText)];
            if (contextText || votoRelatorText || contextFileParts.length > 0) {
                parts.push(textPart("--- CONTEXTO PARA EMBASAR AS SUGESTÕES ---"));
                if (contextText) parts.push(textPart(`Informações sobre o processo: ${contextText}`));
                if (votoRelatorText) parts.push(textPart(`Texto do voto do relator: ${votoRelatorText}`));
                parts.push(...contextFileParts);
            }

            return {
                contents: parts,
                schema: schemas.atoGerarSugestoesDivergenciaSchema,
                zodSchema: schemas.zAtoGerarSugestoesDivergenciaSchema
            };
        },

        atoElaborarMinutaFinalDivergente: async (atoType: string | null, summary: string, pontosSelecionados: string, basesInputText: string, userTemplateText: string, templateFiles?: File[], contextFiles?: File[], argumentFiles?: File[], votoRelatorText?: string | null, lengthValue?: number, toneValue?: number): Promise<PromptFactoryResult> => {
            const templateFileParts = templateFiles ? await Promise.all(templateFiles.map(fileToGenerativePart)) : [];
            const contextFileParts = contextFiles ? await Promise.all(contextFiles.map(fileToGenerativePart)) : [];
            const argumentFileParts = argumentFiles ? await Promise.all(argumentFiles.map(fileToGenerativePart)) : [];

            let promptText = `Tipo de Ato: ${atoType}. \n\nResumo: ${summary}. A partir de agora, assuma a persona do jurista responsável pela elaboração do voto divergente. Após a leitura do BLOCO DE ANOTAÇÕES (Texto do Bloco de Anotações e Anexos do Bloco de Anotações), apresente a minuta do voto divergente, com redação inteiramente original. MUITO IMPORTANTE: O BLOCO DE ANOTAÇÕES em si, de uso interno, NÃO faz parte do processo e, portanto, NUNCA é mencionado no texto do ato. O que pode ser mencionado no texto do ato, por exemplo, é a legislação, doutrina e/ou jurisprudência que constem no BLOCO DE ANOTAÇÕES. Os textos e anexos que compõem o BLOCO DE ANOTAÇÕES são a fonte soberana do seu entendimento e do seu raciocínio jurídico subjacente à elaboração da fundamentação do texto do ato, pois contém argumentos, legislação, doutrina e/ou jurisprudência cujos entendimentos você adotou, por suas razões e convicções, enquanto responsável pela elaboração do texto do ato, a partir de suas pesquisas anteriores, conhecimento prévio e/ou convicção pessoal, ainda que sejam entendimentos contrários às alegações das partes e/ou à jurisprudência. DIRETRIZ GRAMATICAL ESPECÍFICA: NUNCA utilize a palavra "diverjo", pois não é uma forma verbal correta.`;

            if (pontosSelecionados) {
                promptText += `\n\nA divergência refere-se especificamente aos seguintes pontos controvertidos:\n${pontosSelecionados}`;
            }

            if (basesInputText === WorkflowTriggers.SKIP_BASES) { promptText += ` A etapa de bases foi pulada.`; } 
            else if (basesInputText.includes(WorkflowTriggers.ANALYSIS_DISMISSED) || basesInputText.includes(WorkflowTriggers.DISPENSE_CMD)) { promptText += ` Para os pontos controvertidos onde o usuário indicou "a análise foi dispensada", NÃO elabore qualquer análise ou fundamentação. O ato final deve omitir completamente qualquer menção a esses pontos, como se eles não existissem, sem nenhuma justificativa para a ausência da análise.`; }

            promptText += getStyleInstructions(lengthValue, toneValue);

            const contents: Part[] = [
                textPart(promptText),
                textPart(`\n\n<INÍCIO DO BLOCO DE ANOTAÇÕES (ARGUMENTOS PARA A DIVERGÊNCIA)>\n Texto do Bloco de Anotações: ${basesInputText}.\n\nAnexos do Bloco de Anotações:`),
                ...argumentFileParts,
                textPart(`</FINAL DO BLOCO DE ANOTAÇÕES (ARGUMENTOS PARA A DIVERGÊNCIA)>`),
                textPart("\n\n--- DADOS DO PROCESSO E VOTO DO RELATOR: ---"),
                ...contextFileParts,
            ];

            if (votoRelatorText) {
                contents.push(textPart(`Texto do voto do relator: ${votoRelatorText}`));
            }
            
            if (userTemplateText || templateFileParts.length > 0) {
                if (userTemplateText) contents.push(textPart(`Template/Instruções: ${userTemplateText}`));
                contents.push(...templateFileParts);
            }

            return { contents };
        }
    };
};
