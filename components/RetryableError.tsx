
import React from 'react';
import { getUI } from '../ui';
import { Language } from '../types';

interface RetryableErrorProps {
    onRetry: (model?: string) => void;
    onContinue?: () => void;
    onReset?: () => void;
    partialContent?: string;
    language: Language;
}

export const RetryableError: React.FC<RetryableErrorProps> = ({ onRetry, onContinue, onReset, partialContent, language }) => {
    const UI = getUI(language).actions;
    const isTokenLimitError = partialContent?.includes(UI.tokenLimitTitle);
    const isFileSizeLimitError = partialContent?.includes(UI.fileSizeLimitTitle);
    const isQuotaExceededError = partialContent?.includes(UI.quotaExceededTitle);
    const hasPartialContent = partialContent && partialContent.length > 50 && !partialContent.startsWith(UI.overloadTitle) && !partialContent.startsWith(UI.quotaExceededTitle) && !isTokenLimitError && !isFileSizeLimitError;

    if (isTokenLimitError || isFileSizeLimitError) {
        const title = isTokenLimitError ? UI.tokenLimitTitle : UI.fileSizeLimitTitle;
        const desc = isTokenLimitError ? UI.tokenLimitDesc : UI.fileSizeLimitDesc;
        const action = isTokenLimitError ? UI.tokenLimitAction : UI.fileSizeLimitAction;

        return (
            <div className="p-6 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-900 animate-fade-in shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                    <div className="bg-yellow-200 p-2 rounded-full text-yellow-800 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-yellow-900">{title}</h3>
                        <p className="mt-2 text-sm text-yellow-800 leading-relaxed">
                            {desc}
                        </p>
                    </div>
                </div>
                
                <div className="mt-6 flex flex-col gap-3">
                    <p className="text-sm font-semibold mb-2">{action}</p>
                    <button
                        onClick={() => onReset && onReset()} 
                        className="bg-yellow-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                        </svg>
                        {language === 'pt-BR' ? 'Voltar' : 'Back'}
                    </button>
                </div>
            </div>
        );
    }

    if (isQuotaExceededError) {
        return (
            <div className="p-6 bg-orange-50 border border-orange-300 rounded-lg text-orange-900 animate-fade-in shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                    <div className="bg-orange-200 p-2 rounded-full text-orange-800 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-orange-900">{UI.quotaExceededTitle}</h3>
                        <p className="mt-2 text-sm text-orange-800 leading-relaxed">
                            {UI.quotaExceededDesc}
                        </p>
                    </div>
                </div>
                
                <div className="mt-6 flex flex-col gap-3">
                    <button
                        onClick={() => onRetry()}
                        className="bg-orange-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001a7.5 7.5 0 0 1-1.08 3.916m-6.9-3.916a7.5 7.5 0 0 1 7.98 3.916m-7.98 3.916A7.5 7.5 0 0 1 3 13.5a7.5 7.5 0 0 1 1.97-5.023l-1.07-1.071A9.954 9.954 0 0 0 1.5 13.5a9.954 9.954 0 0 0 3.257 7.027l.908-1.028A7.5 7.5 0 0 1 3 13.5" />
                        </svg>
                        {language === 'pt-BR' ? 'Tentar Novamente' : 'Try Again'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800 animate-fade-in shadow-sm">
            <div className="flex items-start gap-3 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 shrink-0 mt-0.5 text-red-600">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                </svg>
                <div>
                    <h3 className="font-bold text-lg text-red-700">{UI.overloadTitle}</h3>
                    <p className="mt-1 text-sm text-red-600">
                        {hasPartialContent 
                            ? (language === 'pt-BR' ? 'A conexão foi interrompida, mas parte do texto foi gerada.' : 'The connection was interrupted, but part of the text was generated.')
                            : (language === 'pt-BR' ? 'O modelo de IA não respondeu após várias tentativas automáticas.' : 'The AI model did not respond after several automatic attempts.')
                        }
                    </p>
                </div>
            </div>
            
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    {hasPartialContent && onContinue && (
                        <button
                            onClick={() => onContinue()}
                            className="flex-1 bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                            </svg>
                            {language === 'pt-BR' ? 'Continuar de onde parou' : 'Continue generating'}
                        </button>
                    )}
                    <button
                        onClick={() => onRetry()}
                        className={`flex-1 bg-red-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-red-500 transition-colors flex items-center justify-center gap-2 shadow-sm ${!hasPartialContent ? 'w-full sm:w-auto' : ''}`}
                    >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001a7.5 7.5 0 0 1-1.08 3.916m-6.9-3.916a7.5 7.5 0 0 1 7.98 3.916m-7.98 3.916A7.5 7.5 0 0 1 3 13.5a7.5 7.5 0 0 1 1.97-5.023l-1.07-1.071A9.954 9.954 0 0 0 1.5 13.5a9.954 9.954 0 0 0 3.257 7.027l.908-1.028A7.5 7.5 0 0 1 3 13.5" />
                        </svg>
                        {hasPartialContent 
                            ? (language === 'pt-BR' ? 'Descartar e Reiniciar' : 'Discard and Restart') 
                            : UI.retryCurrent
                        }
                    </button>
                </div>
                
                {!hasPartialContent && (
                    <>
                        <div className="flex items-center gap-4">
                            <div className="h-px bg-red-200 flex-1"></div>
                            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">ou</span>
                            <div className="h-px bg-red-200 flex-1"></div>
                        </div>

                        <div>
                            <p className="text-sm font-medium mb-3 text-red-900">{UI.overloadRetryOption}</p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => onRetry('models/gemini-3.1-pro-preview')}
                                    className="flex-1 bg-white border border-red-300 text-red-700 font-medium py-2 px-4 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    {UI.useModel('Gemini 3.1 Pro')}
                                </button>
                                <button
                                    onClick={() => onRetry('models/gemini-3-flash-preview')}
                                    className="flex-1 bg-white border border-red-300 text-red-700 font-medium py-2 px-4 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    {UI.useModel('Gemini 3 Flash')}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
