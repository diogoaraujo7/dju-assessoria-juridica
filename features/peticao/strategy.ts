
import { Step, StepType, UserAction, Task, PetitionIdentifiers, isSpecialPetition, StepData, WorkflowTriggers } from '../../types';
import { getStepConfig } from '../../stepConfig';
import { getPrompts } from '../../prompts/index';
import { determineNextStep } from '../../services/workflowStateMachine';
import { getArgumentSuggestionsButtons } from '../../ui';
import { executeWorkflowAction } from '../../services/workflowStepExecutor';
import { StepStrategy } from '../../strategies/types';

const generateFinalPetition = async (props: any, userInput: any, isFromTemplateStep: boolean) => {
    const { state, dispatch } = props;
    const { language, stepData, petitionType, representedParty, atoType } = state;
    const PROMPTS = getPrompts(language);
    const STEP_CONFIG = getStepConfig(language, atoType);
    const ARGUMENT_BUTTONS = getArgumentSuggestionsButtons(language);

    const basesInput = stepData[Step.PETICAO_ANALISE]?.input;
    let basesInputText = basesInput?.text ?? 'Bases não fornecidas.';
    const summary = stepData[Step.PETICAO_ANALISE]?.summaryContent ?? 'Não foi gerado um resumo.';
    const points = stepData[Step.PETICAO_ANALISE]?.content ?? 'Não foram gerados pontos controvertidos.';
    const isSpecialFlow = isSpecialPetition(petitionType);
    
    if (!isSpecialFlow) {
         const dynamicButtons = stepData[Step.PETICAO_ANALISE]?.suggestionButtons || ARGUMENT_BUTTONS;
         const cleanInputText = basesInputText.replace(WorkflowTriggers.BASES_PREFIX, '');
         
         const isSuggestion = dynamicButtons.some((b: any) => 
            typeof b === 'string' ? b === cleanInputText : b.promptText === basesInputText
         );

         if (basesInputText && isSuggestion) {
            basesInputText = `${basesInputText}. DIRETRIZ VINCULANTE DE ORIGINALIDADE: A redação da peça processual deve ser elaborada de maneira completamente original.`;
         }
    }

    let promptResult;
    
    const argumentFiles = state.crossStepContext?.argumentFiles;
    
    const userTemplateText = isFromTemplateStep ? userInput.text : '';
    const templateFiles = isFromTemplateStep ? userInput.files : undefined;

    if (isSpecialFlow) {
        promptResult = await PROMPTS.peticaoElaborarEspecial(
            petitionType, 
            representedParty, 
            summary, 
            points, 
            userTemplateText, 
            templateFiles,
            userInput.lengthValue,
            userInput.toneValue
        );
    } else {
        promptResult = await PROMPTS.peticaoElaborarMinutaFinal(
            petitionType, 
            representedParty, 
            summary, 
            points, 
            basesInputText, 
            userTemplateText, 
            templateFiles, 
            state.crossStepContext?.contextFiles,
            argumentFiles,
            userInput.lengthValue,
            userInput.toneValue
        );
    }

    const nextStep = Step.ELABORAR_PETICAO;
    
    let nextStepConfigOverride: Partial<StepData> = {};
    if (isSpecialFlow) {
         nextStepConfigOverride = { ...STEP_CONFIG[Step.ELABORAR_PETICAO], title: language === 'pt-BR' ? '5. Minuta da Petição' : '5. Petition Draft' };
    }

    dispatch({ type: 'SET_WORKFLOW_STATE', payload: { crossStepContext: null } });
    
    await executeWorkflowAction<string>(props, {
        promptFactoryResult: promptResult,
        nextStep,
        nextStepConfigOverride
    });
};

/**
 * Strategy Map for Peticao Workflow.
 */
export const peticaoStrategies: Record<string, StepStrategy> = {
    [Step.PETICAO_DADOS]: async (props, userInput) => {
        const { state, dispatch } = props;
        const { language, stepData, petitionType } = state;
        const PROMPTS = getPrompts(language);
        const isPT = language === 'pt-BR';
        const currentStep = Step.PETICAO_DADOS;
        const currentData = stepData[currentStep]!;
        
        if (currentData.stepType === StepType.FORM && currentData.formPhase === 'facts') {
            const promptResult = await PROMPTS.peticaoExtrairDados(userInput.text, userInput.files);
            
            await executeWorkflowAction<Record<string, any>>(props, {
                promptFactoryResult: promptResult,
                nextStep: currentStep, 
                nextStepConfigOverride: { stepType: StepType.FORM }, 
                contextCallback: (parsedData) => {
                    const enhancedData = { ...parsedData, facts: userInput.text };
                    dispatch({ type: 'UPDATE_STEP_DATA', payload: { step: currentStep, data: { input: { text: userInput.text, files: userInput.files?.map(f=>f.name) }, summaryContent: userInput.text, formPhase: 'review', initialPetitionData: enhancedData, title: isPT ? '2. Dados da Petição' : '2. Petition Data', subtitle: isPT ? 'Verifique os dados extraídos pelo Dju e complete ou corrija as informações abaixo.' : "Verify the data extracted by Dju and complete or correct the information below.", extractionError: null } } });
                }
            });
        } else if (currentData.stepType === StepType.FORM && currentData.formPhase === 'review') {
             const formData = JSON.parse(userInput.text);
             const factsText = typeof formData === 'object' ? JSON.stringify(formData, null, 2) : (formData.facts || userInput.text); 
             
             dispatch({ 
                 type: 'SET_WORKFLOW_STATE', 
                 payload: { 
                     crossStepContext: { 
                         textPayload: factsText, 
                         contextFiles: state.crossStepContext?.contextFiles || []
                     } 
                 } 
             });

             const factsFiles = state.crossStepContext?.contextFiles || [];
             
             const promptResult = await PROMPTS.peticaoAnalisePreliminar(petitionType, factsText, factsFiles);
             const nextStep = determineNextStep(Step.PETICAO_DADOS, Task.PETICAO, state); 
             
             await executeWorkflowAction<{ autores: string[], reus: string[], resumo: string, pontosControvertidos: string, sugestoesBotoes: string[] }>(props, {
                 promptFactoryResult: promptResult,
                 nextStep,
                 contextCallback: (jsonObj) => {
                     const { autores, reus, resumo, pontosControvertidos, sugestoesBotoes } = jsonObj;
                     
                     const getParties = (partyList: string[], role: 'autor' | 'réu'): string[] => {
                         const label = isPT ? role : (role === 'autor' ? 'plaintiff' : 'defendant');
                         return (partyList && partyList.length > 0) ? partyList.map(name => `${name} (${label})`) : [];
                     };
                     const autorOptions = getParties(autores, 'autor');
                     const reuOptions = getParties(reus, 'réu');
                     const partyOptions = [...autorOptions, ...reuOptions];
                     if (autorOptions.length === 0) partyOptions.push(`${isPT ? 'Parte Autora não identificada' : 'Plaintiff not identified'} (${isPT ? 'autor' : 'plaintiff'})`);
                     if (reuOptions.length === 0) partyOptions.push(`${isPT ? 'Parte Ré não identificada' : 'Defendant not identified'} (${isPT ? 'réu' : 'defendant'})`);
                     
                     const dynamicButtons = (sugestoesBotoes && sugestoesBotoes.length > 0) ? sugestoesBotoes : getArgumentSuggestionsButtons(language);
                     dispatch({ type: 'UPDATE_STEP_DATA', payload: { step: nextStep, data: { 
                         partyOptions: partyOptions, 
                         summaryContent: resumo, 
                         content: pontosControvertidos || '', 
                         subResponses: {}, 
                         suggestionButtons: dynamicButtons 
                     }}});
                 }
             });
        } else {
            const factsText = userInput.text;
            const uploadedFiles = userInput.files || [];
            
            dispatch({ type: 'SET_WORKFLOW_STATE', payload: { crossStepContext: { textPayload: factsText, contextFiles: uploadedFiles } } });
            
            const promptResult = await PROMPTS.peticaoAnalisePreliminar(petitionType, factsText, uploadedFiles);
            const nextStep = determineNextStep(Step.PETICAO_DADOS, Task.PETICAO, state); 

            await executeWorkflowAction<{ autores: string[], reus: string[], resumo: string, pontosControvertidos: string, sugestoesBotoes: string[] }>(props, {
                promptFactoryResult: promptResult,
                nextStep,
                contextCallback: (jsonObj) => {
                    const { autores, reus, resumo, pontosControvertidos, sugestoesBotoes } = jsonObj;
                    
                    const getParties = (partyList: string[], role: 'autor' | 'réu'): string[] => {
                        const label = isPT ? role : (role === 'autor' ? 'plaintiff' : 'defendant');
                        return (partyList && partyList.length > 0) ? partyList.map(name => `${name} (${label})`) : [];
                   };
                   const autorOptions = getParties(autores, 'autor');
                   const reuOptions = getParties(reus, 'réu');
                   const partyOptions = [...autorOptions, ...reuOptions];
                   if (autorOptions.length === 0) partyOptions.push(`${isPT ? 'Parte Autora não identificada' : 'Plaintiff not identified'} (${isPT ? 'autor' : 'plaintiff'})`);
                   if (reuOptions.length === 0) partyOptions.push(`${isPT ? 'Parte Ré não identificada' : 'Defendant not identified'} (${isPT ? 'réu' : 'defendant'})`);
                   
                   const dynamicButtons = (sugestoesBotoes && sugestoesBotoes.length > 0) ? sugestoesBotoes : getArgumentSuggestionsButtons(language);
                   dispatch({ type: 'UPDATE_STEP_DATA', payload: { step: nextStep, data: { 
                       partyOptions: partyOptions, 
                       summaryContent: resumo, 
                       content: pontosControvertidos || '', 
                       subResponses: {}, 
                       suggestionButtons: dynamicButtons 
                   }}});
                }
            });
        }
    },

    [Step.PETICAO_TIPO]: async (props, userInput) => {
        const { state, dispatch, onProcessComplete } = props;
        const { language, atoType } = state;
        const STEP_CONFIG = getStepConfig(language, atoType);
        const isPT = language === 'pt-BR';

        const typeSelected = userInput.text;
        
        if (typeSelected.includes(PetitionIdentifiers.SPECIFY_PLACEHOLDER_PT) || typeSelected.includes(PetitionIdentifiers.SPECIFY_PLACEHOLDER_EN)) {
            dispatch({ type: 'UPDATE_STEP_DATA', payload: { step: Step.PETICAO_TIPO, data: { stepType: StepType.DOCUMENT, content: isPT ? "Por favor, especifique qual o tipo de recurso que deseja elaborar:" : "Please specify which type of appeal you wish to draft:", input: null } } });
            onProcessComplete();
            return;
        }

        dispatch({ type: 'SET_WORKFLOW_STATE', payload: { petitionType: typeSelected } });
        
        let nextStepConfigOverride: any = {};
        
        if (typeSelected.startsWith('1. ') || typeSelected === PetitionIdentifiers.INITIAL_PETITION) {
            nextStepConfigOverride = { 
                stepType: StepType.FORM, 
                title: isPT ? '2. Relato dos Fatos' : '2. Statement of Facts', 
                subtitle: isPT ? 'Comece descrevendo em detalhes a narrativa dos fatos. O Dju analisará seu relato para preencher o restante do formulário para você.' : 'Start by describing the facts in detail. Dju will analyze your report to fill out the rest of the form for you.', 
                formPhase: 'facts', 
                content: '',
                hasUniversalInput: false 
            };
        } else {
                nextStepConfigOverride = { content: language === 'pt-BR' ? `Certo, vamos elaborar: ${typeSelected}. Agora, preciso que você forneça os dados do processo. Você pode descrever o caso aqui ou anexar os arquivos (PDF, Word, etc.) contendo as informações pertinentes.` : `Okay, let's draft: ${typeSelected}. Now, I need you to provide the case data. You can describe the case here or attach files (PDF, Word, etc.) containing the relevant information.` };
        }

        const nextStep = determineNextStep(Step.PETICAO_TIPO, Task.PETICAO, state);
        const stepDataToAdd = { [nextStep]: { ...STEP_CONFIG[nextStep], ...nextStepConfigOverride, input: null } };
        dispatch({ type: 'ADVANCE_STEP', payload: { nextStep, stepDataToAdd } });
        onProcessComplete();
    },

    [Step.PETICAO_ANALISE]: async (props, userInput) => {
        const { state, dispatch, generateSuggestions, onProcessComplete } = props;
        const { language, stepData, petitionType, representedParty, atoType } = state;
        const ARGUMENT_BUTTONS = getArgumentSuggestionsButtons(language);
        const PROMPTS = getPrompts(language);
        const STEP_CONFIG = getStepConfig(language, atoType);

        const currentSuggestionButtons = stepData[Step.PETICAO_ANALISE]?.suggestionButtons || ARGUMENT_BUTTONS;
        
        if (userInput.actionId === UserAction.SELECT_PARTY) {
            dispatch({ type: 'SET_WORKFLOW_STATE', payload: { representedParty: userInput.text } });
            onProcessComplete();
            return;
        }

        const isManualBases = userInput.actionId === UserAction.MANUAL_INPUT;
        const isRequestSuggestions = userInput.actionId === UserAction.GENERATE_SUGGESTIONS;

        if (isManualBases) {
            dispatch({ type: 'UPDATE_STEP_DATA', payload: { step: Step.PETICAO_ANALISE, data: { input: { text: userInput.text, files: userInput.files?.map(f => f.name) }, suggestionButtons: currentSuggestionButtons } } });
        } else if (isRequestSuggestions) {
                dispatch({ type: 'UPDATE_STEP_DATA', payload: { step: Step.PETICAO_ANALISE, data: { isGeneratingSuggestions: true, suggestions: undefined, input: { text: userInput.text, files: userInput.files?.map(f => f.name) } } } });
                
                const pontosControvertidosText = (userInput.text && userInput.text.length > 10) ? userInput.text : (stepData[Step.PETICAO_ANALISE]?.content ?? '');
                
                const contextText = state.crossStepContext?.textPayload || null;
                const contextFiles = state.crossStepContext?.contextFiles || [];

                const promptResult = await PROMPTS.peticaoGerarSugestoes(representedParty, pontosControvertidosText, petitionType, contextText, contextFiles);
                generateSuggestions({ prompt: promptResult.contents, schema: promptResult.schema }, Step.PETICAO_ANALISE);
                return;
        } else {
            dispatch({ type: 'UPDATE_STEP_DATA', payload: { step: Step.PETICAO_ANALISE, data: { input: { text: userInput.text, files: userInput.files?.map(f => f.name) }, suggestionButtons: currentSuggestionButtons } } });
        }

        const currentContext = state.crossStepContext;
        const previousFiles = currentContext?.contextFiles || [];
        const argumentFiles = userInput.files || [];
        
        dispatch({ 
            type: 'SET_WORKFLOW_STATE', 
            payload: { 
                crossStepContext: { 
                    textPayload: currentContext?.textPayload || '', 
                    contextFiles: previousFiles,
                    argumentFiles: argumentFiles
                } 
            } 
        });
        
        const nextStep = determineNextStep(Step.PETICAO_ANALISE, Task.PETICAO, state);

        if (nextStep === Step.PETICAO_TEMPLATE) {
            const nextStepConfigOverride = { hideTitle: true };
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
        } else {
            await generateFinalPetition(props, userInput, false);
        }
    },

    [Step.PETICAO_TEMPLATE]: async (props, userInput) => {
        await generateFinalPetition(props, userInput, true);
    },

    [Step.ELABORAR_PETICAO]: async (props, userInput) => {
        const { state, gemini, engine } = props;
        await engine.rewriteWithInstruction(userInput.text, { state, geminiState: gemini }, userInput.files);
    }
};
