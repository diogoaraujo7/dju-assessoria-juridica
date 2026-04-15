
import React, { useTransition } from 'react';
import { FormStepData, Language } from '../../../types';
import { getUI } from '../../../ui';
import { LoadingTips } from '../../../components/content/LoadingTips';
import { PetitionFactsInput } from './PetitionFactsInput';
import { PetitionDataReview } from './PetitionDataReview';

interface InitialPetitionFormProps {
    data: FormStepData;
    onUserSubmit: (input: { text: string; files?: File[] }) => void;
    isLoading: boolean;
    language: Language;
    retryAction?: (() => void) | null;
    onRetry?: (model?: string) => void;
    onCancel?: () => void;
}

export const InitialPetitionForm: React.FC<InitialPetitionFormProps> = ({ data, onUserSubmit, isLoading, language, retryAction, onRetry, onCancel }) => {
    const isPT = language === 'pt-BR';
    const UI = getUI(language).actions;
    const [isPending, startTransition] = useTransition();

    const handleFactsAnalysis = (text: string, files: File[]) => {
        startTransition(() => {
            onUserSubmit({ text, files });
        });
    };

    const handleDataConfirmation = (formData: any) => {
        startTransition(() => {
             onUserSubmit({ text: JSON.stringify(formData), files: [] });
        });
    };

    if (data.extractionError && retryAction && onRetry) {
         return (
             <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800 animate-fade-in shadow-sm max-w-2xl mx-auto">
                <div className="flex items-start gap-3 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 shrink-0 mt-0.5 text-red-600">
                       <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <h3 className="font-bold text-lg text-red-700">{UI.overloadTitle}</h3>
                        <p className="mt-1 text-sm text-red-600">{isPT ? 'Ocorreu um erro ao tentar extrair os dados dos fatos.' : 'An error occurred while trying to extract data from the facts.'}</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <button onClick={() => onRetry()} className="w-full sm:w-auto bg-red-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001a7.5 7.5 0 0 1-1.08 3.916m-6.9-3.916a7.5 7.5 0 0 1 7.98 3.916m-7.98 3.916A7.5 7.5 0 0 1 3 13.5a7.5 7.5 0 0 1 1.97-5.023l-1.07-1.071A9.954 9.954 0 0 0 1.5 13.5a9.954 9.954 0 0 0 3.257 7.027l.908-1.028A7.5 7.5 0 0 1 3 13.5" /></svg>
                        {UI.retryCurrent}
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-red-200 flex-1"></div>
                        <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">ou</span>
                        <div className="h-px bg-red-200 flex-1"></div>
                    </div>
                    <div>
                        <p className="text-sm font-medium mb-3 text-red-900">{UI.overloadRetryOption}</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={() => onRetry('models/gemini-3.1-pro-preview')} className="flex-1 bg-white border border-red-300 text-red-700 font-medium py-2 px-4 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2">{UI.useModel('Gemini 3.1 Pro')}</button>
                            <button onClick={() => onRetry('models/gemini-3-flash-preview')} className="flex-1 bg-white border border-red-300 text-red-700 font-medium py-2 px-4 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2">{UI.useModel('Gemini 3 Flash')}</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if ((isLoading || isPending) && !data.extractionError) {
        return <LoadingTips language={language} onClose={onCancel} />;
    }

    if (data.formPhase === 'review') {
        return (
            <PetitionDataReview 
                initialData={data.initialPetitionData}
                summaryContent={data.summaryContent}
                onConfirm={handleDataConfirmation}
                isLoading={isLoading || isPending}
                language={language}
            />
        );
    }

    return (
        <PetitionFactsInput 
            onAnalyze={handleFactsAnalysis}
            isLoading={isLoading || isPending}
            language={language}
        />
    );
};
