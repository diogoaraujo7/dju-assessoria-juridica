
import { z } from 'zod';
import { Step, StepData, ChoiceThenInputStepData } from '../types';
import { PromptFactoryResult } from '../prompts/index';
import { WorkflowHookProps } from '../strategies/types';
import { generateStructuredContent } from '../services/geminiService';
import { getStepConfig } from '../stepConfig';
import { getArgumentSuggestionsButtons } from '../ui';
import { 
    zAnaliseProcessualSchema, 
    zAnaliseVotoRelatorSchema, 
    zPeticaoIdentificarPartesSchema 
} from '../schemas';

interface ExecuteWorkflowParams<TResult> {
    promptFactoryResult: PromptFactoryResult;
    nextStep: Step;
    nextStepConfigOverride?: Partial<StepData>;
    contextCallback?: (jsonResponse: TResult) => void;
}

type AnalysisData = z.infer<typeof zAnaliseProcessualSchema>;
type VoteAnalysisData = z.infer<typeof zAnaliseVotoRelatorSchema>;
type PartiesData = z.infer<typeof zPeticaoIdentificarPartesSchema>;

function isAnalysisData(data: unknown): data is AnalysisData {
    return (
        typeof data === 'object' && 
        data !== null && 
        'resumo' in data && 
        'pontosControvertidos' in data
    );
}

function isVoteAnalysisData(data: unknown): data is VoteAnalysisData {
    return (
        typeof data === 'object' && 
        data !== null && 
        'sinteseVoto' in data && 
        'pontosControvertidos' in data
    );
}

function isPartiesData(data: unknown): data is PartiesData {
    return (
        typeof data === 'object' && 
        data !== null && 
        'autores' in data && 
        'reus' in data
    );
}

export const executeWorkflowAction = async <TResult = unknown>(
    props: WorkflowHookProps, 
    params: ExecuteWorkflowParams<TResult>
) => {
    const { state, gemini, dispatch, engine, handleFailure, onProcessComplete } = props;
    const { model } = gemini;
    const { language, stepData, atoType } = state;
    const STEP_CONFIG = getStepConfig(language, atoType);
    const ARGUMENT_BUTTONS = getArgumentSuggestionsButtons(language);

    const {
        promptFactoryResult,
        nextStep,
        nextStepConfigOverride = {},
        contextCallback
    } = params;

    const { contents: prompt, schema, zodSchema } = promptFactoryResult;
    
    const stepDataToAdd = { 
        [nextStep]: { 
            ...(STEP_CONFIG[nextStep] as StepData), 
            ...nextStepConfigOverride, 
            content: nextStepConfigOverride.content || '', 
            input: null, 
            lastPrompt: { prompt, schema } 
        } 
    };

    dispatch({ type: 'ADVANCE_STEP', payload: { nextStep, stepDataToAdd } });

    if (schema) {
        generateStructuredContent<TResult>(
            model!, 
            prompt, 
            schema,
            (jsonObj) => {
                let updateData: Partial<StepData> = {};

                if (isAnalysisData(jsonObj)) {
                    const analysis = jsonObj as AnalysisData;
                    const { resumo, pontosControvertidos, sugestoesBotoes } = analysis;
                    const dynamicButtons = (sugestoesBotoes && sugestoesBotoes.length > 0) ? sugestoesBotoes : ARGUMENT_BUTTONS;
                    updateData = { 
                        summaryContent: resumo, 
                        content: pontosControvertidos || '', 
                        subResponses: (stepData[nextStep] as ChoiceThenInputStepData)?.subResponses || {}, 
                        suggestionButtons: dynamicButtons 
                    };
                } else if (isVoteAnalysisData(jsonObj)) {
                    const voteAnalysis = jsonObj as VoteAnalysisData;
                    const { sinteseVoto, pontosControvertidos, sugestoesBotoes } = voteAnalysis;
                    const dynamicButtons = (sugestoesBotoes && sugestoesBotoes.length > 0) 
                        ? sugestoesBotoes 
                        : undefined; 
                        
                    updateData = { 
                        summaryContent: sinteseVoto, 
                        content: pontosControvertidos,
                        suggestionButtons: dynamicButtons
                    };
                } else if (isPartiesData(jsonObj)) {
                    const parties = jsonObj as PartiesData;
                    const { autores, reus } = parties;
                    const isPT = language === 'pt-BR';
                    const getParties = (partyList: string[] | undefined, role: 'autor' | 'réu'): string[] => {
                        const label = isPT ? role : (role === 'autor' ? 'plaintiff' : 'defendant');
                        return (partyList && partyList.length > 0) ? partyList.map(name => `${name} (${label})`) : [];
                    };
                    const autorOptions = getParties(autores, 'autor');
                    const reuOptions = getParties(reus, 'réu');
                    const partyOptions = [...autorOptions, ...reuOptions];
                    
                    if (autorOptions.length === 0) partyOptions.push(`${isPT ? 'Parte Autora não identificada' : 'Plaintiff not identified'} (${isPT ? 'autor' : 'plaintiff'})`);
                    if (reuOptions.length === 0) partyOptions.push(`${isPT ? 'Parte Ré não identificada' : 'Defendant not identified'} (${isPT ? 'réu' : 'defendant'})`);
                    
                    updateData = { partyOptions: partyOptions };
                } else {
                    if (Array.isArray(jsonObj)) {
                         updateData = { stepType: params.nextStepConfigOverride?.stepType, isGeneratingSuggestions: false, suggestions: jsonObj as any };
                    }
                }

                dispatch({ type: 'UPDATE_STEP_DATA', payload: { step: nextStep, data: updateData } });
                
                if (contextCallback) {
                    contextCallback(jsonObj);
                }
                onProcessComplete();
            },
            (retryFn, error) => handleFailure(retryFn, nextStep, error, prompt, schema),
            zodSchema
        );
    } else {
        await engine.executeStep({
            chat: gemini.chat, 
            prompt, 
            nextStep, 
            stepDataToAdd, 
            failedRequest: null, 
            handleFailure, 
            onComplete: onProcessComplete
        });
    }
};