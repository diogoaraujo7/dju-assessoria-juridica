
import React, { useState, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { DocumentStepData, Step, Language } from '../../types';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { CopyIcon, CheckIcon, RegenerateIcon } from '../Icons';
import { LoadingCursor } from '../Loaders';
import { copyToClipboard } from '../../utils/clipboardUtils';
import { extractCleanEmenta } from '../../utils/textUtils';
import { TemplateInputForm } from './TemplateInputForm';
import { FinalDocumentActions } from './FinalDocumentActions';
import { getUI } from '../../ui';

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

interface FinalDocumentActionsProps {
    contentToCopy: string;
    showGenerateEmenta?: boolean;
    isGeneratingEmenta?: boolean;
}

interface DocumentContentProps {
  data: DocumentStepData;
  isLoading: boolean;
  viewingStep?: Step;
  isStepActive?: boolean;
  onUserSubmit?: (input: { text: string; files?: File[] }) => void;
  isEditable?: boolean;
  isReadOnly?: boolean;
  onContentChange?: (newContent: string) => void;
  onRetry?: () => void;
  language: Language;
  onApplyRevisorSolutions?: (selectedIds?: string[]) => void;
  onNewAnalysis?: () => void;
  forceIndentation?: boolean;
  finalActionsProps?: FinalDocumentActionsProps;
  onRegenerateEmenta?: () => void;
  editorKey?: string;
}

export const DocumentContent: React.FC<DocumentContentProps> = ({ 
    data, isLoading, viewingStep, isStepActive, onUserSubmit, isEditable, isReadOnly,
    onContentChange, onRetry, language,
    onApplyRevisorSolutions, onNewAnalysis, forceIndentation, finalActionsProps,
    onRegenerateEmenta, editorKey
}) => {
  
  const [ementaCopyStatus, setEmentaCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [revisorCopyStatus, setRevisorCopyStatus] = useState<'idle' | 'copied'>('idle');
  
  const { contentToDisplay, revisorSuggestions } = useMemo(() => {
    let content = data.content ?? '';
    let suggestions = null;

    if (viewingStep === Step.REVISOR_ANALISE) {
        const jsonMatches = [...content.matchAll(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/g)];
        if (jsonMatches.length > 0) {
            const lastMatch = jsonMatches[jsonMatches.length - 1];
            try {
                suggestions = JSON.parse(lastMatch[1]).map((s: any) => ({ ...s, id: String(s.id) }));
                content = content.replace(lastMatch[0], '').trim();
            } catch (e) {
                console.error("Failed to parse revisor suggestions JSON", e);
            }
        } else {
            const endMatch = content.match(/(\[[\s\S]*?\])\s*$/);
            if (endMatch) {
                try {
                    suggestions = JSON.parse(endMatch[1]).map((s: any) => ({ ...s, id: String(s.id) }));
                    content = content.replace(endMatch[0], '').trim();
                } catch (e) {
                }
            }
        }
    }
    
    content = content.replace(/\\n/g, '\n');
    
    content = content.replace(/^(\d+)\.\s+/gm, '$1\\. ');

    if (viewingStep === Step.EMENTA_RESULTADO) {
      content = content.replace(/(?<!\n)\n(?!\n)/g, '  \n');
    }
    return { contentToDisplay: content, revisorSuggestions: suggestions };
  }, [data.content, viewingStep]);

  const ementaContentToDisplay = useMemo(() => {
    if (!data.ementaContent) return '';
    const clean = extractCleanEmenta(data.ementaContent);
    
    const noLists = clean.replace(/^(\d+)\.\s+/gm, '$1\\. ');

    return noLists.replace(/(?<!\n)\n(?!\n)/g, '  \n');
  }, [data.ementaContent]);

  const handleEmentaCopy = async () => {
    if (!data.ementaContent) return;
    const cleanEmenta = extractCleanEmenta(data.ementaContent);
    const textToCopy = cleanEmenta.replace(/^(\d+)\.\s+/gm, '$1. ');
    
    try {
        await copyToClipboard(textToCopy, undefined, {
            withIndentation: false,
            isJustified: true
        });
        setEmentaCopyStatus('copied');
        setTimeout(() => setEmentaCopyStatus('idle'), 2500);
    } catch (err) {
        alert('Falha ao copiar o texto.');
    }
  };

  const handleRevisorReportCopy = async () => {
      if (!contentToDisplay) return;
      try {
          await copyToClipboard(contentToDisplay, undefined, {
              withIndentation: false,
              isJustified: false
          });
          setRevisorCopyStatus('copied');
          setTimeout(() => setRevisorCopyStatus('idle'), 2500);
      } catch (err) {
          alert('Falha ao copiar o texto.');
      }
  };

  const isTemplateStepInputRequired = (viewingStep === Step.ATO_TEMPLATE || viewingStep === Step.PETICAO_TEMPLATE) && isStepActive && !data.input;
  const isEmentaError = data.ementaContent?.includes("O modelo de IA está sobrecarregado");
  const UI = getUI(language);

  const isDocumentPage = 
    viewingStep === Step.ELABORAR_ATO || 
    viewingStep === Step.ELABORAR_PETICAO ||
    viewingStep === Step.TEMPLATE_RESULTADO || 
    viewingStep === Step.EMENTA_RESULTADO ||
    viewingStep === Step.REVISOR_RESULTADO_FINAL ||
    viewingStep === Step.EDITOR_EDITAR_TEXTO ||
    forceIndentation;
    
  const isRevisorReport = viewingStep === Step.REVISOR_ANALISE;

  const getContainerClass = () => {
      if (isDocumentPage) {
          return "bg-white text-black p-4 md:p-8 lg:p-12 shadow-md border border-gray-200 rounded-sm min-h-[600px] mx-auto max-w-5xl break-words min-w-0";
      }
      if (isRevisorReport) {
          return "bg-white text-slate-900 p-4 md:p-6 lg:p-8 shadow-sm border border-slate-200 rounded-xl w-full max-w-none prose prose-slate prose-lg prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg max-w-none prose-table:w-full prose-th:bg-slate-50 prose-th:p-3 prose-td:p-3 prose-img:rounded-lg min-h-[400px] break-words min-w-0";
      }
      return "prose prose-lg prose-slate max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-a:text-blue-600 hover:prose-a:underline break-words min-w-0";
  };

  if (isTemplateStepInputRequired) {
    return <TemplateInputForm content={data.content} isLoading={isLoading} onUserSubmit={onUserSubmit!} tip={UI.templateStepTip} />;
  }

  return (
    <div className={`flex flex-col gap-6 ${isEditable ? 'w-full' : 'max-w-5xl mx-auto w-full p-4 lg:p-8'} min-w-0`}>
        {data.input && (
            <div className={`bg-slate-100 p-4 rounded-xl border border-slate-200 shrink-0 ${isEditable ? 'max-w-5xl mx-auto w-full mb-4' : ''}`}>
                <p className="text-sm font-medium text-slate-600 mb-2">Sua resposta:</p>
                <p className="text-slate-800 whitespace-pre-wrap">{data.input.text}</p>
                 {data.input.files && data.input.files.length > 0 && (
                    <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Arquivos Anexados</p>
                    <ul className="flex flex-wrap gap-2">
                        {data.input.files.map((fileName, i) => (
                        <li key={i} className="bg-slate-200 text-xs rounded-full py-1 px-3 flex items-center gap-2">
                            <span>{fileName}</span>
                        </li>
                        ))}
                    </ul>
                    </div>
                )}
            </div>
        )}

        {isEditable ? (
             <div className="w-full flex flex-col min-w-0">
                <EditorErrorBoundary>
                    <RichTextEditor
                        key={editorKey ?? viewingStep}
                        initialMarkdown={data.content ?? ''}
                        onChange={onContentChange!}
                        isLoading={isLoading}
                        isReadOnly={isReadOnly}
                        withIndentation={isDocumentPage && viewingStep !== Step.EMENTA_RESULTADO && viewingStep !== Step.EDITOR_EDITAR_TEXTO}
                        isJustified={viewingStep === Step.EMENTA_RESULTADO}
                    />
                </EditorErrorBoundary>
             </div>
        ) : (
            <>
                {isRevisorReport && !isLoading && data.content && (
                    <div className="flex justify-end mb-1">
                        <button
                            onClick={handleRevisorReportCopy}
                            className={`font-medium py-1.5 px-3 rounded-lg transition-colors flex items-center gap-2 text-sm border shadow-sm
                            ${revisorCopyStatus === 'copied' 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            {revisorCopyStatus === 'copied' ? <CheckIcon /> : <CopyIcon />}
                            {revisorCopyStatus === 'copied' ? (language === 'pt-BR' ? 'Copiado!' : 'Copied!') : (language === 'pt-BR' ? 'Copiar Relatório' : 'Copy Report')}
                        </button>
                    </div>
                )}

                <div className={getContainerClass()}>
                    {isDocumentPage ? (
                        <div className="prose prose-lg max-w-none text-black prose-p:text-black prose-headings:text-black break-words min-w-0 w-full">
                            <MarkdownRenderer
                            withIndentation={viewingStep !== Step.EMENTA_RESULTADO && viewingStep !== Step.EDITOR_EDITAR_TEXTO}
                            isJustified={viewingStep === Step.EMENTA_RESULTADO}
                            components={{
                                    a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline" />,
                                }}
                            >
                                {contentToDisplay}
                            </MarkdownRenderer>
                        </div>
                    ) : (
                        <MarkdownRenderer withIndentation={false}>{contentToDisplay}</MarkdownRenderer>
                    )}
                    {isLoading && data.content && <LoadingCursor />}
                    
                    {isRevisorReport && isLoading && (
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center gap-3 animate-pulse text-blue-800">
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="font-medium text-sm">O Dju está analisando o documento e compilando o relatório...</span>
                        </div>
                    )}
                </div>
            </>
        )}
        
        {finalActionsProps && (
            <div className={isEditable ? "max-w-5xl mx-auto w-full px-4" : ""}>
                <FinalDocumentActions {...finalActionsProps} />
            </div>
        )}
        
        {(data.isGeneratingEmenta || data.ementaContent) && (
             <div className={`pt-6 border-t-2 border-dashed border-slate-300 animate-fade-in w-full ${isEditable ? 'max-w-5xl mx-auto' : ''}`}>
                <div className="bg-slate-100 p-4 sm:p-6 rounded-xl border border-slate-200 relative">
                     <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                        <h3 className="text-xl font-bold text-slate-800">Ementa Gerada</h3>
                        <div className="flex items-center gap-2">
                            {data.ementaContent && !isEmentaError && onRegenerateEmenta && (
                                <button
                                    onClick={onRegenerateEmenta}
                                    disabled={data.isGeneratingEmenta}
                                    className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 font-medium py-2 px-3 rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                                    title="Reescrever apenas a Ementa"
                                >
                                    <RegenerateIcon />
                                    <span className="hidden sm:inline">Reescrever Ementa</span>
                                </button>
                            )}
                            
                            {data.ementaContent && !isEmentaError && (
                                <button
                                    onClick={handleEmentaCopy}
                                    className={`font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm shadow-sm
                                    ${ementaCopyStatus === 'copied' 
                                        ? 'bg-green-600 text-white' 
                                        : 'bg-blue-600 text-white hover:bg-blue-500'
                                    }`}
                                >
                                    {ementaCopyStatus === 'copied' ? <CheckIcon /> : <CopyIcon />}
                                    {ementaCopyStatus === 'copied' ? 'Copiado!' : 'Copiar Ementa'}
                                </button>
                            )}
                        </div>
                    </div>
                    {data.isGeneratingEmenta && !data.ementaContent && (
                        <div className="flex items-center gap-3 text-slate-600">
                             <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Analisando o ato e gerando a ementa...</span>
                        </div>
                    )}
                    {isEmentaError && onRetry ? (
                         <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 animate-fade-in text-sm">
                            <p className="mb-4 font-medium">{data.ementaContent}</p>
                            <button
                                onClick={onRetry}
                                className="bg-red-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-red-500 transition-colors flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001a7.5 7.5 0 0 1-1.08 3.916m-6.9-3.916a7.5 7.5 0 0 1 7.98 3.916m-7.98 3.916A7.5 7.5 0 0 1 3 13.5a7.5 7.5 0 0 1 1.97-5.023l-1.07-1.071A9.954 9.954 0 0 0 1.5 13.5a9.954 9.954 0 0 0 3.257 7.027l.908-1.028A7.5 7.5 0 0 1 3 13.5" />
                                </svg>
                                Tentar Novamente
                            </button>
                        </div>
                    ) : (
                        <div className="text-black leading-relaxed">
                            <MarkdownRenderer
                                withIndentation
                                components={{
                                    a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline" />,
                                    p: ({node, ...props}) => <p {...props} className="text-justify mb-4 leading-relaxed" />
                                }}
                            >
                                {ementaContentToDisplay}
                            </MarkdownRenderer>
                            {data.isGeneratingEmenta && data.ementaContent && <LoadingCursor />}
                        </div>
                    )}
                    
                    {data.ementaContent && !isEmentaError && (
                        <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end gap-2">
                             {onRegenerateEmenta && (
                                <button
                                    onClick={onRegenerateEmenta}
                                    disabled={data.isGeneratingEmenta}
                                    className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 font-medium py-2 px-3 rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                                    title="Reescrever apenas a Ementa"
                                >
                                    <RegenerateIcon />
                                    <span className="hidden sm:inline">Reescrever</span>
                                </button>
                            )}
                             <button
                                onClick={handleEmentaCopy}
                                className={`font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm
                                ${ementaCopyStatus === 'copied' 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-blue-600 text-white hover:bg-blue-500'
                                }`}
                            >
                                {ementaCopyStatus === 'copied' ? <CheckIcon /> : <CopyIcon />}
                                {ementaCopyStatus === 'copied' ? 'Copiado!' : 'Copiar Ementa'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {data.suggestionButtons && onUserSubmit && isStepActive && !isLoading && (
            <div className="pt-4 border-t border-slate-200">
                 <p className="text-sm font-medium text-slate-700 mb-3">Sugestões de resposta:</p>
                 <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                    {data.suggestionButtons.map((suggestion, i) => (
                         <button
                            key={i}
                            onClick={() => onUserSubmit({ text: typeof suggestion === 'string' ? suggestion : suggestion.promptText })}
                            className="p-3 border rounded-lg text-left transition-colors bg-white hover:bg-blue-50 border-slate-300 text-slate-700 text-sm"
                        >
                           {typeof suggestion === 'string' ? suggestion : suggestion.label}
                        </button>
                    ))}
                 </div>
            </div>
        )}

        {isRevisorReport && !isLoading && data.content && (
            <FinalDocumentActions
                contentToCopy={contentToDisplay}
                isRevisorReport={true}
                revisorSuggestions={revisorSuggestions}
                onApplyRevisorSolutions={onApplyRevisorSolutions}
                onNewAnalysis={onNewAnalysis}
                copyOptions={{
                    withIndentation: false,
                    isJustified: false
                }}
            />
        )}
    </div>
  );
};
