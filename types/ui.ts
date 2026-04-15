
import { type Part } from '@google/genai';
import { ZodType } from 'zod';
import { UserAction, StepType } from './domain';
import { GoogleSearchResult, ArgumentSuggestionData } from './api';

export const AnalysisViewMode = {
    SUMMARY_AND_MENU: 'summary_and_menu',
    POINTS: 'points',
} as const;

export type AnalysisView = typeof AnalysisViewMode[keyof typeof AnalysisViewMode];

export interface BaseInput<TFiles> {
  text: string;
  files?: TFiles;
  actionId?: UserAction | string;
  currentEditorContent?: string;
  lengthValue?: number;
  toneValue?: number;
}

export type WorkflowInput = BaseInput<File[]>;

export type UserInput = BaseInput<string[]>;

export interface SidebarSubItem {
    id: string;
    label: string;
    view: AnalysisView;
}

export interface SuggestionButton {
  label: string;
  promptText: string;
}

interface BaseStepData {
  title: string;
  subtitle?: string;
  hideTitle?: boolean;
  content: string;
  input: UserInput | null;
  summaryContent?: string;
  suggestionButtons?: (string | SuggestionButton)[];
  lastPrompt?: string | Part[] | { prompt: string | Part[]; schema: any };
  outputSchema?: ZodType<any>; 
  isPrimaryInput?: boolean;
}

export interface MultipleChoiceStepData extends BaseStepData {
  stepType: StepType.MULTIPLE_CHOICE;
  options?: string[];
  systemHint?: string;
}

export interface DocumentStepData extends BaseStepData {
  stepType: StepType.DOCUMENT;
  ementaContent?: string;
  isGeneratingEmenta?: boolean;
}

export interface ChoiceThenInputStepData extends BaseStepData {
  stepType: StepType.CHOICE_THEN_INPUT;
  options?: string[];
  partyOptions?: string[];
  subResponses?: Record<string, string>;
  subResponseSources?: Record<string, any[]>;
  isGeneratingSuggestions?: boolean;
  suggestionRequestId?: string;
}

export interface ArgumentSuggestionStepData extends BaseStepData {
  stepType: StepType.ARGUMENT_SUGGESTION;
  subResponses?: Record<string, string>;
  subResponseSources?: Record<string, any[]>;
  suggestions?: ArgumentSuggestionData | ArgumentSuggestionData[] | null;
  isGeneratingSuggestions?: boolean;
  suggestionRequestId?: string;
  googleSearchResults?: Record<string, GoogleSearchResult>;
  isSearchingGoogle?: Set<string>;
}

export interface PointSelectionStepData extends BaseStepData {
  stepType: StepType.POINT_SELECTION;
}

export interface FormStepData extends BaseStepData {
  stepType: StepType.FORM;
  formPhase?: 'facts' | 'review';
  initialPetitionData?: Record<string, string>;
  extractionError?: 'overload' | 'other' | null;
}

export interface ChatStepData extends BaseStepData {
  stepType: StepType.CHAT;
}

export type StepData =
  | MultipleChoiceStepData
  | DocumentStepData
  | ChoiceThenInputStepData
  | ArgumentSuggestionStepData
  | PointSelectionStepData
  | FormStepData
  | ChatStepData;

export const isChoiceThenInputStep = (data: StepData): data is ChoiceThenInputStepData => {
  return data.stepType === StepType.CHOICE_THEN_INPUT;
};

export const isArgumentSuggestionStep = (data: StepData): data is ArgumentSuggestionStepData => {
  return data.stepType === StepType.ARGUMENT_SUGGESTION;
};

export const isDocumentStep = (data: StepData): data is DocumentStepData => {
  return data.stepType === StepType.DOCUMENT;
};

export const isMultipleChoiceStep = (data: StepData): data is MultipleChoiceStepData => {
  return data.stepType === StepType.MULTIPLE_CHOICE;
};

export const isFormStep = (data: StepData): data is FormStepData => {
  return data.stepType === StepType.FORM;
};

export const isPointSelectionStep = (data: StepData): data is PointSelectionStepData => {
  return data.stepType === StepType.POINT_SELECTION;
};

export const isChatStep = (data: StepData): data is ChatStepData => {
  return data.stepType === StepType.CHAT;
};
