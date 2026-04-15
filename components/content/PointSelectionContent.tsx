
import React, { useState, useEffect } from 'react';
import { PointSelectionStepData, Language } from '../../types';
import { getUI } from '../../ui';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { LoadingDots } from '../Loaders';

interface PointSelectionContentProps {
  data: PointSelectionStepData;
  isLoading: boolean;
  onUserSubmit: (input: { text: string; files?: File[] }) => void;
  language: Language;
}

export const PointSelectionContent: React.FC<PointSelectionContentProps> = ({ data, isLoading, onUserSubmit, language }) => {
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isSummaryVisible, setIsSummaryVisible] = useState(true);
    
    const [points, setPoints] = useState<string[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isAddingPoint, setIsAddingPoint] = useState(false);
    const [newPointValue, setNewPointValue] = useState('');
    
    const UI = getUI(language).actions;
    
    useEffect(() => {
        if (!data.content) {
            setPoints([]);
            return;
        }
        
        const content = data.content.replace(/\\n/g, '\n');
        
        const lines = content.split('\n');
        const extractedPoints: string[] = [];
        let currentPoint = '';

        for (const line of lines) {
            const trimmed = line.trim();
            const listMatch = trimmed.match(/^(-\s|\*\s|\d+\.\s|#{1,6}\s)(.*)/);
            if (listMatch) {
                if (currentPoint) {
                    extractedPoints.push(currentPoint.trim());
                }
                const marker = listMatch[1];
                const isHeader = marker.startsWith('#');
                currentPoint = isHeader ? trimmed : listMatch[2].trim();
            } else if (currentPoint && trimmed !== '') {
                currentPoint += '\n' + trimmed;
            }
        }
        
        if (currentPoint) {
            extractedPoints.push(currentPoint.trim());
        }

        if (extractedPoints.length === 0) {
            setPoints(content.split(/\n\n+/).filter(p => p.trim().length > 0).map(p => p.trim()));
        } else {
            setPoints(extractedPoints);
        }
    }, [data.content]);

    const handleToggle = (index: number) => {
        const newSelection = new Set(selectedIndices);
        if (newSelection.has(index)) {
            newSelection.delete(index);
        } else {
            newSelection.add(index);
        }
        setSelectedIndices(newSelection);
    };

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
            const newSelection = new Set(selectedIndices);
            newSelection.add(points.length);
            setSelectedIndices(newSelection);
        }
        setIsAddingPoint(false);
        setNewPointValue('');
    };

    const handleSubmit = () => {
        const selectedPointsText = points
            .filter((_, index) => selectedIndices.has(index))
            .map(p => `- ${p}`)
            .join('\n');
        onUserSubmit({ text: selectedPointsText });
    };

    if (isLoading && !data.summaryContent) {
        return <LoadingDots />;
    }

    return (
        <div className="animate-fade-in">
            {data.summaryContent && (
                <div className="mb-8 border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden transition-all">
                    <button
                        onClick={() => setIsSummaryVisible(!isSummaryVisible)}
                        className="w-full flex justify-between items-center p-4 text-left font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        aria-expanded={isSummaryVisible}
                        aria-controls="synthesis-content"
                    >
                        <div className="flex items-center gap-3">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                            </svg>
                            <span>{language === 'pt-BR' ? 'Síntese do Voto do Relator' : 'Rapporteur Vote Summary'}</span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 text-slate-500 transition-transform ${isSummaryVisible ? 'rotate-180' : ''}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                    {isSummaryVisible && (
                        <div id="synthesis-content" className="p-4 border-t border-slate-200 animate-fade-in">
                             <div className="prose prose-lg prose-slate max-w-none prose-p:my-2 prose-p:text-justify">
                                <MarkdownRenderer>{data.summaryContent}</MarkdownRenderer>
                                {isLoading && !data.content && <span className="animate-pulse">▍</span>}
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {isLoading && !data.content && data.summaryContent &&
              <div className="flex items-center gap-3 text-slate-600 animate-fade-in p-4 bg-slate-100 rounded-lg border border-slate-200">
                  <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-medium">{language === 'pt-BR' ? 'Identificando os pontos controvertidos...' : 'Identifying controversial points...'}</span>
              </div>
            }

            {data.content && (
                <div className="animate-fade-in-up">
                    <h3 className="text-xl font-bold text-slate-800">{language === 'pt-BR' ? 'Pontos para Divergência' : 'Points for Divergence'}</h3>
                    <p className="text-base text-slate-600 mt-1 mb-4">{language === 'pt-BR' ? 'Abaixo estão os pontos identificados. Selecione aqueles dos quais você deseja divergir.' : 'Below are the identified points. Select those you wish to diverge from.'}</p>
                    <div className="space-y-3 p-2">
                        {points.map((point, index) => {
                            const isEditing = editingIndex === index;
                            
                            return (
                                <div key={index} className="relative p-4 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200 bg-white group">
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
                                                    {language === 'pt-BR' ? 'Cancelar' : 'Cancel'}
                                                </button>
                                                <button 
                                                    onClick={() => handleSaveEdit(index)}
                                                    className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 py-1.5 px-4 rounded-md"
                                                >
                                                    {language === 'pt-BR' ? 'Salvar' : 'Save'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start justify-between gap-4">
                                            <label className="flex items-start gap-4 flex-1 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIndices.has(index)}
                                                    onChange={() => handleToggle(index)}
                                                    className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                                                    disabled={isLoading}
                                                    aria-label={`Selecionar ponto ${index + 1}`}
                                                />
                                                <div className="prose prose-base max-w-none prose-p:my-0 prose-headings:my-1 text-slate-800">
                                                    <MarkdownRenderer>{point}</MarkdownRenderer>
                                                </div>
                                            </label>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setEditingIndex(index);
                                                    setEditValue(point);
                                                }}
                                                disabled={isLoading}
                                                className="p-1.5 rounded-full transition-colors border bg-white text-slate-400 border-slate-200 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200 shrink-0"
                                                title={language === 'pt-BR' ? "Editar Ponto" : "Edit Point"}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="mt-4">
                        {isAddingPoint ? (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg animate-fade-in space-y-3">
                                <textarea
                                    value={newPointValue}
                                    onChange={(e) => setNewPointValue(e.target.value)}
                                    placeholder={language === 'pt-BR' ? "Descreva o novo ponto controvertido..." : "Describe the new controverted point..."}
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
                                        {language === 'pt-BR' ? 'Cancelar' : 'Cancel'}
                                    </button>
                                    <button 
                                        onClick={handleSaveNewPoint}
                                        className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 py-1.5 px-4 rounded-md"
                                    >
                                        {language === 'pt-BR' ? 'Adicionar' : 'Add'}
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
                                    {language === 'pt-BR' ? 'Adicionar Ponto Controvertido Manualmente' : 'Add Controverted Point Manually'}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="mt-8 border-t border-slate-200 pt-6">
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || selectedIndices.size === 0}
                            className="bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {language === 'pt-BR' ? 'Processando...' : 'Processing...'}
                                </>
                            ) : UI.confirmSelection}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
