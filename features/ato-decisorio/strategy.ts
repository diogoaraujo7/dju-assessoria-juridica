
import { Step, StepData, StepType, UserAction, Task, AtoType, PetitionIdentifiers, isDivergent, WorkflowTriggers } from '../../types';
import { getStepConfig } from '../../stepConfig';
import { getPrompts } from '../../prompts/index';
import { executeWorkflowAction } from '../../services/workflowStepExecutor';
import { determineNextStep } from '../../services/workflowStateMachine';
import { getArgumentSuggestionsButtons, getUI } from '../../ui';
import { zAtoGerarSugestoesDivergenciaSchema } from '../../schemas';
import { StepStrategy } from '../../strategies/types';

/**
 * Strategy Map for Ato Decisorio Workflow.
 */
export const atoDecisorioStrategies: Record<string, StepStrategy> = {
    [Step.ELABORAR_ATO]: async (props, userInput) => {
        const { state } = props;
        const PROMPTS = getPrompts(state.language);
        
        const promptResult = await PROMPTS.atoElaborarAto(userInput.text);
        await executeWorkflowAction(props, {
            promptFactoryResult: promptResult,
            nextStep: Step.ELABORAR_ATO
        });
    },

    [Step.ATO_TIPO]: async (props, userInput) => {
        const { state, dispatch, onProcessComplete } = props;
        const { language } = state;
        const STEP_CONFIG = getStepConfig(language);
        const UI = getUI(language).actions;

        const isOther = userInput.text.includes(AtoType.OUTRO) || userInput.text.includes('Other');
        const isPlaceholder = userInput.text.includes(PetitionIdentifiers.SPECIFY_PLACEHOLDER_PT) || userInput.text.includes(PetitionIdentifiers.SPECIFY_PLACEHOLDER_EN);
        const isSpecified = userInput.text.includes(WorkflowTriggers.SPECIFY_KEYWORD_PT);

        if (isOther && isPlaceholder && !isSpecified) {
            dispatch({ type: 'UPDATE_STEP_DATA', payload: { step: Step.ATO_TIPO, data: { stepType: StepType.DOCUMENT, content: UI.specifyTypeInput, input: null } } });
            onProcessComplete(); 
            return;
        }

        dispatch({ type: 'SET_WORKFLOW_STATE', payload: { atoType: userInput.text } });
        const nextStep = determineNextStep(Step.ATO_TIPO, Task.ATO_DECISORIO, { ...state, atoType: userInput.text });
        
        const isDivergentFlow = isDivergent(userInput.text);
        const nextContent = isDivergentFlow ? UI.divergentFlowIntro : UI.standardFlowIntro(userInput.text);

        let nextStepConfigOverride: Partial<StepData> | null = null;
        if (isDivergentFlow) {
            nextStepConfigOverride = { ...STEP_CONFIG[Step.ATO_DADOS_PROCESSO], title: UI.caseDataTitle };
        }

        const stepDataToAdd = { [nextStep]: { ...(STEP_CONFIG[nextStep] as StepData), ...nextStepConfigOverride, content: nextContent, input: null } };
        dispatch({ type: 'ADVANCE_STEP', payload: { nextStep, stepDataToAdd } });
        onProcessComplete();
    },

    [Step.ATO_DADOS_PROCESSO]: async (props, userInput) => {
        const { state, dispatch, onProcessComplete } = props;
        const { atoType, language } = state;
        const STEP_CONFIG = getStepConfig(language);
        const PROMPTS = getPrompts(language);
        const UI = getUI(language).actions;

        dispatch({ 
            type: 'SET_WORKFLOW_STATE', 
            payload: { 
                crossStepContext: { 
                    textPayload: userInput.text, 
                    contextFiles: userInput.files
                } 
            } 
        });

        const isDivergentFlow = isDivergent(atoType);
        const nextStep = determineNextStep(Step.ATO_DADOS_PROCESSO, Task.ATO_DECISORIO, state);
        
        if (isDivergentFlow) {
            const nextContent = UI.divergentRequestRelator;
            
            const stepDataToAdd = { [nextStep]: { ...(STEP_CONFIG[nextStep] as StepData), content: nextContent, input: null } };
            dispatch({ type: 'ADVANCE_STEP', payload: { nextStep, stepDataToAdd } });
            onProcessComplete();
        } else {
            const promptResult = await PROMPTS.atoDadosProcesso(atoType, userInput.text, userInput.files);
            await executeWorkflowAction(props, {
                promptFactoryResult: promptResult,
                nextStep,
                nextStepConfigOverride: { subResponses: {} }
            });
        }
    },

    [Step.ATO_VOTO_RELATOR]: async (props, userInput) => {
        const { state, dispatch } = props;
        const { atoType, language } = state;
        const PROMPTS = getPrompts(language);

        const previousContextFiles = state.crossStepContext?.contextFiles || [];

        const promptResult = await PROMPTS.atoVotoRelator(
            atoType, 
            userInput.text, 
            userInput.files, 
            state.crossStepContext?.textPayload || '', 
            previousContextFiles
        );

        const newFiles = userInput.files || [];
        const combinedContextFiles = [...previousContextFiles, ...newFiles];
        
        dispatch({ 
            type: 'SET_WORKFLOW_STATE', 
            payload: { 
                crossStepContext: { 
                    textPayload: state.crossStepContext?.textPayload || '', 
                    votoRelatorText: userInput.text, 
                    contextFiles: combinedContextFiles
                } 
            } 
        });

        const nextStep = determineNextStep(Step.ATO_VOTO_RELATOR, Task.ATO_DECISORIO, state);
        
        await executeWorkflowAction(props, {
            promptFactoryResult: promptResult,
            nextStep
        });
    },

    [Step.ATO_PONTOS_DIVERGENCIA]: async (props, userInput) => {
        const { state, dispatch, onProcessComplete } = props;
        const { language, stepData } = state;
        const STEP_CONFIG = getStepConfig(language);
        const UI = getUI(language).actions;

        const nextStep = determineNextStep(Step.ATO_PONTOS_DIVERGENCIA, Task.ATO_DECISORIO, state);
        
        const currentStepData = stepData[Step.ATO_PONTOS_DIVERGENCIA];
        let dynamicSuggestionButtons = currentStepData?.suggestionButtons;
        
        const summaryToCarryOver = currentStepData?.summaryContent;

        if (!dynamicSuggestionButtons || dynamicSuggestionButtons.length === 0) {
            dynamicSuggestionButtons = getArgumentSuggestionsButtons(language);
        }

        const nextStepConfigOverride: Partial<StepData> = { 
            ...STEP_CONFIG[nextStep], 
            title: language === 'pt-BR' ? '5. Bases da Divergência' : '5. Bases for Divergence', 
            subtitle: UI.divergentBasesSubtitle, 
            stepType: StepType.CHOICE_THEN_INPUT, 
            options: UI.divergentOptions,
            outputSchema: zAtoGerarSugestoesDivergenciaSchema,
            suggestionButtons: dynamicSuggestionButtons
        };
        
        const contentWithPoints = language === 'pt-BR' 
            ? `Pontos selecionados para divergência:\n\n${userInput.text}` 
            : `Points selected for divergence:\n\n${userInput.text}`;

        dispatch({ type: 'UPDATE_STEP_DATA', payload: { step: Step.ATO_PONTOS_DIVERGENCIA, data: { input: { text: userInput.text } } } });

        const stepDataToAdd = { 
            [nextStep]: { 
                ...(STEP_CONFIG[nextStep] as StepData), 
                ...nextStepConfigOverride, 
                content: contentWithPoints, 
                summaryContent: summaryToCarryOver,
                input: null 
            } 
        };
        dispatch({ type: 'ADVANCE_STEP', payload: { nextStep, stepDataToAdd } });
        onProcessComplete();
    },

    [Step.ATO_ANALISE_PROCESSUAL]: async (props, userInput) => {
        const { state, dispatch, generateSuggestions, onProcessComplete } = props;
        const { atoType, stepData, language } = state;
        const ARGUMENT_BUTTONS = getArgumentSuggestionsButtons(language);
        const PROMPTS = getPrompts(language);
        const STEP_CONFIG = getStepConfig(language);

        const isDivergentFlow = isDivergent(atoType);
        const currentSuggestionButtons = stepData[Step.ATO_ANALISE_PROCESSUAL]?.suggestionButtons || ARGUMENT_BUTTONS;

        const isManualBases = userInput.actionId === UserAction.MANUAL_INPUT;
        const isRequestSuggestions = userInput.actionId === UserAction.GENERATE_SUGGESTIONS;

        if (isManualBases) {
            dispatch({ type: 'UPDATE_STEP_DATA', payload: { step: Step.ATO_ANALISE_PROCESSUAL, data: { input: { text: userInput.text, files: userInput.files?.map(f => f.name) }, suggestionButtons: currentSuggestionButtons } } });
        } 
        
        if (isRequestSuggestions) {
            dispatch({ type: 'UPDATE_STEP_DATA', payload: { step: Step.ATO_ANALISE_PROCESSUAL, data: { isGeneratingSuggestions: true, suggestions: undefined, input: { text: userInput.text, files: userInput.files?.map(f => f.name) } } } });
            
            const contextText = state.crossStepContext?.textPayload || null;
            const votoRelatorText = state.crossStepContext?.votoRelatorText || null;
            const contextFiles = state.crossStepContext?.contextFiles || [];

            if (isDivergentFlow) {
                const pontosSelecionados = stepData[Step.ATO_PONTOS_DIVERGENCIA]?.input?.text || stepData[Step.ATO_ANALISE_PROCESSUAL]?.content || '';
                const suggestionPromptResult = await PROMPTS.atoGerarSugestoesDivergencia(pontosSelecionados, contextText, votoRelatorText, contextFiles);
                generateSuggestions({ prompt: suggestionPromptResult.contents, schema: suggestionPromptResult.schema }, Step.ATO_ANALISE_PROCESSUAL);
            } else {
                const pontosControvertidosText = (userInput.text && userInput.text.length > 10) ? userInput.text : (stepData[Step.ATO_ANALISE_PROCESSUAL]?.content ?? '');
                const suggestionPromptResult = await PROMPTS.atoGerarSugestoes(pontosControvertidosText, contextText, contextFiles);
                generateSuggestions({ prompt: suggestionPromptResult.contents, schema: suggestionPromptResult.schema }, Step.ATO_ANALISE_PROCESSUAL);
            }
            return;
        } 
        
        const currentContext = state.crossStepContext;
        const previousContextFiles = currentContext?.contextFiles || [];
        const argumentFiles = userInput.files || [];

        dispatch({ 
            type: 'SET_WORKFLOW_STATE', 
            payload: { 
                crossStepContext: { 
                    textPayload: currentContext?.textPayload || '', 
                    votoRelatorText: currentContext?.votoRelatorText || '',
                    contextFiles: previousContextFiles,
                    argumentFiles: argumentFiles 
                } 
            } 
        });
        
        if (!isManualBases) {
             dispatch({ type: 'UPDATE_STEP_DATA', payload: { step: Step.ATO_ANALISE_PROCESSUAL, data: { input: { text: userInput.text, files: userInput.files?.map(f => f.name) } } } });
        }
        
        const nextStep = determineNextStep(Step.ATO_ANALISE_PROCESSUAL, Task.ATO_DECISORIO, state);
        
        let nextStepConfigOverride: Partial<StepData> = { hideTitle: true };
        
        const stepDataToAdd = { 
            [nextStep]: { 
                ...(STEP_CONFIG[nextStep] as StepData), 
                ...nextStepConfigOverride,
                content: '', 
                input: null 
            } 
        };
        
        dispatch({ type: 'ADVANCE_STEP', payload: { nextStep, stepDataToAdd } });
        onProcessComplete();
    },

    [Step.ATO_TEMPLATE]: async (props, userInput) => {
        const { state, dispatch } = props;
        const { atoType, stepData, language } = state;
        const STEP_CONFIG = getStepConfig(language);
        const ARGUMENT_BUTTONS = getArgumentSuggestionsButtons(language);
        const PROMPTS = getPrompts(language);
        const UI = getUI(language).actions;

        const isDivergentFlow = isDivergent(atoType);
        const basesInput = stepData[Step.ATO_ANALISE_PROCESSUAL]?.input;
        let basesInputText = basesInput?.text ?? 'Bases não fornecidas.';
        const dynamicButtons = stepData[Step.ATO_ANALISE_PROCESSUAL]?.suggestionButtons || ARGUMENT_BUTTONS;
        const cleanInputText = basesInputText.replace(WorkflowTriggers.BASES_PREFIX, '');

        const isSuggestion = dynamicButtons.some(b => 
            typeof b === 'string' ? b === cleanInputText : b.promptText === basesInputText
        );

        if (basesInputText && isSuggestion) {
            basesInputText = `${basesInputText}`;
        }

        let promptResult;
        let nextStepConfigOverride: Partial<StepData> = {};
        
        const argumentFiles = state.crossStepContext?.argumentFiles;
        const votoRelatorText = state.crossStepContext?.votoRelatorText || null;

        if (isDivergentFlow) {
            const summary = stepData[Step.ATO_ANALISE_PROCESSUAL]?.summaryContent ?? 'Relato não disponível.';
            const pontosSelecionados = stepData[Step.ATO_PONTOS_DIVERGENCIA]?.input?.text || '';
            promptResult = await PROMPTS.atoElaborarMinutaFinalDivergente(
                atoType,
                summary,
                pontosSelecionados,
                basesInputText, 
                userInput.text, 
                userInput.files, 
                state.crossStepContext?.contextFiles,
                argumentFiles, 
                votoRelatorText,
                userInput.lengthValue,
                userInput.toneValue
            );
            nextStepConfigOverride = { ...STEP_CONFIG[Step.ELABORAR_ATO], title: language === 'pt-BR' ? '7. Minuta do Voto Divergente' : '7. Divergent Vote Draft' };
        } else {
            const summary = stepData[Step.ATO_ANALISE_PROCESSUAL]?.summaryContent ?? 'Não foi gerado um relato.';
            const points = stepData[Step.ATO_ANALISE_PROCESSUAL]?.content ?? 'Não foram gerados pontos controvertidos.';
            promptResult = await PROMPTS.atoElaborarMinutaFinal(
                atoType, 
                summary, 
                points, 
                basesInputText, 
                userInput.text,
                userInput.files, 
                state.crossStepContext?.contextFiles,
                argumentFiles,
                userInput.lengthValue,
                userInput.toneValue
            );
            const isOpinion = atoType?.includes(AtoType.PARECER);
            nextStepConfigOverride = { 
                ...STEP_CONFIG[Step.ELABORAR_ATO], 
                title: isOpinion ? UI.draftOpinionTitle : UI.draftDecisionTitle 
            };
        }
        dispatch({ type: 'SET_WORKFLOW_STATE', payload: { crossStepContext: null } });

        const nextStep = determineNextStep(Step.ATO_TEMPLATE, Task.ATO_DECISORIO, state);
        
        await executeWorkflowAction(props, {
            promptFactoryResult: promptResult,
            nextStep,
            nextStepConfigOverride
        });
    }
};
