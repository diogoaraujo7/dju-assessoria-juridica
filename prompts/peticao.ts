
import { Language, WorkflowTriggers } from '../types';
import { PromptFactoryResult } from './types';
import { textPart, getStyleInstructions } from './helpers';
import { fileToGenerativePart } from '../utils/fileUtils';
import * as schemas from '../schemas';
import { Part } from '@google/genai';

export const getPeticaoPrompts = (_lang: Language) => {
    return {
        peticaoExtrairDados: async (narrativa: string, userFiles?: File[]): Promise<PromptFactoryResult> => {
            const fileParts = userFiles ? await Promise.all(userFiles.map(fileToGenerativePart)) : [];
            const promptText = `[DJU PETIÇÕES - EXTRAÇÃO DE DADOS]\nAnalise a seguinte narrativa dos fatos e os arquivos anexos de uma petição inicial.\nExtraia as informações e retorne um objeto JSON.\nIMPORTANTE: Não extraia a narrativa dos fatos, nem o endereçamento/juízo competente.\nVerifique se há indício de pedido de tutela de urgência/liminar na narrativa e marque o campo 'hasInjunction' como true, caso contrário false.\n\nNARRATIVA:\n${narrativa}`;
            
            return {
                contents: [
                    ...fileParts,
                    textPart(promptText)
                ],
                schema: schemas.peticaoExtrairDadosSchema,
                zodSchema: schemas.zPeticaoExtrairDadosSchema
            };
        },

        peticaoIdentificarPartes: async (petitionType: string | null, factsText: string, userFiles: File[]): Promise<PromptFactoryResult> => {
            const fileParts = userFiles ? await Promise.all(userFiles.map(fileToGenerativePart)) : [];
            const promptText = `[DJU PETIÇÕES - IDENTIFICAÇÃO DE PARTES] O usuário está elaborando uma peça do tipo: "${petitionType}".\nBaseado na seguinte narrativa dos fatos e nos arquivos anexos, identifique TODOS OS AUTORES (polo ativo) e TODOS OS RÉUS (polo passivo).\nRetorne a resposta como um objeto JSON com as chaves "autores" e "reus", contendo uma lista de nomes completos para cada. Se um polo não for identificável, retorne um array vazio.`;
            
            return {
                contents: [
                    ...fileParts,
                    textPart(promptText),
                    textPart(`\n\n--- NARRATIVA DOS FATOS ---\n${factsText}`)
                ],
                schema: schemas.peticaoIdentificarPartesSchema,
                zodSchema: schemas.zPeticaoIdentificarPartesSchema
            };
        },

        peticaoAnalisePreliminar: async (petitionType: string | null, contextText: string, contextFiles?: File[]): Promise<PromptFactoryResult> => {
            const fileParts = contextFiles ? await Promise.all(contextFiles.map(fileToGenerativePart)) : [];
            const promptText = `Siga as 'INSTRUÇÕES PARA DJU PETIÇÕES'. O usuário está elaborando uma peça do tipo "${petitionType}".\nCom base nos autos do processo e no relato:\n1. Identifique TODOS os autores e réus.\n2. Elabore um RELATO DETALHADO DOS FATOS. OBRIGATÓRIO: Use sintaxe Markdown estrita, com títulos (##) e subtítulos (###) sempre em linhas isoladas, precedidos por duas quebras de linha (\\n\\n). Evite blocos de texto contínuos com marcações no meio da frase.\n3. Identifique os PONTOS CONTROVERTIDOS.\n4. Identifique até 3 PEÇAS/DECISÕES CHAVES do processo para sugestão de botões de fundamentos (ex: Inicial, Contestação, Sentença).\nRetorne JSON conforme schema.`;
            
            const contents: Part[] = [
                textPart(promptText),
                ...fileParts,
            ];
            if (contextText && contextText.trim() !== '') {
                contents.push(textPart(contextText));
            }
            
            return {
                contents,
                schema: schemas.peticaoAnalisePreliminarSchema,
                zodSchema: schemas.zPeticaoAnalisePreliminarSchema
            };
        },

        peticaoAnalisarAutos: async (petitionType: string | null, representedParty: string | null, contextText: string, contextFiles?: File[]): Promise<PromptFactoryResult> => {
            const fileParts = contextFiles ? await Promise.all(contextFiles.map(fileToGenerativePart)) : [];
            const promptText = `Siga as 'INSTRUÇÕES PARA DJU PETIÇÕES'. O usuário está elaborando uma peça do tipo "${petitionType}" e representa a parte: "${representedParty}".\nCom base nisso e nos autos do processo, sua tarefa é:\n1. Elaborar um RELATO DETALHADO DOS FATOS. OBRIGATÓRIO: Use sintaxe Markdown estrita, com títulos (##) e subtítulos (###) sempre em linhas isoladas, precedidos por duas quebras de linha (\\n\\n). Evite blocos de texto contínuos com marcações no meio da frase.\n2. Identificar os PONTOS CONTROVERTIDOS da demanda.\n3. Sugerir até 3 PEÇAS/DECISÕES CHAVES do processo para botões de acesso rápido (ex: Fundamentos da Inicial, Tese da Contestação, Pontos da Sentença).\nResponda com um objeto JSON.`;
            
            const contents: Part[] = [
                textPart(promptText),
                ...fileParts,
            ];
            if (contextText && contextText.trim() !== '') {
                contents.push(textPart(contextText));
            }
            
            return {
                contents,
                schema: schemas.analiseProcessualSchema,
                zodSchema: schemas.zAnaliseProcessualSchema
            };
        },

        peticaoGerarSugestoes: async (representedParty: string | null, pontosControvertidosText: string, petitionType: string | null, contextText: string | null, contextFiles?: File[]): Promise<PromptFactoryResult> => {
            const contextFileParts = contextFiles ? await Promise.all(contextFiles.map(fileToGenerativePart)) : [];
            const promptText = `[PETIÇÃO - SUGESTÃO DE BASES] O usuário representa: ${representedParty}. O usuário pediu sugestões para os pontos controvertidos:\n${pontosControvertidosText}\nTipo de Peça: ${petitionType}.\n\nPreencha os campos solicitados com os argumentos favoráveis para cada ponto controvertido.\nIMPORTANTE: A lista de argumentos ('argumentosFavoraveis') é OBRIGATÓRIA. Se não houver argumentos, retorne uma lista vazia. NÃO omita o campo.\n\nDIRETRIZ: Escreva os argumentos com viés de parte (autor ou réu, conforme o caso), de forma persuasiva e autoral.`;
            
            const parts: Part[] = [textPart(promptText)];
            if (contextText || contextFileParts.length > 0) {
                parts.push(textPart("--- DADOS DO PROCESSO (Contexto para embasar as sugestões) ---"));
                if (contextText) parts.push(textPart(`Descrição dos dados do processo: ${contextText}`));
                parts.push(...contextFileParts);
            }

            return {
                contents: parts,
                schema: schemas.peticaoGerarSugestoesSchema,
                zodSchema: schemas.zPeticaoGerarSugestoesSchema
            };
        },

        peticaoElaborarMinutaFinal: async (petitionType: string | null, representedParty: string | null, summary: string, points: string, basesInputText: string, userTemplateText: string, templateFiles?: File[], contextFiles?: File[], argumentFiles?: File[], lengthValue?: number, toneValue?: number): Promise<PromptFactoryResult> => {
            const templateFileParts = templateFiles ? await Promise.all(templateFiles.map(fileToGenerativePart)) : [];
            const contextFileParts = contextFiles ? await Promise.all(contextFiles.map(fileToGenerativePart)) : [];
            const argumentFileParts = argumentFiles ? await Promise.all(argumentFiles.map(fileToGenerativePart)) : [];
         
            let mainPromptText = `Tipo de Petição: ${petitionType}. Parte representada: ${representedParty}. \n\nResumo: ${summary}. \n\nPONTOS:\n${points}. A partir de agora, assuma a persona do jurista responsável pela elaboração da petição. Após a leitura do BLOCO DE ANOTAÇÕES (Texto do Bloco de Anotações e Anexos do Bloco de Anotações), apresente a minuta da petição elaborada, com redação inteiramente original. MUITO IMPORTANTE: O BLOCO DE ANOTAÇÕES em si, de uso interno, NÃO faz parte do processo e, portanto, NUNCA é mencionado no texto da petição. O que pode ser mencionado no texto da petição, por exemplo, é a legislação, doutrina e/ou jurisprudência que constem no BLOCO DE ANOTAÇÕES. Os textos e anexos que compõem o BLOCO DE ANOTAÇÕES são a fonte soberana do seu entendimento e do seu raciocínio jurídico subjacente à elaboração da fundamentação do texto da petição, pois contém argumentos, legislação, doutrina e/ou jurisprudência cujos entendimentos você adotou, por suas razões e convicções, enquanto responsável pela elaboração do texto da petição, a partir de suas pesquisas anteriores, conhecimento prévio e/ou convicção pessoal, ainda que sejam entendimentos contrários a alguma jurisprudência, por exemplo. A argumentação deve ser FAVORÁVEL (viés) à parte representada. Não use emojis.`;

            if (basesInputText.includes(WorkflowTriggers.ANALYSIS_DISMISSED) || basesInputText.includes(WorkflowTriggers.DISPENSE_CMD)) { 
                mainPromptText += ` IMPORTANTE: Para os pontos controvertidos onde estiver indicado que "a análise foi dispensada", NÃO elabore qualquer análise ou fundamentação. O ato final deve omitir completamente qualquer menção a esses pontos, como se eles não existissem, sem nenhuma justificativa para a ausência da análise.`; 
            }
            
            mainPromptText += getStyleInstructions(lengthValue, toneValue);

            const contents: Part[] = [
                textPart(mainPromptText),
                textPart(`\n\n<INÍCIO DO BLOCO DE ANOTAÇÕES>\n Texto do Bloco de Anotações: ${basesInputText}.\n\nAnexos do Bloco de Anotações:`),
                ...argumentFileParts,
                textPart(`</FINAL DO BLOCO DE ANOTAÇÕES>`), 
            ];
            
            if (userTemplateText || templateFileParts.length > 0) {
                contents.push(textPart(`\n\nTEMPLATE/INSTRUÇÕES:`));
                contents.push(...templateFileParts);
                if (userTemplateText) contents.push(textPart(userTemplateText));
            }
            
            contents.push(textPart(`\n\nDADOS DO PROCESSO:`));
            contents.push(...contextFileParts);
            
            return { contents };
        },

        peticaoElaborarEspecial: async (petitionType: string | null, representedParty: string | null, summary: string, points: string, userTemplateText: string, templateFiles?: File[], lengthValue?: number, toneValue?: number): Promise<PromptFactoryResult> => {
            const templateFileParts = templateFiles ? await Promise.all(templateFiles.map(fileToGenerativePart)) : [];
            
            const SPECIAL_INSTRUCTIONS_MAP: Record<string, string> = {
                'sustentação oral': 'Elabore um Roteiro (e bullet points) para Sustentação Oral.',
                'oral argument': 'Elabore um Roteiro (e bullet points) para Sustentação Oral.',
                'quesitos periciais': 'Elabore os Quesitos Periciais.',
                'expert questions': 'Elabore os Quesitos Periciais.',
                'perguntas para audiência': 'Elabore as Perguntas para a Audiência de Instrução e Julgamento.',
                'hearing questions': 'Elabore as Perguntas para a Audiência de Instrução e Julgamento.'
            };

            const lowerType = petitionType?.toLowerCase() || '';

            // 1. Tenta encontrar uma instrução específica no mapa
            let specialInstruction = Object.entries(SPECIAL_INSTRUCTIONS_MAP).find(
                ([key]) => lowerType.includes(key)
            )?.[1];

            // 2. Se não encontrou (é um novo tipo de petição especial), 
            // gera uma instrução genérica, mas correta
            if (!specialInstruction) {
                specialInstruction = `Elabore o conteúdo técnico (com os respectivos tópicos) para: ${petitionType}.`;
            }
            
            let promptText = `Siga as 'INSTRUÇÕES PARA DJU PETIÇÕES'.\nTAREFA ESPECIAL: ${specialInstruction}\nA peça solicitada é: "${petitionType}".\nO usuário representa a parte: "${representedParty}".\n\nBaseie-se nos dados do processo e nos pontos controvertidos identificados. O resultado deve ser uma lista estruturada de tópicos, conforme o caso. Não redija uma peça processual formal completa.\n\nOBRIGATÓRIO: Use as tags [INÍCIO DO ATO] e [FIM DO ATO] para envolver o resultado.\n\nRElATO DETALHADO DOS FATOS:\n${summary}\n\nPONTOS CONTROVERTIDOS:\n${points}`;

            promptText += getStyleInstructions(lengthValue, toneValue);

            const contents: Part[] = [
                textPart(promptText),
            ];
            
            if (userTemplateText || templateFileParts.length > 0) {
                contents.push(textPart(`\n\nTEMPLATE/INSTRUÇÕES:`));
                contents.push(...templateFileParts);
                if (userTemplateText) contents.push(textPart(userTemplateText));
            }
            
            return { contents };
        },

    };
};
