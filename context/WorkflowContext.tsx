
import React, { createContext, useContext, useReducer, useCallback, useMemo, useState } from 'react';
import { Step, StepData, Task, Language, GoogleSearchResult, StepType, UserAction } from '../types';
import { useUIDispatch } from './UIContext';
import { useGeminiState, useGeminiDispatch } from './GeminiContext';
import { WorkflowEngine } from '../services/WorkflowEngine'; 
import { useWorkflowEngineIntegration } from '../hooks/useWorkflowEngineIntegration';
import { getStepConfig } from '../stepConfig';

export interface WorkflowConfigState {
  task: Task | null;
  currentStep: Step;
  viewingStep: Step;
  completedSteps: Set<Step>;
  language: Language;
  atoType: string | null;
  petitionType: string | null;
  representedParty: string | null;
  crossStepContext: { 
      textPayload: string; 
      votoRelatorText?: string; 
      contextFiles?: File[]; 
      argumentFiles?: File[]; 
  } | null;
}

export interface WorkflowDataState {
  stepData: Partial<Record<Step, StepData>>;
}

export type WorkflowState = WorkflowConfigState & WorkflowDataState;

export interface WorkflowDispatch {
  setViewingStep: (step: Step) => void;
  setLanguage: (lang: Language) => void;
  handleTaskSelect: (selectedTask: Task, selectedModel: string) => Promise<void>;
  handleUserSubmit: (userInput: { text: string; files?: File[]; actionId?: string; currentEditorContent?: string; lengthValue?: number; toneValue?: number }) => Promise<void>;
  handleComplementaryMenuAction: (item: string) => Promise<void>;
  handleGenerateEmentaFromAto: () => Promise<void>;
  handleGoogleSearchForBases: (point: string, forceModel?: string) => Promise<void>;
  handleReset: () => void;
  handleRedo: () => Promise<void>;
  handleRewriteWithInstruction: (instruction: string, files?: File[]) => Promise<void>;
  handleResetBasesChoice: (step: Step) => void;
  handleRetry: (modelOverride?: string) => Promise<void>;
  handleContinue: () => Promise<void>; 
  handleProceed: () => Promise<void>;
  handleUpdateContent: (step: Step, content: string) => void;
  handleUpdateStepData: (step: Step, data: Partial<StepData>) => void;
  handleSkipPrediction: () => void;
  handleGoBack: (previousStep: Step) => void;
}

export type Action =
  | { type: 'RESET'; payload: { language: Language } }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_VIEWING_STEP'; payload: Step }
  | { type: 'START_TASK'; payload: { task: Task; nextStep: Step; initialStepData: Partial<Record<Step, StepData>> } }
  | { type: 'ADVANCE_STEP'; payload: { nextStep: Step; stepDataToAdd: Partial<Record<Step, StepData>> } }
  | { type: 'UPDATE_STEP_DATA'; payload: { step: Step; data: Partial<StepData> } }
  | { type: 'ADD_COMPLETED_STEP'; payload: Step }
  | { type: 'UPDATE_SUB_RESPONSE'; payload: { step: Step; item: string; response: string } }
  | { type: 'UPDATE_SUB_RESPONSE_SOURCES'; payload: { step: Step; item: string; sources: any[] } }
  | { type: 'UPDATE_GOOGLE_SEARCH_STATUS'; payload: { pointKey: string; isSearching: boolean; stepToUpdate: Step } }
  | { type: 'UPDATE_GOOGLE_SEARCH_RESULT'; payload: { pointKey: string; result: GoogleSearchResult; stepToUpdate: Step } }
  | { type: 'SET_WORKFLOW_STATE'; payload: Partial<Pick<WorkflowConfigState, 'atoType' | 'petitionType' | 'representedParty' | 'crossStepContext'>> }
  | { type: 'GO_BACK'; payload: { previousStep: Step } }
  | { type: 'HYDRATE'; payload: WorkflowState };


const initialConfigState: WorkflowConfigState = {
  task: null,
  currentStep: Step.TASK_SELECTION,
  viewingStep: Step.TASK_SELECTION,
  completedSteps: new Set(),
  language: 'pt-BR',
  atoType: null,
  petitionType: null,
  representedParty: null,
  crossStepContext: null,
};

const initialDataState: WorkflowDataState = {
  stepData: {},
};

const reduceGoogleSearchStatus = (state: WorkflowDataState, payload: { pointKey: string; isSearching: boolean; stepToUpdate: Step }): WorkflowDataState => {
    const { stepToUpdate, isSearching, pointKey } = payload;
    const currentData = state.stepData[stepToUpdate];
    
    if (!currentData || currentData.stepType !== StepType.ARGUMENT_SUGGESTION) return state;
    
    const currentSearching = new Set(currentData.isSearchingGoogle || []);
    if(isSearching) {
        currentSearching.add(pointKey);
    } else {
        currentSearching.delete(pointKey);
    }
    return { ...state, stepData: { ...state.stepData, [stepToUpdate]: { ...currentData, isSearchingGoogle: currentSearching } } };
};

const reduceGoogleSearchResult = (state: WorkflowDataState, payload: { pointKey: string; result: GoogleSearchResult; stepToUpdate: Step }): WorkflowDataState => {
    const { stepToUpdate, pointKey, result } = payload;
    const currentData = state.stepData[stepToUpdate];
    
    if (!currentData || currentData.stepType !== StepType.ARGUMENT_SUGGESTION) return state;
    
    const currentSearching = new Set(currentData.isSearchingGoogle || []);
    currentSearching.delete(pointKey);
    return {
        ...state,
        stepData: { ...state.stepData, [stepToUpdate]: {
            ...currentData,
            isSearchingGoogle: currentSearching,
            googleSearchResults: { ...currentData.googleSearchResults, [pointKey]: result }
        }}
    };
};

const configReducer = (state: WorkflowConfigState, action: Action): WorkflowConfigState => {
    switch (action.type) {
        case 'RESET': 
            return { ...initialConfigState, language: action.payload.language };
        case 'SET_LANGUAGE': return { ...state, language: action.payload };
        case 'SET_VIEWING_STEP': return { ...state, viewingStep: action.payload };
        case 'START_TASK': 
            return {
                ...state,
                task: action.payload.task,
                currentStep: action.payload.nextStep,
                viewingStep: action.payload.nextStep,
                completedSteps: new Set([Step.TASK_SELECTION]),
                atoType: null,
                petitionType: null,
                representedParty: null,
                crossStepContext: null,
            };
        case 'ADVANCE_STEP': 
            return {
                ...state,
                currentStep: action.payload.nextStep,
                viewingStep: action.payload.nextStep,
            };
        case 'GO_BACK':
            return {
                ...state,
                currentStep: action.payload.previousStep,
                viewingStep: action.payload.previousStep,
            };
        case 'ADD_COMPLETED_STEP': 
            return {
                ...state,
                completedSteps: new Set(state.completedSteps).add(action.payload),
            };
        case 'SET_WORKFLOW_STATE':
            return { ...state, ...action.payload };
        case 'HYDRATE':
            const { stepData, ...config } = action.payload;
            return config;
        default: return state;
    }
};

const dataReducer = (state: WorkflowDataState, action: Action): WorkflowDataState => {
    switch (action.type) {
        case 'RESET': return initialDataState;
        case 'START_TASK':
            return { ...state, stepData: action.payload.initialStepData };
        case 'ADVANCE_STEP':
            return { ...state, stepData: { ...state.stepData, ...action.payload.stepDataToAdd } };
        case 'UPDATE_STEP_DATA': {
            const currentStepData = state.stepData[action.payload.step];
            const newData = action.payload.data;
            
            if ('suggestions' in newData && newData.suggestions !== undefined && currentStepData && 
                (currentStepData.stepType === StepType.CHOICE_THEN_INPUT || currentStepData.stepType === StepType.ARGUMENT_SUGGESTION) && 
                !(currentStepData as any).isGeneratingSuggestions) {
                
                const { suggestions, stepType, isGeneratingSuggestions, ...restData } = newData as any;
                return {
                    ...state,
                    stepData: { ...state.stepData, [action.payload.step]: { ...currentStepData, ...restData } },
                };
            }

            return {
                ...state,
                stepData: { ...state.stepData, [action.payload.step]: { ...currentStepData, ...newData } },
            };
        }
        case 'UPDATE_SUB_RESPONSE': {
            const stepState = state.stepData[action.payload.step];
            if (!stepState || (stepState.stepType !== StepType.CHOICE_THEN_INPUT && stepState.stepType !== StepType.ARGUMENT_SUGGESTION)) return state;
            const newSubResponses = { ...stepState.subResponses, [action.payload.item]: action.payload.response };
            return { ...state, stepData: { ...state.stepData, [action.payload.step]: { ...stepState, subResponses: newSubResponses } } };
        }
        case 'UPDATE_SUB_RESPONSE_SOURCES': {
            const stepState = state.stepData[action.payload.step];
            if (!stepState || (stepState.stepType !== StepType.CHOICE_THEN_INPUT && stepState.stepType !== StepType.ARGUMENT_SUGGESTION)) return state;
            const newSubResponseSources = { ...stepState.subResponseSources, [action.payload.item]: action.payload.sources };
            return { ...state, stepData: { ...state.stepData, [action.payload.step]: { ...stepState, subResponseSources: newSubResponseSources } } };
        }
        case 'UPDATE_GOOGLE_SEARCH_STATUS': return reduceGoogleSearchStatus(state, action.payload);
        case 'UPDATE_GOOGLE_SEARCH_RESULT': return reduceGoogleSearchResult(state, action.payload);
        case 'HYDRATE':
            return { stepData: action.payload.stepData };
        default: return state;
    }
};

const WorkflowConfigContext = createContext<WorkflowConfigState | undefined>(undefined);
const WorkflowDataContext = createContext<WorkflowDataState | undefined>(undefined);
const WorkflowDispatchContext = createContext<WorkflowDispatch | undefined>(undefined);

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [configState, configDispatch] = useReducer(configReducer, initialConfigState);
  const [dataState, dataDispatch] = useReducer(dataReducer, initialDataState);
  
  const [sessionId] = useState(() => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
      }
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
  });

  const uiDispatch = useUIDispatch();
  const geminiState = useGeminiState();
  const geminiDispatch = useGeminiDispatch();

  const workflowEngine = useMemo(() => new WorkflowEngine(), []);

  const masterDispatch = useCallback((action: Action) => {
      if (['RESET', 'SET_LANGUAGE', 'SET_VIEWING_STEP', 'START_TASK', 'ADVANCE_STEP', 'ADD_COMPLETED_STEP', 'SET_WORKFLOW_STATE', 'HYDRATE'].includes(action.type)) {
          configDispatch(action);
      }
      if (['RESET', 'START_TASK', 'ADVANCE_STEP', 'UPDATE_STEP_DATA', 'UPDATE_SUB_RESPONSE', 'UPDATE_SUB_RESPONSE_SOURCES', 'UPDATE_GOOGLE_SEARCH_STATUS', 'UPDATE_GOOGLE_SEARCH_RESULT', 'HYDRATE'].includes(action.type)) {
          dataDispatch(action);
      }
  }, []);

  useWorkflowEngineIntegration(
      workflowEngine, 
      masterDispatch, 
      geminiDispatch, 
      uiDispatch
  );

  const getCombinedState = () => ({ ...configState, ...dataState });

  const getEngineContext = () => ({
      state: getCombinedState(),
      geminiState
  });

  const handleTaskSelect = useCallback(async (selectedTask: Task, selectedModel: string) => {
      await workflowEngine.startTask(selectedTask, selectedModel, getEngineContext());
  }, [workflowEngine, configState, dataState, geminiState, masterDispatch]);

  const handleUserSubmit = useCallback(async (userInput: { text: string; files?: File[]; actionId?: string; currentEditorContent?: string; lengthValue?: number; toneValue?: number }) => {
      await workflowEngine.submitUserAction(userInput, getEngineContext());
  }, [workflowEngine, configState, dataState, geminiState]);
  
  const handleProceed = useCallback(async () => {
      await handleUserSubmit({ text: '', files: [], actionId: UserAction.PROCEED });
  }, [handleUserSubmit]);

  const handleComplementaryMenuAction = useCallback(async (item: string) => {
      await workflowEngine.runComplementaryAction(item, getEngineContext());
  }, [workflowEngine, configState, dataState, geminiState]);

  const handleGenerateEmentaFromAto = useCallback(async () => {
      await workflowEngine.generateEmenta(getEngineContext());
  }, [workflowEngine, configState, dataState, geminiState]);

  const handleGoogleSearchForBases = useCallback(async (point: string, forceModel?: string) => {
      await workflowEngine.performSearch(point, forceModel, getEngineContext());
  }, [workflowEngine, configState, dataState, geminiState]);

  const handleReset = useCallback(() => {
    const storageKey = `dju_workflow_state_${sessionId}`;
    masterDispatch({ type: 'RESET', payload: { language: configState.language } });
    sessionStorage.removeItem(storageKey);
    geminiDispatch.resetGemini();
    uiDispatch.setSidebarOpen(typeof window !== 'undefined' ? window.innerWidth >= 768 : false);
  }, [configState.language, uiDispatch, geminiDispatch, masterDispatch, sessionId]);

  const handleRetry = useCallback(async (modelOverride?: string) => {
      await workflowEngine.retryStep(modelOverride, getEngineContext());
  }, [workflowEngine, configState, dataState, geminiState]);

  const handleContinue = useCallback(async () => {
      await workflowEngine.continueGeneration(getEngineContext());
  }, [workflowEngine, configState, dataState, geminiState]);

  const handleRedo = useCallback(async () => {
    await handleRetry();
  }, [handleRetry]);

  const handleRewriteWithInstruction = useCallback(async (instruction: string, files?: File[]) => {
      await workflowEngine.rewriteWithInstruction(instruction, getEngineContext(), files);
  }, [workflowEngine, configState, dataState, geminiState]);
  
  const handleResetBasesChoice = useCallback((step: Step) => {
      masterDispatch({ type: 'UPDATE_STEP_DATA', payload: { step, data: { input: null, isGeneratingSuggestions: false, suggestions: null } } });
  }, [masterDispatch]);

  const handleUpdateContent = useCallback((step: Step, content: string) => {
      masterDispatch({ type: 'UPDATE_STEP_DATA', payload: { step, data: { content } } });
  }, [masterDispatch]);

  const handleUpdateStepData = useCallback((step: Step, data: Partial<StepData>) => {
      masterDispatch({ type: 'UPDATE_STEP_DATA', payload: { step, data } });
  }, [masterDispatch]);

  const handleSkipPrediction = useCallback(() => {
      geminiDispatch.setLoading(false);
      geminiDispatch.setFailedRequest(null);
      
      const STEP_CONFIG = getStepConfig(configState.language, configState.atoType);
      let nextStep: Step;
      
      if (configState.task === Task.ATO_DECISORIO) {
          nextStep = Step.ATO_TEMPLATE;
      } else {
          nextStep = Step.PETICAO_TEMPLATE;
      }
      
      const content = (configState.language === 'pt-BR' ? "Esta etapa é opcional..." : "This step is optional...");
      const stepDataToAdd = { [nextStep]: { ...(STEP_CONFIG[nextStep] as StepData), content, input: null } };
      
      masterDispatch({ type: 'ADVANCE_STEP', payload: { nextStep, stepDataToAdd } });
  }, [configState.language, configState.task, masterDispatch, geminiDispatch]);

  const handleGoBack = useCallback((previousStep: Step) => {
      geminiDispatch.setLoading(false);
      geminiDispatch.setFailedRequest(null);
      masterDispatch({ type: 'GO_BACK', payload: { previousStep } });
  }, [masterDispatch, geminiDispatch]);

  const dispatchValue: WorkflowDispatch = useMemo(() => ({
    setViewingStep: (step) => masterDispatch({ type: 'SET_VIEWING_STEP', payload: step }),
    setLanguage: (lang) => masterDispatch({ type: 'SET_LANGUAGE', payload: lang }),
    handleTaskSelect,
    handleUserSubmit,
    handleComplementaryMenuAction,
    handleGenerateEmentaFromAto,
    handleGoogleSearchForBases,
    handleReset,
    handleRedo,
    handleRewriteWithInstruction,
    handleResetBasesChoice,
    handleRetry,
    handleContinue,
    handleProceed,
    handleUpdateContent,
    handleUpdateStepData,
    handleSkipPrediction,
    handleGoBack
  }), [handleTaskSelect, handleUserSubmit, handleComplementaryMenuAction, handleGenerateEmentaFromAto, handleGoogleSearchForBases, handleReset, handleRedo, handleRewriteWithInstruction, handleResetBasesChoice, handleRetry, handleContinue, handleProceed, handleUpdateContent, handleUpdateStepData, handleSkipPrediction, handleGoBack, masterDispatch]);

  return (
    <WorkflowConfigContext.Provider value={configState}>
        <WorkflowDataContext.Provider value={dataState}>
            <WorkflowDispatchContext.Provider value={dispatchValue}>
                {children}
            </WorkflowDispatchContext.Provider>
        </WorkflowDataContext.Provider>
    </WorkflowConfigContext.Provider>
  );
};

export const useWorkflowConfig = () => {
    const context = useContext(WorkflowConfigContext);
    if (context === undefined) {
        throw new Error('useWorkflowConfig must be used within a WorkflowProvider');
    }
    return context;
};

export const useWorkflowData = () => {
    const context = useContext(WorkflowDataContext);
    if (context === undefined) {
        throw new Error('useWorkflowData must be used within a WorkflowProvider');
    }
    return context;
};

export const useWorkflowState = () => {
  const config = useWorkflowConfig();
  const data = useWorkflowData();
  return { ...config, ...data };
};

export const useWorkflowDispatch = () => {
  const context = useContext(WorkflowDispatchContext);
  if (context === undefined) {
    throw new Error('useWorkflowDispatch must be used within a WorkflowProvider');
  }
  return context;
};
