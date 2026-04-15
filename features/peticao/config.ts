
import { Step, StepType, Language, AnalysisViewMode } from '../../types';
import { getUI } from '../../ui';
import * as schemas from '../../schemas';
import { StepConfig } from '../../stepConfig';

export const getPeticaoConfig = (lang: Language): Partial<Record<Step, StepConfig>> => {
    const isPT = lang === 'pt-BR';
    const UI = getUI(lang).sidebar;

    return {
        [Step.PETICAO_TIPO]: {
            title: isPT ? '1. Tipo de Peça Processual' : '1. Type of Petition',
            subtitle: isPT ? 'Selecione o tipo de peça processual que deseja elaborar.' : 'Select the type of procedural document you want to draft.',
            stepType: StepType.MULTIPLE_CHOICE,
            options: isPT ? [
                "1. Petição Inicial",
                "2. Contestação",
                "3. Réplica",
                "4. Reconvenção",
                "5. Cumprimento de Sentença",
                "6. Recurso (a especificar)",
                "7. Contrarrazões",
                "8. Embargos de Declaração",
                "9. Alegações Finais",
                "10. Memoriais",
                "11. Roteiro para Sustentação Oral",
                "12. Quesitos Periciais",
                "13. Perguntas para Audiência",
            ] : [
                "1. Initial Petition",
                "2. Contest/Defense",
                "3. Reply",
                "4. Counterclaim",
                "5. Compliance with Judgment",
                "6. Appeal (specify)",
                "7. Counter-arguments",
                "8. Embargoes of Declaration",
                "9. Closing Arguments",
                "10. Memorials",
                "11. Script for Oral Argument",
                "12. Expert Questions",
                "13. Hearing Questions",
            ],
            hasUniversalInput: true,
        },
        [Step.PETICAO_DADOS]: {
            title: isPT ? '2. Dados do Processo' : '2. Case Data',
            subtitle: isPT ? 'Forneça os dados do processo. Você pode descrever o caso aqui ou anexar os arquivos (PDF, Word, etc.).' : 'Provide the case data. You can describe the case here or attach files (PDF, Word, etc.).',
            stepType: StepType.DOCUMENT,
            hasUniversalInput: true,
            isPrimaryInput: true,
            outputSchema: schemas.zPeticaoExtrairDadosSchema,
        },
        [Step.PETICAO_ANALISE]: {
             title: isPT ? '3. Análise e Argumentos' : '3. Case Analysis',
             subtitle: isPT ? 'Informe as bases para a fundamentação e o resultado esperado:' : 'Review the analysis and provide arguments:',
             stepType: StepType.CHOICE_THEN_INPUT,
             options: isPT ? [
                'Quero fornecer as bases argumentativas',
                'Pedir sugestões de argumentos ao Dju'
            ] : [
                'Provide argumentative bases',
                'Ask Dju to suggest bases'
            ],
            sidebarSubItems: [
                { id: 'summary_and_menu', label: UI.summaryAndMenu, view: AnalysisViewMode.SUMMARY_AND_MENU },
                { id: 'points', label: UI.points, view: AnalysisViewMode.POINTS }
            ],
            isPrimaryInput: true,
            outputSchema: schemas.zPeticaoGerarSugestoesSchema,
        },
        [Step.PETICAO_TEMPLATE]: {
            title: isPT ? '4. Ajustes e Template' : '4. Adjustments and Template',
            subtitle: isPT ? 'Ajuste a extensão do texto e, se desejar, anexe um modelo ou digite instruções no campo de mensagens abaixo.' : 'Adjust the text length and, if you wish, attach a template or type instructions in the message field below.',
            hideTitle: true,
            stepType: StepType.DOCUMENT,
        },
        [Step.ELABORAR_PETICAO]: {
            title: isPT ? '5. Minuta da Petição' : '5. Petition Draft',
            subtitle: isPT ? 'Aqui está a minuta da sua peça processual.' : 'Here is the draft of your procedural document.',
            stepType: StepType.DOCUMENT,
            isFinalDocument: true,
        },
    };
};
