
import { useEffect } from 'react';
import { WorkflowEngine } from '../services/WorkflowEngine';
import { Action } from '../context/WorkflowContext';
import { GeminiDispatch } from '../context/GeminiContext';
import { UIDispatch } from '../context/UIContext';

export const useWorkflowEngineIntegration = (
    workflowEngine: WorkflowEngine,
    masterDispatch: (action: Action) => void,
    geminiDispatch: GeminiDispatch,
    uiDispatch: UIDispatch
) => {
    useEffect(() => {
        const unsubscribe = workflowEngine.subscribe((event) => {
            switch (event.type) {
                case 'workflow':
                    masterDispatch(event.action);
                    break;
                case 'gemini':
                    if (event.action.type === 'SET_LOADING') geminiDispatch.setLoading(event.action.payload);
                    if (event.action.type === 'SET_LOADING_STEP') geminiDispatch.setLoadingStep(event.action.payload);
                    if (event.action.type === 'SET_FAILED_REQUEST') geminiDispatch.setFailedRequest(event.action.payload);
                    if (event.action.type === 'SET_CHAT_SESSION') geminiDispatch.setChatSession(event.action.payload.chat, event.action.payload.model);
                    if (event.action.type === 'RESET') geminiDispatch.resetGemini();
                    break;
                case 'ui':
                    if (event.action.type === 'SET_SIDEBAR_OPEN') uiDispatch.setSidebarOpen(event.action.payload);
                    if (event.action.type === 'SET_ANALYSIS_VIEW') uiDispatch.setAnalysisView(event.action.payload);
                    if (event.action.type === 'SET_LOADING_MENU_ITEM') uiDispatch.setLoadingMenuItem(event.action.payload);
                    break;
            }
        });
        return unsubscribe;
    }, [workflowEngine, masterDispatch, geminiDispatch, uiDispatch]);
};
