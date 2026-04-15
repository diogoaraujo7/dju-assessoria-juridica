
import { Step, StepType, Language, AtoType, AnalysisViewMode } from '../../types';
import { getUI } from '../../ui';
import * as schemas from '../../schemas';
import { StepConfig } from '../../stepConfig';

export const getAtoConfig = (lang: Language, atoType?: string | null): Partial<Record<Step, StepConfig>> => {
    const isPT = lang === 'pt-BR';
    const UI = getUI(lang).sidebar;
    const isParecer = atoType?.toLowerCase().includes('parecer');

    return {
        [Step.ELABORAR_ATO]: {
            title: isPT 
                ? (isParecer ? 'Minuta do Parecer' : 'Minuta do Ato Decisório')
                : (isParecer ? 'Legal Opinion Draft' : 'Draft Legal Decision'),
            subtitle: isPT 
                ? (isParecer ? 'Esta é a minuta do parecer gerada com base em todas as informações fornecidas.' : 'Esta é a minuta do ato decisório gerada com base em todas as informações fornecidas.')
                : (isParecer ? 'This is the draft legal opinion generated based on all provided information.' : 'This is the draft legal decision generated based on all provided information.'),
            stepType: StepType.DOCUMENT,
            isFinalDocument: true,
        },
        [Step.ATO_TIPO]: {
            title: isPT ? '1. Tipo de Ato' : '1. Type of Act',
            subtitle: isPT ? 'Escolha o tipo de ato que você precisa elaborar.' : 'Choose the type of act you need to draft.',
            stepType: StepType.MULTIPLE_CHOICE,
            options: isPT ? [
                '1. Decisão liminar',
                '2. Outras decisões',
                '3. Sentença',
                '4. Voto',
                `5. ${AtoType.VOTO_DIVERGENTE}`,
                '6. Parecer (ato opinativo)',
                '7. Outro (a especificar)'
            ] : [
                '1. Preliminary Decision (Liminar)',
                '2. Other Decisions',
                '3. Sentence',
                '4. Vote',
                '5. Divergent Vote',
                '6. Public Prosecutor Opinion',
                '7. Other (specify)'
            ],
            hasUniversalInput: true,
            hasProceedButton: false, 
        },
        [Step.ATO_DADOS_PROCESSO]: {
            title: isPT ? '2. Dados do Processo' : '2. Case Data',
            subtitle: isPT ? 'Forneça as informações do processo, como o contexto do caso e documentos relevantes.' : 'Provide case information, such as case context and relevant documents.',
            stepType: StepType.DOCUMENT,
            hasUniversalInput: true,
            isPrimaryInput: true,
            outputSchema: schemas.zAnaliseProcessualSchema,
        },
        [Step.ATO_VOTO_RELATOR]: {
            title: isPT ? '3. Voto do Relator' : '3. Rapporteur Vote',
            subtitle: isPT ? 'Anexe ou cole o texto do voto do Relator que será objeto da divergência para análise.' : 'Attach or paste the text of the Rapporteur\'s vote that will be the subject of divergence for analysis.',
            stepType: StepType.DOCUMENT,
            hasUniversalInput: true,
            isPrimaryInput: true,
            outputSchema: schemas.zAnaliseVotoRelatorSchema,
        },
        [Step.ATO_PONTOS_DIVERGENCIA]: {
            title: isPT ? '4. Pontos para Divergência' : '4. Points for Divergence',
            subtitle: isPT ? 'O Dju analisou o voto do Relator e identificou os seguintes pontos. Selecione de quais você deseja divergir.' : 'Dju analyzed the Rapporteur\'s vote and identified the following points. Select which ones you want to diverge from.',
            stepType: StepType.POINT_SELECTION,
        },
        [Step.ATO_ANALISE_PROCESSUAL]: {
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
            outputSchema: schemas.zAtoGerarSugestoesSchema, 
        },
        [Step.ATO_TEMPLATE]: {
            title: isPT ? '4. Ajustes e Template' : '4. Adjustments and Template',
            subtitle: isPT ? 'Ajuste a extensão do texto e, se desejar, anexe um modelo ou digite instruções no campo de mensagens abaixo.' : 'Adjust the text length and, if you wish, attach a template or type instructions in the message field below.',
            hideTitle: true,
            stepType: StepType.DOCUMENT,
        },
    };
};
