import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChoiceThenInputStepData, ArgumentSuggestionStepData, Language, AnalysisViewMode, AnalysisView } from '../../types';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { getMenuOptions } from '../../ui';
import { CopyIcon, CheckIcon } from '../Icons';
import { copyToClipboard } from '../../utils/clipboardUtils';

interface AnalysisSummaryAndMenuViewProps {
    data: ChoiceThenInputStepData | ArgumentSuggestionStepData;
    isLoading: boolean;
    loadingMenuItem: string | null;
    language: Language;
    setAnalysisView: (view: AnalysisView) => void;
    onAction: (item: string) => void;
    onRetry: () => void;
}

export const AnalysisSummaryAndMenuView: React.FC<AnalysisSummaryAndMenuViewProps> = ({ 
    data, isLoading, loadingMenuItem, language, setAnalysisView, onAction, onRetry 
}) => {
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const [isMenuExpanded, setIsMenuExpanded] = useState(false);
    const [questionText, setQuestionText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const prevMessagesCountRef = useRef(Object.keys(data.subResponses || {}).length);

    const MENU_OPTIONS = getMenuOptions(language);
    const hasSummary = !!data.summaryContent && data.summaryContent.length > 20;
    const summaryFinishedLoading = !isLoading && hasSummary;

    const handleCopy = async () => {
        if (!data.summaryContent) return;
        try {
            await copyToClipboard(formattedSummary);
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2500);
        } catch (err) {
            alert('Falha ao copiar o texto.');
        }
    };

    const formattedSummary = useMemo(() => {
        if (!data.summaryContent) return '';
        let content = data.summaryContent.replace(/\\n/g, '\n');
        return content.replace(/([^\n])\n([^\n])/g, '$1\n\n$2');
    }, [data.summaryContent]);

    const LinkRenderer = (props: any) => {
        let text = '';
        if (typeof props.children === 'string') {
            text = props.children;
        } else if (Array.isArray(props.children) && typeof props.children[0] === 'string') {
            text = props.children[0];
        } else {
            text = String(props.children);
        }
        
        const isCitationIndex = /^\[?\d+\]?$/.test(text);

        if (isCitationIndex) {
            const displayText = text.startsWith('[') ? text : `[${text}]`;
            return (
                <a 
                    {...props} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline align-super text-[0.7em] font-bold text-indigo-800 hover:text-indigo-600 transition-colors no-underline cursor-pointer"
                    title="Ver fonte"
                >
                    {displayText}
                </a>
            );
        }

        return <a {...props} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline font-bold transition-colors cursor-pointer decoration-2 underline-offset-2" />;
    };

    const handleAskQuestion = () => {
        if (!questionText.trim() || isLoading) return;
        const q = questionText.trim();
        setQuestionText('');
        setIsMenuExpanded(false);
        onAction(q);
    };

    const handleOptionClick = (option: string) => {
        if (isLoading) return;
        setIsMenuExpanded(false);
        onAction(option);
    };

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        const currentCount = Object.keys(data.subResponses || {}).length;
        if (loadingMenuItem || currentCount > prevMessagesCountRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        prevMessagesCountRef.current = currentCount;
    }, [data.subResponses, loadingMenuItem]);

    // Scroll to top on initial mount
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, []);

    const subResponsesList = Object.entries(data.subResponses || {});

    return (
        <div className="w-full flex flex-col h-full min-h-[500px]">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-xl font-semibold text-slate-700">
                    {language === 'pt-BR' ? 'a. Análise Processual' : 'a. Procedural Analysis'}
                </h3>
                <button
                    onClick={() => setAnalysisView(AnalysisViewMode.POINTS)}
                    disabled={!summaryFinishedLoading}
                    className="text-sm bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    {language === 'pt-BR' ? 'Pontos Controvertidos' : 'Controversial Points'} &rarr;
                </button>
            </div>

            {/* Chat History Area */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-4">
                {/* First Message: Summary */}
                {hasSummary ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 ml-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" /></svg>
                            </div>
                            Dju
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-5 shadow-sm">
                            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-2">
                                <h4 className="font-semibold text-slate-700">{language === 'pt-BR' ? 'Relato dos Fatos' : 'Facts Summary'}</h4>
                                <button
                                    onClick={handleCopy}
                                    className={`p-1.5 rounded-md transition-colors ${copyStatus === 'copied' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
                                    title={language === 'pt-BR' ? 'Copiar Relato' : 'Copy Summary'}
                                >
                                    {copyStatus === 'copied' ? <CheckIcon /> : <CopyIcon />}
                                </button>
                            </div>
                            <div className="prose prose-slate max-w-none prose-base prose-p:text-justify">
                                <MarkdownRenderer>{formattedSummary}</MarkdownRenderer>
                            </div>
                        </div>
                    </div>
                ) : (
                    isLoading && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-4">
                            <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
                            <p>{language === 'pt-BR' ? 'Analisando os Autos e gerando relato...' : 'Analyzing Case Files and generating summary...'}</p>
                        </div>
                    )
                )}

                {/* Subsequent Messages */}
                {subResponsesList.map(([question, answer], index) => (
                    <React.Fragment key={index}>
                        {/* User Question */}
                        <div id={`message-${index}`} className="flex flex-col gap-2 items-end">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mr-2">
                                {language === 'pt-BR' ? 'Você' : 'You'}
                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" /></svg>
                                </div>
                            </div>
                            <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm p-4 shadow-sm max-w-[85%]">
                                <p className="text-base whitespace-pre-wrap">{question}</p>
                            </div>
                        </div>

                        {/* AI Answer */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 ml-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" /></svg>
                                </div>
                                Dju
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-5 shadow-sm">
                                {answer.includes("O modelo de IA está sobrecarregado") ? (
                                    <div className="text-red-800">
                                        <p className="mb-4 font-medium text-sm">{answer}</p>
                                        <button
                                            onClick={onRetry}
                                            className="bg-red-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-red-500 transition-colors flex items-center gap-2 text-xs"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001a7.5 7.5 0 0 1-1.08 3.916m-6.9-3.916a7.5 7.5 0 0 1 7.98 3.916m-7.98 3.916A7.5 7.5 0 0 1 3 13.5a7.5 7.5 0 0 1 1.97-5.023l-1.07-1.071A9.954 9.954 0 0 0 1.5 13.5a9.954 9.954 0 0 0 3.257 7.027l.908-1.028A7.5 7.5 0 0 1 3 13.5" />
                                            </svg>
                                            {language === 'pt-BR' ? 'Tentar Novamente' : 'Try Again'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <div className="prose prose-slate max-w-none prose-base prose-a:text-blue-600 hover:prose-a:underline">
                                            <MarkdownRenderer components={{ a: LinkRenderer }}>{answer}</MarkdownRenderer>
                                        </div>
                                        {data.subResponseSources && data.subResponseSources[question] && data.subResponseSources[question].length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-indigo-400">
                                                        <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                                                    </svg>
                                                    {language === 'pt-BR' ? 'Fontes Consultadas' : 'Sources Consulted'}
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {data.subResponseSources[question].map((source: any, idx: number) => {
                                                        const uri = source.web?.uri;
                                                        const title = source.web?.title || uri;
                                                        if (!uri) return null;
                                                        
                                                        const displayTitle = title.length > 40 ? title.substring(0, 40) + '...' : title;
                                                        
                                                        return (
                                                            <a 
                                                                key={idx}
                                                                href={uri}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 rounded-full text-xs font-medium text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 transition-all max-w-full shadow-sm hover:shadow-md"
                                                                title={title}
                                                            >
                                                                <span className="font-bold text-indigo-400">[{idx + 1}]</span>
                                                                <span className="truncate max-w-[220px]">{displayTitle}</span>
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-indigo-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5">
                                                                    <path fillRule="evenodd" d="M5 10a.75.75 0 0 1 .75-.75h6.638L10.23 7.29a.75.75 0 1 1 1.04-1.08l3.5 3.25a.75.75 0 0 1 0 1.08l-3.5 3.25a.75.75 0 1 1-1.04-1.08l2.158-1.96H5.75A.75.75 0 0 1 5 10Z" clipRule="evenodd" />
                                                                </svg>
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </React.Fragment>
                ))}

                {/* Loading State for new question */}
                {isLoading && loadingMenuItem && !data.subResponses?.[loadingMenuItem] && (
                    <div className="flex flex-col gap-2 items-end">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mr-2">
                            {language === 'pt-BR' ? 'Você' : 'You'}
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" /></svg>
                            </div>
                        </div>
                        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm p-4 shadow-sm max-w-[85%]">
                            <p className="text-sm whitespace-pre-wrap">{loadingMenuItem}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 ml-2 self-start mt-4">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" /></svg>
                            </div>
                            Dju
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-5 shadow-sm self-start">
                            <div className="flex items-center gap-3 text-slate-500">
                                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-sm">{language === 'pt-BR' ? 'Analisando e pesquisando...' : 'Analyzing and searching...'}</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm mt-4 overflow-hidden transition-all duration-300">
                {/* Expandable Menu Options */}
                <div className={`border-b border-slate-100 bg-slate-50 overflow-hidden transition-all duration-300 ${isMenuExpanded ? 'max-h-80 overflow-y-auto custom-scrollbar' : 'max-h-0'}`}>
                    <div className="p-3 space-y-4">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                                {language === 'pt-BR' ? 'Opções de Análise' : 'Analysis Options'}
                            </h4>
                            <div className="space-y-1">
                                {MENU_OPTIONS.map((option, idx) => {
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleOptionClick(option.prompt)}
                                            disabled={isLoading}
                                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {subResponsesList.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1 border-t border-slate-200 pt-3">
                                    {language === 'pt-BR' ? 'Navegar para Respostas' : 'Navigate to Answers'}
                                </h4>
                                <div className="space-y-1">
                                    {subResponsesList.map(([question, _], idx) => (
                                        <button
                                            key={`nav-${idx}`}
                                            onClick={() => {
                                                setIsMenuExpanded(false);
                                                const element = document.getElementById(`message-${idx}`);
                                                if (element) {
                                                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-md transition-colors truncate"
                                            title={question}
                                        >
                                            <span className="text-slate-400 mr-2">#{idx + 1}</span>
                                            {question}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Input Field */}
                <div className="p-2 flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    <button
                        onClick={() => setIsMenuExpanded(!isMenuExpanded)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors shrink-0 ${isMenuExpanded ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
                        title={language === 'pt-BR' ? 'Ver exemplos de perguntas' : 'View example questions'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 transition-transform ${isMenuExpanded ? 'rotate-180' : ''}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                        <span className="text-sm font-medium hidden sm:inline">
                            {language === 'pt-BR' ? 'Exemplos' : 'Examples'}
                        </span>
                    </button>
                    
                    <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAskQuestion();
                            }
                        }}
                        placeholder={language === 'pt-BR' ? 'Faça uma pergunta...' : 'Ask a question...'}
                        className="flex-1 min-h-[44px] max-h-[120px] p-2.5 bg-transparent resize-none focus:outline-none text-sm text-slate-700"
                        rows={1}
                        disabled={isLoading}
                    />
                    
                    <button
                        onClick={handleAskQuestion}
                        disabled={!questionText.trim() || isLoading}
                        className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};
