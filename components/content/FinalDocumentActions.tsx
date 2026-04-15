
import React, { useState } from 'react';
import { getUI } from '../../ui';
import { CopyIcon, CheckIcon, EmentaIcon, RegenerateIcon, NewAnalysisIcon } from '../Icons';
import { useWorkflowState, useWorkflowDispatch } from '../../context/WorkflowContext';
import { copyToClipboard } from '../../utils/clipboardUtils';
import { Task } from '../../types';
import { CustomSlider } from '../ui/CustomSlider';

export interface RevisorSuggestion {
    id: string;
    description: string;
}

interface FinalDocumentActionsProps {
    contentToCopy: string;
    showGenerateEmenta?: boolean;
    isGeneratingEmenta?: boolean;
    isRevisorReport?: boolean;
    revisorSuggestions?: RevisorSuggestion[] | null;
    onApplyRevisorSolutions?: (selectedIds?: string[]) => void;
    onNewAnalysis?: () => void;
    copyOptions?: {
        isJustified?: boolean;
        withIndentation?: boolean;
    };
}

export const FinalDocumentActions: React.FC<FinalDocumentActionsProps> = ({ 
    contentToCopy, 
    showGenerateEmenta, 
    isGeneratingEmenta,
    isRevisorReport,
    revisorSuggestions,
    onApplyRevisorSolutions,
    onNewAnalysis,
    copyOptions
}) => {
    const { language, task } = useWorkflowState();
    const { handleRedo, handleRewriteWithInstruction, handleGenerateEmentaFromAto, handleReset } = useWorkflowDispatch();

    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const [showRewriteOptions, setShowRewriteOptions] = useState(false);
    const [rewriteInstruction, setRewriteInstruction] = useState('');
    const [lengthValue, setLengthValue] = useState(0);
    const [toneValue, setToneValue] = useState(0);
    const [showInstructionInput, setShowInstructionInput] = useState(false);
    const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<string[]>([]);
    const UI = getUI(language).actions;
    const initialScreenUI = getUI(language).initialScreen;

    const [hasInitializedSelections, setHasInitializedSelections] = useState(false);

    React.useEffect(() => {
        if (revisorSuggestions && revisorSuggestions.length > 0 && !hasInitializedSelections) {
            setSelectedSuggestionIds(revisorSuggestions.map(s => s.id));
            setHasInitializedSelections(true);
        }
    }, [revisorSuggestions, hasInitializedSelections]);

    const handleCopy = async () => {
        try {
            await copyToClipboard(contentToCopy, undefined, copyOptions);
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2500);
        } catch (err) {
            alert('Falha ao copiar o texto.');
        }
    };

    const toggleSuggestion = (id: string) => {
        setSelectedSuggestionIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleApplySolutions = () => {
        if (onApplyRevisorSolutions) {
            if (revisorSuggestions && revisorSuggestions.length > 0) {
                onApplyRevisorSolutions(selectedSuggestionIds);
            } else {
                onApplyRevisorSolutions();
            }
        }
    };

    const MarketingLink = () => (
        <div className="w-full text-center pt-6 mt-4 border-t border-dashed border-slate-200">
            <p className="text-xs text-slate-500 mb-2">{initialScreenUI.footerNote}</p>
            <a 
                href="https://youtu.be/sjR-AcKdaRI"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium inline-flex items-center gap-1 transition-colors"
            >
                {initialScreenUI.footerLink}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M5 10a.75.75 0 0 1 .75-.75h6.638L10.23 7.29a.75.75 0 1 1 1.04-1.08l3.5 3.25a.75.75 0 0 1 0 1.08l-3.5 3.25a.75.75 0 1 1-1.04-1.08l2.158-1.96H5.75A.75.75 0 0 1 5 10Z" clipRule="evenodd" />
                </svg>
            </a>
        </div>
    );

    if (isRevisorReport) {
        return (
            <div className="mt-8 border-t border-slate-200 pt-6 flex flex-col w-full animate-fade-in">
                <div className="w-full flex justify-end mb-6">
                    <button
                        onClick={handleCopy}
                        className={`font-medium py-1.5 px-3 rounded-lg transition-colors flex items-center gap-2 text-sm border shadow-sm
                        ${copyStatus === 'copied' 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        {copyStatus === 'copied' ? <CheckIcon /> : <CopyIcon />}
                        {copyStatus === 'copied' ? (language === 'pt-BR' ? 'Copiado!' : 'Copied!') : (language === 'pt-BR' ? 'Copiar Relatório' : 'Copy Report')}
                    </button>
                </div>

                {revisorSuggestions && revisorSuggestions.length > 0 && (
                    <div className="max-w-4xl mx-auto w-full mb-8 bg-slate-50 rounded-xl border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">
                            {language === 'pt-BR' ? 'Selecione as melhorias para aplicar:' : 'Select improvements to apply:'}
                        </h3>
                        <div className="flex flex-col gap-3">
                            {revisorSuggestions.map((suggestion) => (
                                <label 
                                    key={suggestion.id} 
                                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors
                                        ${selectedSuggestionIds.includes(suggestion.id) 
                                            ? 'bg-white border-blue-300 shadow-sm' 
                                            : 'bg-slate-100/50 border-slate-200 opacity-70 hover:opacity-100'
                                        }`}
                                >
                                    <div className="pt-0.5">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={selectedSuggestionIds.includes(suggestion.id)}
                                            onChange={() => toggleSuggestion(suggestion.id)}
                                        />
                                    </div>
                                    <span className="text-slate-700 leading-relaxed">{suggestion.description}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto w-full">
                    <button
                        onClick={handleApplySolutions}
                        disabled={Boolean(revisorSuggestions && revisorSuggestions.length > 0 && selectedSuggestionIds.length === 0)}
                        className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-500 transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-base justify-center min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        {language === 'pt-BR' ? 'Aplicar Soluções' : 'Apply Solutions'}
                    </button>
                    
                    <button
                        onClick={onNewAnalysis}
                        className="bg-white text-slate-700 font-medium py-3 px-6 rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-2 text-base justify-center shadow-sm min-w-[200px]"
                    >
                        <NewAnalysisIcon />
                        {language === 'pt-BR' ? 'Outra Análise' : 'New Analysis'}
                    </button>
                </div>

                <MarketingLink />
            </div>
        );
    }

    return (
        <div className="mt-8 border-t border-slate-200 pt-6 flex flex-col max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between gap-4 flex-wrap w-full">
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={handleCopy}
                        className={`font-medium py-2 px-5 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed
                            ${copyStatus === 'copied' 
                                ? 'bg-green-600 text-white' 
                                : 'bg-blue-600 text-white hover:bg-blue-500'
                            }`}
                    >
                        {copyStatus === 'copied' ? <CheckIcon /> : <CopyIcon />}
                        {copyStatus === 'copied' ? UI.copied : UI.copyText}
                    </button>
                    
                    {task === Task.TEMPLATE ? (
                        <button
                            onClick={handleReset}
                            className="bg-slate-200 text-slate-700 font-medium py-2 px-5 rounded-lg hover:bg-slate-300 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            title={language === 'pt-BR' ? "Retornar ao Início" : "Return to Start"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                            </svg>
                            {language === 'pt-BR' ? 'Início' : 'Home'}
                        </button>
                    ) : (
                        <div className="relative">
                            <button
                                onClick={() => setShowRewriteOptions(!showRewriteOptions)}
                                className="bg-slate-200 text-slate-700 font-medium py-2 px-5 rounded-lg hover:bg-slate-300 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                title={UI.redo}
                            >
                                <RegenerateIcon />
                                {UI.redo}
                            </button>
                            
                            {showRewriteOptions && (
                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => { setShowRewriteOptions(false); setShowInstructionInput(false); setRewriteInstruction(''); setLengthValue(0); setToneValue(0); }}></div>
                                    <div className="absolute bottom-full mb-2 left-0 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fade-in-up">
                                        {!showInstructionInput ? (
                                            <div className="flex flex-col">
                                                <button 
                                                    onClick={() => {
                                                        setShowRewriteOptions(false);
                                                        handleRedo();
                                                    }}
                                                    className="px-4 py-3 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium border-b border-slate-100 transition-colors"
                                                >
                                                    {language === 'pt-BR' ? 'Refazer com outras palavras' : 'Rewrite with other words'}
                                                </button>
                                                <button 
                                                    onClick={() => setShowInstructionInput(true)}
                                                    className="px-4 py-3 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors"
                                                >
                                                    {language === 'pt-BR' ? 'Ajustar com I.A.' : 'Adjust with A.I.'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="p-4 flex flex-col gap-4">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider px-1">
                                                        <span>{language === 'pt-BR' ? 'Mais curto' : 'Shorter'}</span>
                                                        <span>{language === 'pt-BR' ? 'Tamanho' : 'Length'}</span>
                                                        <span>{language === 'pt-BR' ? 'Mais longo' : 'Longer'}</span>
                                                    </div>
                                                    <CustomSlider 
                                                        min={-2} 
                                                        max={2} 
                                                        value={lengthValue}
                                                        onChange={setLengthValue}
                                                    />
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider px-1">
                                                        <span>{language === 'pt-BR' ? 'Mais simples' : 'Simpler'}</span>
                                                        <span>{language === 'pt-BR' ? 'Tom' : 'Tone'}</span>
                                                        <span>{language === 'pt-BR' ? 'Mais formal' : 'More formal'}</span>
                                                    </div>
                                                    <CustomSlider 
                                                        min={-2} 
                                                        max={2} 
                                                        value={toneValue}
                                                        onChange={setToneValue}
                                                    />
                                                </div>

                                                <div className="flex flex-col gap-1.5 mt-1">
                                                    <label className="text-xs font-semibold text-slate-600">
                                                        {language === 'pt-BR' ? 'Peça ao Gemini' : 'Ask Gemini'}
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            value={rewriteInstruction}
                                                            onChange={(e) => setRewriteInstruction(e.target.value)}
                                                            placeholder={language === 'pt-BR' ? 'Ex: Mude para a 3ª pessoa...' : 'Ex: Change to 3rd person...'}
                                                            className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && (rewriteInstruction.trim() || lengthValue !== 0 || toneValue !== 0)) {
                                                                    const applyBtn = document.getElementById('apply-rewrite-btn');
                                                                    if (applyBtn) applyBtn.click();
                                                                }
                                                            }}
                                                        />
                                                        <button 
                                                            id="apply-rewrite-btn"
                                                            onClick={() => {
                                                                let instructions = [];
                                                                
                                                                if (lengthValue !== 0) {
                                                                    if (lengthValue === -2) instructions.push(language === 'pt-BR' ? "ficar muito mais curto, resumindo apenas o essencial" : "be much shorter, summarizing only the essentials");
                                                                    if (lengthValue === -1) instructions.push(language === 'pt-BR' ? "ficar um pouco mais conciso e direto" : "be a bit more concise and direct");
                                                                    if (lengthValue === 1) instructions.push(language === 'pt-BR' ? "ficar um pouco mais detalhado, expandindo as ideias" : "be a bit more detailed, expanding ideas");
                                                                    if (lengthValue === 2) instructions.push(language === 'pt-BR' ? "ficar muito mais longo e explicativo, adicionando mais detalhes e contexto" : "be much longer and explanatory, adding more details and context");
                                                                }

                                                                if (toneValue !== 0) {
                                                                    if (toneValue === -2) instructions.push(language === 'pt-BR' ? "ter um tom mais simples e acessível a leigos" : "have a very simple tone accessible to laypeople");
                                                                    if (toneValue === -1) instructions.push(language === 'pt-BR' ? "ter um tom mais claro e direto, não tão formal" : "have a clearer and more direct tone, less technical");
                                                                    if (toneValue === 1) instructions.push(language === 'pt-BR' ? "ter um tom muito formal e polido" : "have a more formal and polished tone");
                                                                    if (toneValue === 2) instructions.push(language === 'pt-BR' ? "ter um tom extremamente técnico e formal" : "have an extremely formal, technical, and legal tone");
                                                                }

                                                                if (rewriteInstruction.trim()) {
                                                                    instructions.push(rewriteInstruction.trim());
                                                                }

                                                                let finalInstruction = '';
                                                                if (instructions.length > 0) {
                                                                    finalInstruction = language === 'pt-BR' 
                                                                        ? `Reescreva este texto para: ${instructions.join('; e ')}.`
                                                                        : `Rewrite this text to: ${instructions.join('; and ')}.`;
                                                                } else {
                                                                    finalInstruction = language === 'pt-BR' ? 'Reescrever mantendo o mesmo tom e tamanho.' : 'Rewrite keeping the same tone and length.';
                                                                }

                                                                setShowRewriteOptions(false);
                                                                setShowInstructionInput(false);
                                                                handleRewriteWithInstruction(finalInstruction);
                                                                setRewriteInstruction('');
                                                                setLengthValue(0);
                                                                setToneValue(0);
                                                            }}
                                                            disabled={!rewriteInstruction.trim() && lengthValue === 0 && toneValue === 0}
                                                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                                                        >
                                                            {language === 'pt-BR' ? 'Aplicar' : 'Apply'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {showGenerateEmenta && (
                        <button
                            onClick={handleGenerateEmentaFromAto}
                            disabled={isGeneratingEmenta}
                            className="bg-blue-100 text-blue-700 font-medium py-2 px-5 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                        >
                            {isGeneratingEmenta ? (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <EmentaIcon />
                            )}
                            {isGeneratingEmenta ? UI.generating : UI.generateEmenta}
                        </button>
                    )}
                </div>
            </div>
            <MarketingLink />
        </div>
    );
};
