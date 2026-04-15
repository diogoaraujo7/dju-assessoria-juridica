
import React, { useState, useRef, useMemo, useEffect, useReducer } from 'react';
import { ArgumentSuggestionStepData, GoogleSearchResult, Language } from '../../types';
import { getUI } from '../../ui';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { FileIcon, WebSearchIcon, ReturnIcon } from '../Icons';
import { ArgumentCard } from './ArgumentCard';
import { WebSearchAnalysis } from './WebSearchAnalysis';
import { buildArgumentConfirmation } from '../../utils/promptBuilder';
import { FileAttachmentHint } from '../FileAttachmentHint';

interface ArgumentSuggestionContentProps {
    data: ArgumentSuggestionStepData;
    onConfirm: (selectedArgumentsText: string, files: File[]) => void;
    onGoogleSearchForBases: (point: string) => void;
    isDivergentFlow?: boolean;
    sidebarOpen: boolean;
    language: Language;
    scrollToTop?: () => void;
    onRegenerate?: () => void;
}



interface ComponentState {
  selectedArguments: Map<string, Set<string>>;
  additionalBases: Record<string, { text: string; files: File[] }>;
  openInputForPoint: string | null;
  dismissedPoints: Set<string>;
  currentPage: number;
  selectedSearchArguments: Map<string, Set<string>>;
}

const initialState: ComponentState = {
  selectedArguments: new Map(),
  additionalBases: {},
  openInputForPoint: null,
  dismissedPoints: new Set(),
  currentPage: 0,
  selectedSearchArguments: new Map(),
};

type Action =
  | { type: 'TOGGLE_ARGUMENT'; payload: { point: string; title: string } }
  | { type: 'TOGGLE_SEARCH_ARGUMENT'; payload: { point: string; title: string } }
  | { type: 'TOGGLE_DISMISS_POINT'; payload: { point: string } }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_OPEN_INPUT'; payload: string | null }
  | { type: 'SAVE_ADDITIONAL_BASES'; payload: { point: string; data: { text: string; files: File[] } } };

function reducer(state: ComponentState, action: Action): ComponentState {
  switch (action.type) {
    case 'TOGGLE_ARGUMENT': {
      const { point, title } = action.payload;
      const newSelection = new Map(state.selectedArguments);
      const pointSelection = new Set<string>(newSelection.get(point) || new Set<string>());
      if (pointSelection.has(title)) {
        pointSelection.delete(title);
      } else {
        pointSelection.add(title);
      }
      newSelection.set(point, pointSelection);
      return { ...state, selectedArguments: newSelection };
    }
    case 'TOGGLE_SEARCH_ARGUMENT': {
      const { point, title } = action.payload;
      const newSelection = new Map(state.selectedSearchArguments);
      const pointSelection = new Set<string>(newSelection.get(point) || new Set<string>());
      if (pointSelection.has(title)) {
        pointSelection.delete(title);
      } else {
        pointSelection.add(title);
      }
      newSelection.set(point, pointSelection);
      return { ...state, selectedSearchArguments: newSelection };
    }
    case 'TOGGLE_DISMISS_POINT': {
      const { point } = action.payload;
      const newDismissed = new Set(state.dismissedPoints);
      if (newDismissed.has(point)) {
        newDismissed.delete(point);
      } else {
        newDismissed.add(point);
        const newSelectedArgs = new Map(state.selectedArguments);
        newSelectedArgs.delete(point);
        const newSelectedSearchArgs = new Map(state.selectedSearchArguments);
        newSelectedSearchArgs.delete(point);
        return { ...state, dismissedPoints: newDismissed, selectedArguments: newSelectedArgs, selectedSearchArguments: newSelectedSearchArgs };
      }
      return { ...state, dismissedPoints: newDismissed };
    }
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_OPEN_INPUT':
      return { ...state, openInputForPoint: action.payload };
    case 'SAVE_ADDITIONAL_BASES': {
      const { point, data } = action.payload;
      const newAdditionalBases = { ...state.additionalBases, [point]: data };
      return { ...state, additionalBases: newAdditionalBases, openInputForPoint: null };
    }
    default:
      return state;
  }
}



const AdditionalBasesInput: React.FC<{
    onSave: (data: { text: string; files: File[] }) => void;
    onCancel: () => void;
    initialData?: { text: string; files: File[] };
    language: Language;
}> = ({ onSave, onCancel, initialData, language }) => {
    const [text, setText] = useState(initialData?.text || '');
    const [files, setFiles] = useState<File[]>(initialData?.files || []);
    const [showHint, setShowHint] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const UI = getUI(language).actions;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(prev => [...prev, ...Array.from(event.target.files!)]);
        }
    };

    const removeFile = (fileName: string) => {
        setFiles(prev => prev.filter(file => file.name !== fileName));
    };

    const handleSave = () => {
        onSave({ text, files });
    };

    const handleAttachClick = () => {
        setShowHint(true);
    };

    const handleConfirmHint = () => {
        setShowHint(false);
        fileInputRef.current?.click();
    };

    const handleCancelHint = () => {
        setShowHint(false);
    };

    return (
        <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-lg animate-fade-in space-y-3">
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={UI.manualPlaceholder}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 resize-y focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-slate-500 min-h-24 text-base"
                rows={4}
            />
            {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {files.map((file, index) => (
                        <div key={index} className="bg-slate-200 text-xs rounded-full py-1 pl-2 pr-3 flex items-center gap-2">
                            <FileIcon fileType={file.type} />
                            <span className="text-slate-600">{file.name}</span>
                            <button type="button" onClick={() => removeFile(file.name)} className="text-slate-500 hover:text-slate-800 font-mono text-lg leading-none -mr-1">
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={handleSave} className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 py-1.5 px-4 rounded-md">{UI.save}</button>
                    <button
                        type="button"
                        onClick={handleAttachClick}
                        className="bg-white text-slate-700 font-medium py-1.5 px-3 rounded-md hover:bg-slate-200 transition-colors border border-slate-300 flex items-center gap-2 text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.41-7.81 7.81a1.5 1.5 0 0 0 2.122 2.122l7.81-7.81" /></svg>
                        {UI.attach}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept=".pdf,.txt,.doc,.docx" />
                    <FileAttachmentHint 
                        isOpen={showHint} 
                        onConfirm={handleConfirmHint} 
                        onCancel={handleCancelHint} 
                        language={language} 
                    />
                </div>
                <button onClick={onCancel} className="text-sm font-medium text-slate-600 hover:text-slate-800 py-1.5 px-3 rounded-md">{UI.cancel}</button>
            </div>
        </div>
    );
};



export const ArgumentSuggestionContent: React.FC<ArgumentSuggestionContentProps> = ({ data, onConfirm, onGoogleSearchForBases, isDivergentFlow = false, sidebarOpen, language, scrollToTop, onRegenerate }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { selectedArguments, additionalBases, openInputForPoint, dismissedPoints, currentPage, selectedSearchArguments } = state;

    const UI = getUI(language).actions;
    const { suggestions } = data;

    const suggestionsArray = useMemo(() => {
        if (!suggestions) return [];
        return Array.isArray(suggestions) ? suggestions : [suggestions];
    }, [suggestions]);
    
    useEffect(() => {
        if (scrollToTop) {
            scrollToTop();
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage, scrollToTop]);

    const handleConfirm = () => {
        const result = buildArgumentConfirmation({
            suggestions: suggestionsArray,
            selectedArguments: selectedArguments,
            selectedSearchArguments: selectedSearchArguments,
            additionalBases: additionalBases,
            dismissedPoints: dismissedPoints,
            googleSearchResults: data.googleSearchResults
        });

        onConfirm(result.text, result.files);
    };

    const { allPointsAddressed } = useMemo(() => {
        const addressed = suggestionsArray.filter(suggestion => {
            const id = suggestion.pontoControvertido;
            const hasSelected = (selectedArguments.get(id)?.size ?? 0) > 0;
            const hasSearchSelected = (selectedSearchArguments.get(id)?.size ?? 0) > 0;
            const hasManual = !!additionalBases[id]?.text?.trim() || (additionalBases[id]?.files?.length ?? 0) > 0;
            const isDismissed = dismissedPoints.has(id);

            return hasSelected || hasSearchSelected || hasManual || isDismissed;
        });

        return {
            allPointsAddressed: addressed.length === suggestionsArray.length
        };
    }, [suggestionsArray, selectedArguments, selectedSearchArguments, additionalBases, dismissedPoints]);
    
    if (!suggestions || suggestionsArray.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-sm font-medium">{UI.analyzing}</p>
            </div>
        );
    }

    const suggestionItem = suggestionsArray[currentPage];
    const index = currentPage;
    const isLastPage = currentPage === suggestionsArray.length - 1;

    const hasFavorableArgs = suggestionItem.argumentosFavoraveis && suggestionItem.argumentosFavoraveis.length > 0;
    const hasContraryArgs = suggestionItem.argumentosContrarios && suggestionItem.argumentosContrarios.length > 0;
    const pointIdentifier = suggestionItem.pontoControvertido;
    const currentAdditionalBases = additionalBases[pointIdentifier];
    const isDismissed = dismissedPoints.has(pointIdentifier);
    const selectedForPoint = selectedArguments.get(pointIdentifier) || new Set();
    const selectedSearchForPoint = selectedSearchArguments.get(pointIdentifier) || new Set();

    const searchResult: GoogleSearchResult | undefined = data.googleSearchResults?.[pointIdentifier];
    const isSearching = data.isSearchingGoogle?.has(pointIdentifier);
    
    const [descricao] = (pointIdentifier || '').replace(/\\n/g, '\n').split('---PERGUNTA---');

    const sanitizeLabel = (label?: string) => {
        if (!label) return label;
        // If the model leaked JSON syntax into the string, clean it up
        // e.g., 'Proteção do terceiro.", "labelContrario": "Prevalência da presunção'
        if (label.includes('", "')) {
            const parts = label.split('", "');
            const lastPart = parts[parts.length - 1];
            return lastPart.replace(/^.*":\s*"/, '').replace(/"$/, '').trim();
        }
        return label;
    };

    return (
        <div className="animate-fade-in flex flex-col min-h-screen">
             
            <div className="flex-1 space-y-6 pb-24">
                <div key={index} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                    <div className="p-4 bg-slate-100 rounded-lg border border-slate-200 mb-6">
                        {isSearching && searchResult && (
                             <div className="mb-3 p-2 bg-indigo-50 border border-indigo-200 rounded-md flex items-center gap-2 text-indigo-700 animate-pulse">
                                <WebSearchIcon />
                                <span className="text-xs font-medium">{language === 'pt-BR' ? 'Atualizando pesquisa...' : 'Updating search...'}</span>
                             </div>
                        )}

                        <div className="flex justify-between items-start gap-4">
                             <div className="flex items-baseline gap-2 w-full">
                                <h3 className="text-lg font-bold text-slate-800 shrink-0">#{index + 1}</h3>
                                <div className="text-slate-700 prose prose-sm max-w-none prose-p:my-0 prose-headings:my-0 leading-relaxed">
                                    {descricao && <MarkdownRenderer>{descricao.trim()}</MarkdownRenderer>}
                                </div>
                             </div>
                                <button 
                                onClick={() => dispatch({ type: 'TOGGLE_DISMISS_POINT', payload: { point: pointIdentifier } })}
                                className={`shrink-0 text-xs sm:text-sm font-medium flex items-center gap-1.5 py-1.5 px-3 rounded-md transition-colors ${
                                    isDismissed 
                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                                    : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {isDismissed 
                                    ? <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.17-10.417a.75.75 0 0 1 1.085.304l2.5 6.25a.75.75 0 0 1-1.37.55l-1.92-4.8-1.92 4.8a.75.75 0 1 1-1.37-.55l2.5-6.25a.75.75 0 0 1 .295-.304Z" clipRule="evenodd" /></svg>
                                        {UI.reactivatePoint}
                                    </>
                                    : <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" /></svg>
                                        {UI.dispenseAnalysis}
                                    </>
                                }
                            </button>
                        </div>
                    </div>
                        
                    {isDismissed && (
                        <div className="p-4 bg-yellow-50 text-yellow-900 border border-yellow-200 rounded-lg text-base text-center mb-6 animate-fade-in">
                            {UI.pointDispensedMsg}
                        </div>
                    )}

                    <div className={`transition-opacity ${isDismissed ? 'opacity-40 pointer-events-none' : ''}`}>
                        
                        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                            {hasFavorableArgs && (
                                <div className="flex-1">
                                    <h3 className="text-base font-bold text-blue-600 mb-3 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        {sanitizeLabel(suggestionItem.labelFavoravel) || (language === 'pt-BR' ? 'Argumentos Favoráveis' : 'Favorable Arguments')}
                                    </h3>
                                    <div className="space-y-3">
                                        {suggestionItem.argumentosFavoraveis!.map(arg => (
                                            <ArgumentCard
                                                key={arg.titulo}
                                                title={arg.titulo}
                                                content={arg.fundamentacao}
                                                isSelected={selectedForPoint.has(arg.titulo)}
                                                onSelect={() => dispatch({ type: 'TOGGLE_ARGUMENT', payload: { point: pointIdentifier, title: arg.titulo } })}
                                                language={language}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {hasFavorableArgs && hasContraryArgs && (
                                <div className="hidden md:block w-px bg-slate-200"></div>
                            )}

                            {hasContraryArgs && (
                                <div className="flex-1">
                                    <h3 className="text-base font-bold text-blue-600 mb-3 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        {sanitizeLabel(suggestionItem.labelContrario) || (isDivergentFlow ? (language === 'pt-BR' ? 'Argumentos para Divergência' : 'Arguments for Divergence') : (language === 'pt-BR' ? 'Argumentos Contrários' : 'Opposing Arguments'))}
                                    </h3>
                                    <div className="space-y-3">
                                        {suggestionItem.argumentosContrarios!.map(arg => (
                                            <ArgumentCard
                                                key={arg.titulo}
                                                title={arg.titulo}
                                                content={arg.fundamentacao}
                                                isSelected={selectedForPoint.has(arg.titulo)}
                                                onSelect={() => dispatch({ type: 'TOGGLE_ARGUMENT', payload: { point: pointIdentifier, title: arg.titulo } })}
                                                language={language}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!hasFavorableArgs && !hasContraryArgs && (
                                <div className="w-full text-center p-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500">
                                    <p>{language === 'pt-BR' ? 'Nenhuma sugestão automática gerada para este ponto específico. Você pode utilizar a pesquisa web abaixo ou adicionar bases manualmente.' : 'No automatic suggestions generated for this specific point. You can use the web search below or add bases manually.'}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-200">
                            {searchResult && !isSearching && (
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold text-purple-800 flex items-center gap-2">
                                        <WebSearchIcon />
                                        {UI.webSearchTitleResult}
                                    </h3>
                                    <button
                                        onClick={() => onGoogleSearchForBases(pointIdentifier)}
                                        disabled={isSearching}
                                        className="text-xs font-medium text-slate-500 hover:text-indigo-600 py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5 border border-slate-200 hover:border-indigo-200 bg-slate-50/50 hover:bg-indigo-50/30 disabled:opacity-60 disabled:cursor-wait"
                                    >
                                        <ReturnIcon />
                                        {UI.redoSearch}
                                    </button>
                                </div>
                            )}

                            {!searchResult && !isSearching && (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-start gap-3 mb-4">
                                     <button
                                        onClick={() => onGoogleSearchForBases(pointIdentifier)}
                                        disabled={isSearching}
                                        className="text-xs font-medium text-white py-2 px-4 rounded-md transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait shadow-sm hover:shadow-md bg-indigo-600 hover:bg-indigo-500"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                                        {UI.searchWeb}
                                    </button>
                                </div>
                            )}

                            {isSearching && (
                                <div className="flex items-center justify-start mb-4">
                                    <button disabled className="text-sm font-medium text-white bg-indigo-400 py-2.5 px-5 rounded-lg flex items-center gap-2 cursor-wait">
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        {UI.searching}
                                    </button>
                                </div>
                            )}

                            {isSearching && (
                                <div className="p-8 bg-indigo-50/50 rounded-xl border border-dashed border-indigo-200 flex flex-col items-center justify-center text-indigo-600 gap-3 animate-pulse">
                                    <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-sm">
                                        <WebSearchIcon />
                                    </div>
                                    <span className="text-base font-medium">{language === 'pt-BR' ? 'Pesquisando na web e analisando fundamentos...' : 'Searching the web and analyzing grounds... (This may take a few seconds)'}</span>
                                </div>
                            )}

                            {searchResult && !isSearching && (
                                <WebSearchResults 
                                    searchResult={searchResult}
                                    pointIdentifier={pointIdentifier}
                                    selectedSearchForPoint={selectedSearchForPoint}
                                    dispatch={dispatch}
                                    language={language}
                                />
                            )}
                        </div>

                        <div className="mt-6 pt-5 border-t border-slate-200">
                            <h4 className="text-base font-bold text-slate-800 mb-3">{UI.addManual}</h4>
                            {openInputForPoint === pointIdentifier ? (
                                <AdditionalBasesInput
                                    onSave={(data) => dispatch({ type: 'SAVE_ADDITIONAL_BASES', payload: { point: pointIdentifier, data } })}
                                    onCancel={() => dispatch({ type: 'SET_OPEN_INPUT', payload: null })}
                                    initialData={currentAdditionalBases}
                                    language={language}
                                />
                            ) : (
                                <div 
                                    onClick={() => dispatch({ type: 'SET_OPEN_INPUT', payload: pointIdentifier })}
                                    className="p-4 bg-white border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition-colors group"
                                >
                                    {currentAdditionalBases ? (
                                        <div className="flex flex-col items-start gap-2">
                                            <div className="flex items-center gap-2 w-full">
                                                <div className="bg-green-100 text-green-700 p-1 rounded-full">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <p className="font-semibold text-green-700">{UI.savedBases}</p>
                                            </div>
                                            
                                            <p className="line-clamp-2 text-slate-600 text-sm ml-8">{currentAdditionalBases.text}</p>
                                            
                                            {currentAdditionalBases.files.length > 0 && (
                                                <div className="flex gap-2 mt-1 ml-8">
                                                    {currentAdditionalBases.files.map((f, i) => (
                                                        <span key={i} className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-500">{f.name}</span>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="text-xs text-blue-600 mt-2 ml-8 font-medium group-hover:underline">{language === 'pt-BR' ? 'Clique para editar' : 'Click to edit'}</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-slate-500 gap-2 py-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                            </svg>
                                            <span className="font-medium group-hover:text-blue-600 transition-colors">{UI.addFilesOrDesc}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={`fixed bottom-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 flex flex-col sm:flex-row gap-3 items-center justify-between transition-[left] duration-300 ${sidebarOpen ? 'left-0 md:left-72' : 'left-0'}`}>
                <div className="text-sm font-medium text-slate-500 order-2 sm:order-1 flex items-center gap-4">
                    <span>{UI.pointCounter(currentPage + 1, suggestionsArray.length)}</span>
                    {onRegenerate && (
                        <button
                            onClick={onRegenerate}
                            className="flex items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors"
                            title={language === 'pt-BR' ? 'Regerar sugestões' : 'Regenerate suggestions'}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            <span className="hidden sm:inline text-xs">{language === 'pt-BR' ? 'Regerar' : 'Regenerate'}</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
                    {index > 0 && (
                        <button
                            onClick={() => dispatch({ type: 'SET_PAGE', payload: currentPage - 1 })}
                            className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            {UI.previous}
                        </button>
                    )}

                    {isLastPage ? (
                        <button
                            onClick={handleConfirm}
                            disabled={!allPointsAddressed}
                            className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm disabled:shadow-none"
                        >
                            {UI.confirmBases}
                        </button>
                    ) : (
                        <button
                            onClick={() => dispatch({ type: 'SET_PAGE', payload: currentPage + 1 })}
                            className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors shadow-sm"
                        >
                            {UI.next}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


const WebSearchResults: React.FC<{
    searchResult: GoogleSearchResult;
    pointIdentifier: string;
    selectedSearchForPoint: Set<string>;
    dispatch: React.Dispatch<Action>;
    language: Language;
}> = ({ searchResult, pointIdentifier, selectedSearchForPoint, dispatch, language }) => {
    if (searchResult.error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 animate-fade-in">
                <p className="mb-3 font-medium">{searchResult.analysis}</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up">
            {searchResult.searchArguments && searchResult.searchArguments.length > 0 && (
                <div className="mb-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        {searchResult.searchArguments.map((arg, i) => (
                            <ArgumentCard 
                                key={`search-arg-${i}`}
                                title={arg.titulo}
                                content={arg.fundamentacao}
                                isSelected={selectedSearchForPoint.has(arg.titulo)}
                                onSelect={() => dispatch({ type: 'TOGGLE_SEARCH_ARGUMENT', payload: { point: pointIdentifier, title: arg.titulo } })}
                                language={language}
                                isSearchBased={true}
                            />
                        ))}
                    </div>
                </div>
            )}
            
            <WebSearchAnalysis 
                analysis={searchResult.analysis} 
                groundingSources={searchResult.sources} 
                language={language} 
            />
        </div>
    );
};
