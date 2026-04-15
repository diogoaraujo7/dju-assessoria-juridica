import React, { createContext, useContext, useReducer, useMemo } from 'react';
import { Chat, Part } from '@google/genai';
import { Step } from '../types';

export interface GeminiState {
  isLoading: boolean;
  loadingStep: Step | null;
  failedRequest: { prompt: string | Part[]; step: Step; schema?: any; isEmenta?: boolean; complementaryItem?: string } | null;
  chat: Chat | null;
  model: string | null;
}

export type GeminiAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_STEP'; payload: Step | null }
  | { type: 'SET_FAILED_REQUEST'; payload: { prompt: string | Part[]; step: Step; schema?: any; isEmenta?: boolean; complementaryItem?: string } | null }
  | { type: 'SET_CHAT_SESSION'; payload: { chat: Chat; model: string } }
  | { type: 'RESET' };

const initialGeminiState: GeminiState = {
  isLoading: false,
  loadingStep: null,
  failedRequest: null,
  chat: null,
  model: null,
};

const geminiReducer = (state: GeminiState, action: GeminiAction): GeminiState => {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, isLoading: action.payload };
    case 'SET_LOADING_STEP': return { ...state, loadingStep: action.payload };
    case 'SET_FAILED_REQUEST': return { ...state, failedRequest: action.payload };
    case 'SET_CHAT_SESSION': return { ...state, chat: action.payload.chat, model: action.payload.model };
    case 'RESET': return initialGeminiState;
    default: return state;
  }
};

export interface GeminiDispatch {
  setLoading: (isLoading: boolean) => void;
  setLoadingStep: (step: Step | null) => void;
  setFailedRequest: (request: { prompt: string | Part[]; step: Step; schema?: any } | null) => void;
  setChatSession: (chat: Chat, model: string) => void;
  resetGemini: () => void;
}

const GeminiStateContext = createContext<GeminiState | undefined>(undefined);
const GeminiDispatchContext = createContext<GeminiDispatch | undefined>(undefined);

export const GeminiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(geminiReducer, initialGeminiState);

  const dispatchValue: GeminiDispatch = useMemo(() => ({
    setLoading: (l) => dispatch({ type: 'SET_LOADING', payload: l }),
    setLoadingStep: (s) => dispatch({ type: 'SET_LOADING_STEP', payload: s }),
    setFailedRequest: (r) => dispatch({ type: 'SET_FAILED_REQUEST', payload: r }),
    setChatSession: (c, m) => dispatch({ type: 'SET_CHAT_SESSION', payload: { chat: c, model: m } }),
    resetGemini: () => dispatch({ type: 'RESET' }),
  }), []);

  return (
    <GeminiStateContext.Provider value={state}>
      <GeminiDispatchContext.Provider value={dispatchValue}>
        {children}
      </GeminiDispatchContext.Provider>
    </GeminiStateContext.Provider>
  );
};

export const useGeminiState = () => {
  const context = useContext(GeminiStateContext);
  if (!context) throw new Error("useGeminiState must be used within GeminiProvider");
  return context;
};

export const useGeminiDispatch = () => {
  const context = useContext(GeminiDispatchContext);
  if (!context) throw new Error("useGeminiDispatch must be used within GeminiProvider");
  return context;
};
