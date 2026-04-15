
import { Step, StepType, Language } from '../../types';
import { StepConfig } from '../../stepConfig';

export const getTemplateConfig = (lang: Language): Partial<Record<Step, StepConfig>> => {
    const isPT = lang === 'pt-BR';

    return {
        [Step.TEMPLATE_TIPO_DE_ATO]: {
            title: isPT ? '1. Tipo de Ato Processual' : '1. Type of Procedural Act',
            subtitle: isPT ? 'Selecione o tipo de ato para o qual deseja gerar um template.' : 'Select the type of act for which you want to generate a template.',
            stepType: StepType.MULTIPLE_CHOICE,
            options: isPT ? [
                "1. Decisão liminar",
                "2. Outras decisões",
                "3. Sentença",
                "4. Voto",
                "5. Decisão/Voto em Embargos de declaração",
                "6. Parecer",
                "7. Petição",
                "8. Outro (a especificar)"
            ] : [
                "1. Preliminary Decision",
                "2. Other Decisions",
                "3. Sentence",
                "4. Vote",
                "5. Decision/Vote in Embargoes of Declaration",
                "6. Public Prosecutor Opinion",
                "7. Petition",
                "8. Other (specify)"
            ],
            hasUniversalInput: true,
        },
        [Step.TEMPLATE_PETICAO_SUBTIPO]: {
            title: isPT ? '1.1. Tipo de Petição' : '1.1. Type of Petition',
            subtitle: isPT ? 'Especifique o tipo de petição.' : 'Specify the type of petition.',
            stepType: StepType.MULTIPLE_CHOICE,
            options: isPT ? [
                "7.1. Petição Inicial",
                "7.2. Contestação",
                "7.3. Réplica",
                "7.4. Reconvenção",
                "7.5. Recurso (a especificar)",
                "7.6. Contrarrazões",
                "7.7. Embargos de Declaração",
                "7.8. Alegações Finais",
                "7.9. Memoriais",
                "7.10. Acordo"
            ] : [
                "7.1. Initial Petition",
                "7.2. Contest/Defense",
                "7.3. Reply",
                "7.4. Counterclaim",
                "7.5. Appeal (specify)",
                "7.6. Counter-arguments",
                "7.7. Embargoes of Declaration",
                "7.8. Closing Arguments",
                "7.9. Memorials",
                "7.10. Settlement"
            ],
            hasUniversalInput: true,
        },
        [Step.TEMPLATE_UPLOAD]: {
            title: isPT ? '2. Modelos de Exemplo' : '2. Example Models',
            subtitle: isPT ? 'Anexe até três modelos (PDF, Word, etc.) do ato processual selecionado. O Dju analisará o estilo, vocabulário e formatação para criar um template personalizado.' : 'Attach up to three models (PDF, Word, etc.) of the selected procedural act. Dju will analyze style, vocabulary, and formatting to create a custom template.',
            stepType: StepType.DOCUMENT,
            hasUniversalInput: true,
            isPrimaryInput: true,
        },
        [Step.TEMPLATE_RESULTADO]: {
            title: isPT ? '3. Template Gerado' : '3. Generated Template',
            subtitle: isPT ? 'Este é o template personalizado, gerado com base nos modelos que você forneceu. Inclui instruções e o esqueleto do ato.' : 'This is the custom template, generated based on the models you provided. Includes instructions and the act skeleton.',
            stepType: StepType.DOCUMENT,
            isFinalDocument: true,
        },
    };
};
