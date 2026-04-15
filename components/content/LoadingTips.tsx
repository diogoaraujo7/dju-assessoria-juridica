
import React, { useState, useEffect, useMemo } from 'react';
import { Language, Step } from '../../types';
import { getUI } from '../../ui';

interface LoadingTipsProps {
    language: Language;
    isGeneratingSuggestions?: boolean;
    viewingStep?: Step;
    onSkip?: () => void;
    onRestart?: () => void;
    onClose?: () => void;
}

export const LoadingTips: React.FC<LoadingTipsProps> = ({ language, isGeneratingSuggestions, viewingStep, onSkip: _onSkip, onRestart, onClose }) => {
    const UI = getUI(language);
    const isPT = language === 'pt-BR';
    
    const activeTips = useMemo(() => {
        const allTips = getUI(language).loadingTips;
        const shuffled = [...allTips].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 4);
    }, [language]);

    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const [opacity, setOpacity] = useState(1);

    useEffect(() => {
        const displayDuration = 3500; 
        const fadeDuration = 500; 

        const interval = setInterval(() => {
            setOpacity(0);

            setTimeout(() => {
                setCurrentTipIndex((prevIndex) => (prevIndex + 1) % activeTips.length);
                setOpacity(1);
            }, fadeDuration);
            
        }, displayDuration + fadeDuration);

        return () => clearInterval(interval);
    }, [activeTips.length]);

    let title = isGeneratingSuggestions 
        ? UI.actions.generatingSuggestionsTitle 
        : (isPT ? 'Aguarde enquanto o assistente analisa os dados...' : 'Please wait, the assistant is analyzing...');

    let subtitle = isGeneratingSuggestions
        ? UI.actions.generatingSuggestionsDesc
        : (isPT ? 'Isso pode levar alguns segundos.' : 'This may take a few seconds.');

    if (viewingStep === Step.ATO_PONTOS_DIVERGENCIA) {
        title = isPT ? "Analisando Voto do Relator..." : "Analyzing Rapporteur's Vote...";
        subtitle = isPT ? "Identificando pontos controvertidos." : "Identifying controversial points to suggest divergence.";
    }

    if (viewingStep === Step.REVISOR_ANALISE) {
        title = isPT ? "Dju Relatórios de Revisão" : "Dju Legal Assistant working...";
        subtitle = isPT ? "Analisando documentos, verificando fidedignidade e elaborando Relatório Técnico." : "Analyzing documents, checking fidelity, and drafting Technical Report.";
    }

    const currentTip = activeTips[currentTipIndex];

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center flex flex-col items-center gap-6 relative overflow-hidden border border-slate-200">
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        title={isPT ? "Cancelar e fechar" : "Cancel and close"}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 animate-pulse"></div>
                
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-blue-50"></div>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
                    <p className="text-slate-500">{subtitle}</p>
                </div>

                <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 min-h-[80px] flex items-center justify-center relative transition-colors duration-500">
                    <p 
                        className="text-slate-700 font-medium text-sm transition-opacity duration-500 ease-in-out leading-relaxed"
                        style={{ opacity: opacity }}
                    >
                        {currentTip}
                    </p>
                </div>

                {onRestart && (
                    <button 
                        onClick={onRestart}
                        className="mt-2 px-4 py-2 rounded-lg text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 font-medium transition-colors flex items-center gap-2"
                        title={isPT ? "Reiniciar geração se o sistema estiver travado" : "Restart generation if the system is stuck"}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        {isPT ? "Reiniciar geração" : "Restart generation"}
                    </button>
                )}
                
                <div className="w-full pt-4 mt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-400 font-medium mb-1">
                        {UI.loadingMarketing.intro}
                    </p>
                    <a 
                        href="https://youtu.be/sjR-AcKdaRI"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-500 font-semibold transition-colors"
                    >
                        {UI.loadingMarketing.linkText}
                    </a>
                </div>
            </div>
        </div>
    );
};
