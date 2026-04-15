
import React, { createContext, useContext, useReducer, useMemo } from 'react';
import { AnalysisView, AnalysisViewMode } from '../types';

export interface UIState {
    sidebarOpen: boolean;
    analysisView: AnalysisView;
    loadingMenuItem: string | null;
}

export type UIAction =
    | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
    | { type: 'SET_ANALYSIS_VIEW'; payload: AnalysisView }
    | { type: 'SET_LOADING_MENU_ITEM'; payload: string | null };

const initialUIState: UIState = {
    sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : false,
    analysisView: AnalysisViewMode.SUMMARY_AND_MENU,
    loadingMenuItem: null,
};

const uiReducer = (state: UIState, action: UIAction): UIState => {
    switch (action.type) {
        case 'SET_SIDEBAR_OPEN': return { ...state, sidebarOpen: action.payload };
        case 'SET_ANALYSIS_VIEW': return { ...state, analysisView: action.payload };
        case 'SET_LOADING_MENU_ITEM': return { ...state, loadingMenuItem: action.payload };
        default: return state;
    }
};

export interface UIDispatch {
    setSidebarOpen: (isOpen: boolean) => void;
    setAnalysisView: (view: AnalysisView) => void;
    setLoadingMenuItem: (item: string | null) => void;
}

const UIStateContext = createContext<UIState | undefined>(undefined);
const UIDispatchContext = createContext<UIDispatch | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(uiReducer, initialUIState);

    React.useEffect(() => {
        const handleResize = () => {
            dispatch({ type: 'SET_SIDEBAR_OPEN', payload: window.innerWidth >= 768 });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const dispatchValue: UIDispatch = useMemo(() => ({
        setSidebarOpen: (isOpen) => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: isOpen }),
        setAnalysisView: (view) => dispatch({ type: 'SET_ANALYSIS_VIEW', payload: view }),
        setLoadingMenuItem: (item) => dispatch({ type: 'SET_LOADING_MENU_ITEM', payload: item }),
    }), []);

    return (
        <UIStateContext.Provider value={state}>
            <UIDispatchContext.Provider value={dispatchValue}>
                {children}
            </UIDispatchContext.Provider>
        </UIStateContext.Provider>
    );
};

export const useUIState = () => {
    const context = useContext(UIStateContext);
    if (context === undefined) {
        throw new Error('useUIState must be used within a UIProvider');
    }
    return context;
};

export const useUIDispatch = () => {
    const context = useContext(UIDispatchContext);
    if (context === undefined) {
        throw new Error('useUIDispatch must be used within a UIProvider');
    }
    return context;
};