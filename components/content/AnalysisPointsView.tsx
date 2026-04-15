
import React, { useState, useRef, useEffect } from 'react';
import { ChoiceThenInputStepData, Language, UserAction, WorkflowTriggers, SuggestionButton } from '../../types';
import { getUI } from '../../ui';
import { UniversalInput } from './UniversalInput';
import { MarkdownRenderer } from '../MarkdownRenderer';

interface AnalysisPointsViewProps {
    data: ChoiceThenInputStepData;
    representedParty: string | null;
    isLoading: boolean;
    language: Language;
    isDivergentFlow: boolean;
    hasSelected: boolean;
    onUserSubmit: (input: { text: string; files?: File[]; actionId?: string }) => Promise<void>;
    handleResetBasesChoice: () => void;
    isSpecialFlow: boolean;
}

export const AnalysisPointsView: React.FC<AnalysisPointsViewProps> = ({
    data,
    representedParty,
    isLoading,
    language,
    isDivergentFlow,
    hasSelected,
    onUserSubmit,
    handleResetBasesChoice,
    isSpecialFlow
}) => {
    const [manualInput, setManualInput] = useState('');
    const [showManualInput, setShowManualInput] = useState(false);
    
    const [dismissedIndices, setDismissedIndices] = useState<Set<number>>(new Set());

    const [points, setPoints] = useState<string[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isAddingPoint, setIsAddingPoint] = useState(false);
    const [newPointValue, setNewPointValue] = useState('');

    const [selectedParties, setSelectedParties] = useState<string[]>([]);

    const inputSectionRef = useRef<HTMLDivElement>(null);
    const isPT = language === 'pt-BR';

    useEffect(() => {
        if (!data.content) return;
        const content = data.content.replace(/\\n/g, '\n');
        
        let initialPoints = content.split(/\n\n+/).filter(p => p.trim().length > 0);
        
        if (initialPoints.length <= 1 && (content.includes('\n- ') || content.includes('\n* ') || content.includes('\n#'))) {
             initialPoints = content.split(/\n(?=[-|\*#] )/).filter(p => p.trim().length > 0);
        }
        
        setPoints(initialPoints);
    }, [data.content]);

    const toggleDismissPoint = (index: number) => {
        const newSet = new Set(dismissedIndices);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setDismissedIndices(newSet);
    };

    const showPartySelection = !!data.partyOptions && !representedParty;

    const handleSuggestionClick = (suggestion: string | SuggestionButton) => {
        if (typeof suggestion !== 'string') {
            setManualInput(suggestion.promptText);
            return;
        }

        const lower = suggestion.toLowerCase();
        if (lower.startsWith('fundamentos') || lower.startsWith('bases') || lower.startsWith('argumentos')) {
             setManualInput(`${WorkflowTriggers.BASES_PREFIX}${suggestion}`);
             return;
        }
        let preposition = 'de';
        if (lower.startsWith('petição') || lower.startsWith('contestação') || lower.startsWith('réplica') || lower.startsWith('sentença') || lower.startsWith('decisão') || lower.startsWith('apelação') || lower.startsWith('impugnação') || lower.startsWith('inicial')) { preposition = 'da'; } 
        else if (lower.startsWith('recurso') || lower.startsWith('agravo') || lower.startsWith('pedido') || lower.startsWith('requerimento') || lower.startsWith('laudo') || lower.startsWith('parecer') || lower.startsWith('voto') || lower.startsWith('despacho')) { preposition = 'do'; } 
        else if (lower.startsWith('contrarrazões') || lower.startsWith('alegações') || lower.startsWith('informações')) { preposition = 'das'; } 
        else if (lower.startsWith('embargos') || lower.startsWith('memoriais') || lower.startsWith('documentos') || lower.startsWith('autos')) { preposition = 'dos'; }
        setManualInput(`${WorkflowTriggers.BASES_PREFIX}fundamentos ${preposition} ${suggestion}`);
    };

    const handleMainOptionClick = (_option: string, index: number) => {
        if (index === 0) {
            setShowManualInput(true);
            const UI = getUI(language);
            setManualInput(UI.actions.provideBasesPrefix);
            setTimeout(() => {
                if (inputSectionRef.current) {
                    inputSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        } else {
            const activePoints = points.filter((_, idx) => !dismissedIndices.has(idx)).join('\n\n');
            
            const payloadText = activePoints.trim() ? activePoints : "Nenhum ponto ativo.";
            
            onUserSubmit({ text: payloadText, actionId: UserAction.GENERATE_SUGGESTIONS });
        }
    };

    const handleManualSubmit = (input: { text: string; files: File[] }) => {
        let finalText = input.text;
        
        const dismissedTextList = points.filter((_, idx) => dismissedIndices.has(idx));
        
        if (dismissedTextList.length > 0) {
            const ignoredPointsDesc = dismissedTextList.map(p => {
                return p.split('\n')[0].replace(/[*#]/g, '').trim();
            }).join('; ');
            
            finalText += `\n\n${WorkflowTriggers.DISPENSE_CMD}: Os seguintes pontos foram dispensados de análise pelo usuário: ${ignoredPointsDesc}`;
        }

        onUserSubmit({ ...input, text: finalText, actionId: UserAction.MANUAL_INPUT });
    };

    const handleBackFromManual = () => {
        setShowManualInput(false);
        setManualInput('');
    };

    const handlePartySelect = (partyName: string) => {
        onUserSubmit({ text: partyName, actionId: UserAction.SELECT_PARTY });
    };

    const togglePartySelection = (party: string) => {
        setSelectedParties(prev => 
            prev.includes(party) 
                ? prev.filter(p => p !== party)
                : [...prev, party]
        );
    };

    const confirmPartySelection = () => {
        if (selectedParties.length > 0) {
            handlePartySelect(selectedParties.join(', '));
        }
    };

    const shouldShowInput = showManualInput || (hasSelected && (data.input?.text?.startsWith('1.') || data.input?.actionId === UserAction.MANUAL_INPUT));
    
    const shouldShowOptions = !showPartySelection && !shouldShowInput && data.content && data.options && data.options.length > 0 && !data.isGeneratingSuggestions && !isSpecialFlow;

    const handleSaveEdit = (index: number) => {
        if (editValue.trim()) {
            const newPoints = [...points];
            newPoints[index] = editValue.trim();
            setPoints(newPoints);
        }
        setEditingIndex(null);
    };

    const handleSaveNewPoint = () => {
        if (newPointValue.trim()) {
            setPoints([...points, newPointValue.trim()]);
        }
        setIsAddingPoint(false);
        setNewPointValue('');
    };

    return (
        <div className="mt-6 pt-6 border-t border-slate-200 transition-all duration-300 ease-in-out">
            
            {!hasSelected && !isDivergentFlow && !isSpecialFlow && (
               <div className="mb-8 space-y-3">
                   {points.map((point, index) => {
                       const isDismissed = dismissedIndices.has(index);
                       const isEditing = editingIndex === index;

                       return (
                           <div 
                               key={index} 
                               className={`relative py-2.5 px-4 rounded-lg border transition-all duration-200 group ${
                                   isDismissed 
                                   ? 'bg-slate-50 border-slate-200 opacity-60' 
                                   : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
                               }`}
                           >
                               {isEditing ? (
                                   <div className="flex flex-col gap-3">
                                       <textarea
                                           value={editValue}
                                           onChange={(e) => setEditValue(e.target.value)}
                                           className="w-full bg-white border border-slate-300 rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-slate-500 min-h-24 text-base"
                                           autoFocus
                                       />
                                       <div className="flex justify-end gap-2">
                                           <button 
                                               onClick={() => setEditingIndex(null)}
                                               className="text-sm font-medium text-slate-600 hover:text-slate-800 py-1.5 px-3 rounded-md"
                                           >
                                               {isPT ? 'Cancelar' : 'Cancel'}
                                           </button>
                                           <button 
                                               onClick={() => handleSaveEdit(index)}
                                               className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 py-1.5 px-4 rounded-md"
                                           >
                                               {isPT ? 'Salvar' : 'Save'}
                                           </button>
                                       </div>
                                   </div>
                               ) : (
                                   <div className="flex justify-between items-start gap-4">
                                       <div className={`prose max-w-none text-slate-700 prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0 ${isDismissed ? 'line-through text-slate-400' : ''}`}>
                                           <MarkdownRenderer>{point}</MarkdownRenderer>
                                       </div>
                                       
                                       {!isDivergentFlow && (
                                           <div className="flex flex-col gap-2 shrink-0">
                                               <button
                                                   onClick={() => toggleDismissPoint(index)}
                                                   disabled={isLoading}
                                                   className={`p-1.5 rounded-full transition-colors border ${
                                                       isDismissed
                                                       ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                                                       : 'bg-white text-slate-400 border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                                                   }`}
                                                   title={isDismissed ? (isPT ? "Reativar Ponto" : "Reactivate Point") : (isPT ? "Dispensar Análise" : "Dismiss Analysis")}
                                               >
                                                   {isDismissed ? (
                                                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                           <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                                                       </svg>
                                                   ) : (
                                                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                           <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                       </svg>
                                                   )}
                                               </button>
                                               {!isDismissed && (
                                                   <button
                                                       onClick={() => {
                                                           setEditingIndex(index);
                                                           setEditValue(point);
                                                       }}
                                                       disabled={isLoading}
                                                       className="p-1.5 rounded-full transition-colors border bg-white text-slate-400 border-slate-200 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200"
                                                       title={isPT ? "Editar Ponto" : "Edit Point"}
                                                   >
                                                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                           <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                       </svg>
                                                   </button>
                                               )}
                                           </div>
                                       )}
                                   </div>
                               )}
                               {isDismissed && !isEditing && (
                                   <div className="mt-2 text-xs font-medium text-slate-500 italic flex items-center gap-1">
                                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                           <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
                                       </svg>
                                       {isPT ? "Ponto dispensado. Não será considerado na análise." : "Point dismissed. Will not be considered."}
                                   </div>
                               )}
                           </div>
                       );
                   })}

                   {!isDivergentFlow && (
                       <div className="mt-4">
                           {isAddingPoint ? (
                               <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg animate-fade-in space-y-3">
                                   <textarea
                                       value={newPointValue}
                                       onChange={(e) => setNewPointValue(e.target.value)}
                                       placeholder={isPT ? "Descreva o novo ponto controvertido..." : "Describe the new controverted point..."}
                                       className="w-full bg-white border border-slate-300 rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-slate-500 min-h-24 text-base"
                                       autoFocus
                                   />
                                   <div className="flex justify-end gap-2">
                                       <button 
                                           onClick={() => {
                                               setIsAddingPoint(false);
                                               setNewPointValue('');
                                           }}
                                           className="text-sm font-medium text-slate-600 hover:text-slate-800 py-1.5 px-3 rounded-md"
                                       >
                                           {isPT ? 'Cancelar' : 'Cancel'}
                                       </button>
                                       <button 
                                           onClick={handleSaveNewPoint}
                                           className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 py-1.5 px-4 rounded-md"
                                       >
                                           {isPT ? 'Adicionar' : 'Add'}
                                       </button>
                                   </div>
                               </div>
                           ) : (
                               <div 
                                   onClick={() => setIsAddingPoint(true)}
                                   className="py-3 px-4 bg-white border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition-colors group flex flex-col sm:flex-row items-center justify-center text-slate-500 gap-2"
                               >
                                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors">
                                       <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                   </svg>
                                   <span className="font-medium group-hover:text-blue-600 transition-colors">
                                       {isPT ? 'Adicionar Ponto Controvertido Manualmente' : 'Add Controverted Point Manually'}
                                   </span>
                               </div>
                           )}
                       </div>
                   )}
               </div>
            )}

            {showPartySelection && data.partyOptions && data.partyOptions.length > 0 && (
                <div className="animate-fade-in">
                    <h4 className="text-lg font-bold text-slate-800 mb-2">
                        {isPT ? 'Confirmação da Parte' : 'Party Confirmation'}
                    </h4>
                    <p className="text-sm text-slate-600 mb-4">
                        {isPT ? 'Para prosseguir, por favor, confirme: qual(is) parte(s) você representa no processo? (Selecione uma ou mais)' : 'To proceed, please confirm: which party(ies) do you represent? (Select one or more)'}
                    </p>
                    <div className="flex flex-col gap-3">
                        {data.partyOptions.map((party, i) => {
                            const isSelected = selectedParties.includes(party);
                            return (
                                <button 
                                    key={i} 
                                    onClick={() => togglePartySelection(party)}
                                    disabled={isLoading}
                                    className={`p-4 border rounded-lg text-left transition-all flex items-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed ${
                                        isSelected 
                                            ? 'bg-blue-50 border-blue-400 shadow-sm text-blue-800' 
                                            : 'bg-white border-slate-300 text-slate-700 hover:border-blue-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                        isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-400 bg-white'
                                    }`}>
                                        {isSelected && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="font-medium">{party}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={confirmPartySelection}
                            disabled={isLoading || selectedParties.length === 0}
                            className="bg-blue-600 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isPT ? 'Confirmar Parte(s)' : 'Confirm Party(ies)'}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {!showPartySelection && representedParty && data.partyOptions && data.partyOptions.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                {isPT ? 'Parte Representada' : 'Represented Party'}
                            </p>
                            <p className="text-sm font-medium text-slate-800">
                                {representedParty}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            setSelectedParties([]);
                            handlePartySelect('');
                        }}
                        disabled={isLoading}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 underline transition-colors disabled:opacity-50"
                    >
                        {isPT ? 'Alterar' : 'Change'}
                    </button>
                </div>
            )}

            {shouldShowOptions && (
                <div className="animate-fade-in mt-8 pt-6 border-t-2 border-slate-100">
                    <div className="mb-5">
                        <h4 className="text-xl font-bold text-slate-800 mb-1">
                            {isPT ? 'Estratégia Argumentativa' : 'Argumentative Strategy'}
                        </h4>
                        <p className="text-sm text-slate-500">
                            {isPT ? 'Agora, selecione como deseja definir os fundamentos:' : 'Now, select how you want to define the grounds:'}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        {data.options!.map((option, i) => {
                            const isPrimary = i === 0;
                            return (
                                <button 
                                    key={i} 
                                    onClick={() => handleMainOptionClick(option, i)}
                                    disabled={isLoading}
                                    className={`flex-1 p-6 rounded-xl border-2 text-center transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-4 group ${
                                        isPrimary 
                                            ? 'bg-white border-slate-200 text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:shadow-md' 
                                            : 'bg-white border-blue-200 text-blue-700 shadow-sm hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md'
                                    }`}
                                >
                                    {isPrimary ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-400 group-hover:text-slate-600 transition-colors">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-500 group-hover:text-blue-600 transition-colors">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                        </svg>
                                    )}
                                    <span className="font-semibold text-base">{option}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {isSpecialFlow && !showPartySelection && (
                <div className="mt-8 border-t border-slate-200 pt-6 animate-fade-in">
                    <button onClick={() => onUserSubmit({ text: WorkflowTriggers.SKIP_BASES, files: [], actionId: UserAction.SKIP_BASES })} disabled={isLoading} className="bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
                        {isPT ? 'Prosseguir para Template' : 'Proceed to Template'} &rarr;
                    </button>
                </div>
            )}

            {shouldShowInput && (
                <div ref={inputSectionRef} className="animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-bold text-slate-800">
                            {isPT ? 'Fornecer Argumentos' : 'Provide Arguments'}
                        </h4>
                        <button 
                            onClick={hasSelected ? handleResetBasesChoice : handleBackFromManual} 
                            disabled={isLoading}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2 group px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-1"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                            {isPT ? 'Voltar' : 'Back'}
                        </button>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-3">{data.subtitle || (isPT ? 'Descreva os argumentos e o resultado esperado (você também pode anexar arquivos):' : 'Describe arguments or attach files.')}</p>
                    
                    <div className="mb-6">
                        <UniversalInput 
                            onSubmit={handleManualSubmit}
                            isLoading={isLoading} 
                            isStepActive={true} 
                            value={manualInput} 
                            onChange={setManualInput} 
                            language={language}
                            showAttachmentHint={true}
                        />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{isPT ? 'Exemplos:' : 'Examples:'}</p>
                        <div className="flex flex-wrap gap-2">
                            {data.suggestionButtons?.map((suggestion, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => handleSuggestionClick(suggestion)} 
                                        disabled={isLoading}
                                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs font-medium hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {typeof suggestion === 'string' ? suggestion : suggestion.label}
                                    </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
