
import React from 'react';
import { Part } from '@google/genai';
import { Step, WorkflowInput } from '../types';
import { type Action, type WorkflowState } from '../context/WorkflowContext';
import { GeminiState } from '../context/GeminiContext';
import { WorkflowEngine } from '../services/WorkflowEngine';
import { GeminiError } from '../types/errors';

export interface WorkflowHookProps {
    state: WorkflowState;
    gemini: GeminiState;
    dispatch: React.Dispatch<Action>;
    engine: WorkflowEngine;
    handleFailure: (retryFn: () => void, stepToUpdate: Step, error?: GeminiError, originalPrompt?: string | Part[], schema?: any) => void;
    generateSuggestions: (promptAndSchema: { prompt: string | Part[], schema: any }, stepToUpdate: Step) => void;
    handleConfirmationStep: (isConfirmed: boolean, nextTemplateStep: Step, previousAnalysisStep: Step) => void;
    onProcessComplete: () => void;
}

export type StepStrategy = (props: WorkflowHookProps, userInput: WorkflowInput) => Promise<void>;