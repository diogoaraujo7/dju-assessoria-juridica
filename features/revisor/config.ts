
import { Step, StepType, Language } from '../../types';
import { StepConfig } from '../../stepConfig';

export const getRevisorConfig = (lang: Language): Partial<Record<Step, StepConfig>> => {
    const isPT = lang === 'pt-BR';

    return {
        [Step.REVISOR_UPLOAD_LINHA_BASE]: {
            title: isPT ? '1. Linha de Base' : '1. Baseline Documents',
            subtitle: isPT ? 'Anexe os documentos que servirão como verdade processual (ex: petição inicial, recurso, provas).' : 'Attach the documents that will serve as the procedural truth (e.g., initial petition, appeal, evidence).',
            stepType: StepType.DOCUMENT,
            hasUniversalInput: true,
            isPrimaryInput: true,
        },
        [Step.REVISOR_UPLOAD_DOC_ANALISE]: {
            title: isPT ? '2. Documento para Análise' : '2. Document for Analysis',
            subtitle: isPT ? 'Anexe o documento que você deseja revisar ou auditar (ex: sentença, voto, minuta).' : 'Attach the document you want to review or audit (e.g., sentence, vote, draft).',
            stepType: StepType.DOCUMENT,
            hasUniversalInput: true,
            isPrimaryInput: true,
        },
        [Step.REVISOR_ANALISE]: {
            title: isPT ? '3. Relatório da Análise' : '3. Analysis Report',
            subtitle: isPT ? 'Confira o relatório detalhado da análise realizada.' : 'Check the detailed report of the analysis performed.',
            stepType: StepType.DOCUMENT,
            isFinalDocument: false, 
        },
        [Step.REVISOR_RESULTADO_FINAL]: {
            title: isPT ? '4. Documento Revisado' : '4. Revised Document',
            subtitle: isPT ? 'Abaixo está o documento reescrito aplicando as soluções e aprimoramentos indicados no relatório.' : 'Below is the rewritten document applying the solutions and improvements indicated in the report.',
            stepType: StepType.DOCUMENT,
            isFinalDocument: true,
        }
    };
};
