
import React, { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { MultipleChoiceStepData, Language, UserAction } from '../../types';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { EditIcon, CheckIcon } from '../Icons';
import { RichTextEditor } from './RichTextEditor';

class EditorErrorBoundary extends Component<{ children: ReactNode, fallback?: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode, fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("RichTextEditor Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-lg">Ocorreu um erro ao carregar o editor. Tente recarregar a página.</div>;
    }

    return this.props.children;
  }
}

interface SelectionStepContentProps {
  data: MultipleChoiceStepData;
  onSelect: (option: string, actionId?: string) => void;
  language: Language;
  onContentChange?: (content: string) => void; 
}

export const SelectionStepContent: React.FC<SelectionStepContentProps> = ({ data, onSelect, language, onContentChange }) => {
  const hasSelected = !!data.input;
  const options = data.options || [];
  
  const isPredictionResult = data.title.includes("Confirmação") || data.title.includes("Confirmation");

  const { coreResult, cleanContent } = useMemo(() => {
      const raw = (data.content || '').replace(/\\n/g, '\n');
      const match = raw.match(/\*\*(.*?)\*\*/);
      const result = match ? match[1].toUpperCase() : '';
      
      const clean = raw.replace(/\*\*/g, '');
      
      return { coreResult: result, cleanContent: clean };
  }, [data.content]);

  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(cleanContent);

  useEffect(() => {
      setEditableContent(cleanContent);
  }, [cleanContent]);

  const handleSaveEdit = () => {
      if (onContentChange) {
          onContentChange(editableContent);
      }
      setIsEditing(false);
  };

  return (
    <div className="animate-fade-in">
      {data.content && (
        <div className={`
            mb-8 rounded-xl border overflow-hidden transition-all duration-300 relative
            ${isPredictionResult 
                ? 'bg-white border-blue-200 shadow-md ring-1 ring-blue-50' 
                : 'bg-slate-100 border-slate-200'
            }
        `}>
            {isPredictionResult && (
                <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex items-center justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="font-bold text-blue-800 text-sm uppercase tracking-wide">
                            {language === 'pt-BR' ? 'Resultado previsto pelo assistente:' : 'Assistant Predicted Outcome:'}
                        </span>
                        {coreResult && (
                            <span className="font-black text-blue-900 text-sm uppercase tracking-wide bg-blue-100 px-2 py-0.5 rounded border border-blue-200 shadow-sm">
                                {coreResult}
                            </span>
                        )}
                    </div>
                    {onContentChange && !hasSelected && (
                        <button 
                            onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
                            className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-100 transition-colors flex-shrink-0"
                            title={language === 'pt-BR' ? (isEditing ? 'Salvar Edição' : 'Editar Texto') : (isEditing ? 'Save Edit' : 'Edit Text')}
                        >
                            {isEditing ? <CheckIcon /> : <EditIcon />}
                        </button>
                    )}
                </div>
            )}
            
            <div className="p-6">
                {isEditing ? (
                    <div className="animate-fade-in">
                        {isPredictionResult ? (
                            <textarea
                                value={editableContent}
                                onChange={(e) => setEditableContent(e.target.value)}
                                className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800 text-lg leading-relaxed resize-y min-h-[200px] bg-white shadow-inner font-sans"
                                spellCheck={false}
                            />
                        ) : (
                            <div className="bg-white rounded-lg border-2 border-blue-300 overflow-hidden shadow-inner">
                                <EditorErrorBoundary>
                                    <RichTextEditor 
                                        initialMarkdown={editableContent}
                                        onChange={setEditableContent}
                                        variant="minimal"
                                        minHeightClass="min-h-[150px]"
                                    />
                                </EditorErrorBoundary>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={`prose prose-slate max-w-none prose-p:my-2 prose-ul:my-2 prose-a:text-blue-600 hover:prose-a:underline ${isPredictionResult ? 'text-slate-800 prose-p:text-xl prose-li:text-xl leading-relaxed' : ''}`}>
                        <MarkdownRenderer 
                            components={{
                                a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline" />,
                                h2: ({node, ...props}) => <h2 {...props} className="text-lg font-bold text-slate-800 mt-0 mb-3" />,
                                strong: ({node, ...props}) => isPredictionResult ? <span {...props} className="font-semibold text-blue-900" /> : <strong {...props} />,
                            }}
                        >
                            {editableContent}
                        </MarkdownRenderer>
                    </div>
                )}
            </div>
        </div>
      )}
      
      {'systemHint' in data && data.systemHint && (
        <div className="my-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm flex items-center gap-3 animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <span>{data.systemHint}</span>
        </div>
      )}
      
      {options.length > 0 && (
         <div role="radiogroup" aria-label={data.title}>
            <p className="text-sm font-medium text-slate-700 mb-3">Selecione uma opção:</p>
            
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                {options.map((option, index) => {
                    const isSelected = data.input?.text === option;
                    
                    let actionId: string | undefined;
                    if (isPredictionResult) {
                        if (index === 0) actionId = UserAction.CONFIRM;
                        else if (index === 1) actionId = UserAction.REJECT;
                    }
                    
                    const isConfirmBtn = actionId === UserAction.CONFIRM;
                    
                    return (
                        <button
                          key={index}
                          onClick={() => onSelect(option, actionId)}
                          disabled={hasSelected || isEditing}
                          className={`
                            p-4 border rounded-lg text-left transition-all duration-200
                            ${isSelected 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                              : (isConfirmBtn && isPredictionResult
                                    ? 'bg-blue-600 text-white hover:bg-blue-500 border-blue-600 shadow-sm font-bold'
                                    : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                                )
                            }
                            ${(hasSelected && !isSelected) || isEditing ? 'opacity-50 cursor-not-allowed' : ''}
                            ${!isSelected && !isEditing ? 'hover:shadow-md hover:-translate-y-0.5' : ''}
                          `}
                          role="radio"
                          aria-checked={isSelected}
                          aria-disabled={hasSelected && !isSelected}
                        >
                          <span className={isConfirmBtn && isPredictionResult ? "font-bold" : "font-medium"}>{option}</span>
                        </button>
                    );
                })}
            </div>
         </div>
      )}
    </div>
  );
};
