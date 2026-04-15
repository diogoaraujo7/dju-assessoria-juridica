
import { Language } from '../types';
import { PromptFactoryResult } from './types';
import { textPart } from './helpers';
import { fileToGenerativePart } from '../utils/fileUtils';
import { Part } from '@google/genai';

export const getRevisorPrompts = (_lang: Language) => {
    return {
        revisorAnalisar: async (baselineText: string, baselineFiles: File[] | undefined, analysisText: string, analysisFiles: File[] | undefined): Promise<PromptFactoryResult> => {
            const baselineFileParts = baselineFiles ? await Promise.all(baselineFiles.map(fileToGenerativePart)) : [];
            const docAnalysisFileParts = analysisFiles ? await Promise.all(analysisFiles.map(fileToGenerativePart)) : [];
            
            const promptText = `[INÍCIO DO FLUXO - DJU RELATÓRIOS DE REVISÃO]\nSiga as 'INSTRUÇÕES PARA DJU RELATÓRIOS DE REVISÃO' - MÓDULO 5.\n\n1. Execute o FLUXO DE TRABALHO OPERACIONAL completo.\n2. Realize a ANÁLISE CRÍTICA (Etapa 4) comparando RIGOROSAMENTE o Documento de Análise com a Linha de Base.\n3. Gere o RESULTADO DA ANÁLISE (Etapa 7) utilizando OBRIGATORIAMENTE as tabelas Markdown para alertas (Contradição, Falta de Lastro, Inconsistência).\n4. Atribua a NOTA FINAL (0-10) seguindo os critérios de penalização.\n5. IMPORTANTE: Ao final do relatório, adicione OBRIGATORIAMENTE um bloco JSON contendo a lista de todas as sugestões de melhoria e correções apontadas, no seguinte formato exato:\n\`\`\`json\n[\n  { "id": "1", "description": "Descrição clara e acionável da correção 1" },\n  { "id": "2", "description": "Descrição clara e acionável da correção 2" }\n]\n\`\`\``;

            const contents: Part[] = [
                textPart(promptText),
                textPart("--- LINHA DE BASE (Verdade Processual) ---"),
                ...baselineFileParts,
            ];
            if (baselineText && baselineText.trim() !== '') {
                contents.push(textPart(`Texto relativo à Linha de Base: ${baselineText}`));
            }
            contents.push(textPart("--- DOCUMENTO EM ANÁLISE (Objeto da Revisão) ---"));
            contents.push(...docAnalysisFileParts);
            if (analysisText && analysisText.trim() !== '') {
                contents.push(textPart(`Texto relativo ao Documento em Análise: ${analysisText}`));
            }

            return {
                contents
            };
        },
        revisorAplicarCorrecoes: async (reportContent: string, originalDocumentText: string, selectedIds?: string[]): Promise<PromptFactoryResult> => {
            let selectedInstruction = "aplicando TODAS as soluções, correções e aprimoramentos recomendados no relatório.";
            if (selectedIds && selectedIds.length > 0) {
                selectedInstruction = `aplicando APENAS as soluções correspondentes aos seguintes IDs selecionados pelo usuário: ${selectedIds.join(', ')}. Ignore as demais sugestões do relatório.`;
            }

            const promptText = `[DJU RELATÓRIOS DE REVISÃO - APLICAÇÃO DE SOLUÇÕES]\nCom base no 'RELATÓRIO DE ANÁLISE' gerado anteriormente e no 'DOCUMENTO ORIGINAL' fornecido, sua tarefa é REESCREVER o documento original ${selectedInstruction}\n\nDIRETRIZES VINCULANTES:\n1. Mantenha a estrutura original do documento, alterando apenas os trechos necessários para corrigir as falhas (fidedignidade, consistência, omissões, etc.) apontadas.\n2. Para transcrições e dados, obedeça RIGOROSAMENTE às 'Diretrizes Vinculantes sobre Transcrições' e 'Fidedignidade'. Se houver falta de lastro confirmada, corrija removendo a informação sem base ou ajustando-a para refletir exatamente a Linha de Base.\n3. O resultado deve ser o texto final do documento revisado, pronto para uso. IMPORTANTE: RETORNE APENAS O TEXTO REVISADO. NÃO INCLUA SAUDAÇÕES, EXPLICAÇÕES OU TEXTO CONVERSACIONAL.\n\nRELATÓRIO DE ANÁLISE:\n${reportContent}\n\nDOCUMENTO ORIGINAL (PARA REESCRITA):\n${originalDocumentText}`;
            return {
                contents: [textPart(promptText)]
            };
        }
    };
};
