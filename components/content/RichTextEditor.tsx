
import React, { useCallback, useEffect, useMemo, useReducer, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Placeholder from '@tiptap/extension-placeholder';
import { FontSize, Indent } from './extensions';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import TurndownService from 'turndown';
import { BoldIcon, ItalicIcon, ULIcon, OLIcon, UndoIcon, RedoIcon, CopyIcon, CheckIcon } from '../Icons';
import { debounce } from '../../utils/timeUtils';
import { rewriteTextWithGemini, DEFAULT_MODEL } from '../../services/geminiService';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { copyToClipboard } from '../../utils/clipboardUtils';
import { useGeminiState } from '../../context/GeminiContext';
import { CustomSlider } from '../ui/CustomSlider';

interface RichTextEditorProps {
  initialMarkdown: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  isReadOnly?: boolean;
  minHeightClass?: string;
  variant?: 'default' | 'minimal';
  withIndentation?: boolean;
  isJustified?: boolean;
}



export const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
    initialMarkdown, 
    onChange, 
    isLoading = false,
    isReadOnly = false,
    minHeightClass = 'min-h-[600px]',
    variant = 'default',
    withIndentation = true,
    isJustified = false
}) => {
  const { model } = useGeminiState();
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);

  const [showRewriteMenu, setShowRewriteMenu] = useState(false);
  const [rewritePrompt, setRewritePrompt] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [lengthValue, setLengthValue] = useState(0);
  const [toneValue, setToneValue] = useState(0);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const isMinimal = variant === 'minimal';
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const turndownService = useMemo(() => {
      const service = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
      
      // Preserve styles for alignment and indentation
      service.addRule('preserveStyles', {
          filter: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'blockquote'],
          replacement: (content, node) => {
              const element = node as HTMLElement;
              const textAlign = element.style.textAlign;
              const textIndent = element.style.textIndent;
              const paddingLeft = element.style.paddingLeft;
              const paddingRight = element.style.paddingRight;
              const marginLeft = element.style.marginLeft;
              const marginRight = element.style.marginRight;
              
              if (textAlign || textIndent || paddingLeft || paddingRight || marginLeft || marginRight) {
                  let style = '';
                  if (textAlign) style += `text-align: ${textAlign}; `;
                  if (textIndent) style += `text-indent: ${textIndent}; `;
                  if (paddingLeft) style += `padding-left: ${paddingLeft}; `;
                  if (paddingRight) style += `padding-right: ${paddingRight}; `;
                  if (marginLeft) style += `margin-left: ${marginLeft}; `;
                  if (marginRight) style += `margin-right: ${marginRight}; `;
                  
                  const tag = element.tagName.toLowerCase();
                  // We use HTML tags in Markdown to preserve these styles
                  return `\n\n<${tag} style="${style.trim()}">${content}</${tag}>\n\n`;
              }
              
              // Default behavior for these tags if no special styles
              const tag = element.tagName.toLowerCase();
              if (tag.startsWith('h')) {
                  const level = parseInt(tag.charAt(1));
                  return `\n\n${'#'.repeat(level)} ${content}\n\n`;
              }
              if (tag === 'blockquote') {
                  return `\n\n> ${content}\n\n`;
              }
              return `\n\n${content}\n\n`;
          }
      });
      
      return service;
  }, []);

  const handleCopy = async () => {
    if (!editor || editor.isDestroyed) return;
    try {
        const html = editor.getHTML();
        const markdown = turndownService.turndown(html);
        
        await copyToClipboard(markdown, html, {
            withIndentation,
            isJustified
        });
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2500);
    } catch (err) {
        console.error("Copy error:", err);
        alert('Falha ao copiar o texto.');
    }
  };

  const debouncedOnChange = useCallback(
      debounce((html: string) => {
          try {
              const markdown = turndownService.turndown(html);
              onChange(markdown);
          } catch (error) {
              console.error("Markdown conversion error:", error);
          }
      }, 500), 
      [onChange, turndownService]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        code: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'blockquote'],
      }),
      Placeholder.configure({
        placeholder: 'Digite ou cole aqui o texto que deseja editar...',
        emptyEditorClass: 'is-editor-empty',
      }),
      TextStyle,
      FontFamily,
      FontSize,
      Indent,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: `w-full ${minHeightClass} ${isMinimal ? 'p-4 bg-white' : 'p-4 md:px-12 md:py-16 lg:px-24 lg:py-20 bg-white'} prose prose-lg prose-slate max-w-none focus:outline-none leading-relaxed outline-none text-black break-words prose-blockquote:not-italic ${withIndentation ? 'text-justify prose-p:indent-[1.5cm]' : ''} ${isJustified ? 'text-justify' : ''}`,
        spellcheck: 'true',
        lang: 'pt-BR',
      },
      handlePaste: (view, _event, slice) => {
        const { state, dispatch } = view;
        const { selection } = state;
        const { empty, $from } = selection;

        if (empty && $from.parent.textContent === '' && slice.content.firstChild?.isBlock) {
          const firstPastedNode = slice.content.firstChild;
          if (firstPastedNode.type === $from.parent.type) {
            const newAttrs = { ...$from.parent.attrs, ...firstPastedNode.attrs };
            const tr = state.tr.setNodeMarkup($from.before(), null, newAttrs);
            dispatch(tr);
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      debouncedOnChange(editor.getHTML());
      forceUpdate();
    },
    onTransaction: () => {
        forceUpdate();
    },
    onSelectionUpdate: () => {
        forceUpdate();
    }
  }, []);

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!editor || editor.isDestroyed || initialMarkdown === undefined) return;

    let timeoutId: NodeJS.Timeout;
    let retries = 0;
    const maxRetries = 20; // Max 1 second total retry time

    const setContentSafely = () => {
        if (editor.isDestroyed) return;
        
        let isViewReady = false;
        try {
            if (editor.view && editor.view.dom) {
                isViewReady = true;
            }
        } catch (e) {
            // View is not ready yet
        }

        // If view is not ready, retry
        if (!isViewReady) {
            if (retries < maxRetries) {
                retries++;
                timeoutId = setTimeout(setContentSafely, 50);
            }
            return;
        }

        const rawHtml = marked.parse(initialMarkdown, { gfm: true, breaks: true }) as string;
        const newHtml = DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['style'] });
        
        try {
          editor.commands.setContent(newHtml, { emitUpdate: false });
          if (!isLoading) {
              hasInitializedRef.current = true;
          }
        } catch (e) {
          console.error("Failed to set initial content:", e);
          // Retry if it failed due to view not being ready
          if (retries < maxRetries) {
              retries++;
              timeoutId = setTimeout(setContentSafely, 50);
          } else {
              // If we exhausted retries, mark as initialized anyway to prevent infinite loops
              // and allow the user to type
              if (!isLoading) {
                  hasInitializedRef.current = true;
              }
          }
        }
    };

    if (isLoading) {
        setContentSafely();
    } 
    else if (!hasInitializedRef.current) {
        setContentSafely();
    }

    return () => {
        if (timeoutId) clearTimeout(timeoutId);
    };
  }, [initialMarkdown, editor, isLoading]);

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      try {
        editor.setEditable(!isLoading && !isReadOnly);
      } catch (e) {
        console.error("Failed to set editable state:", e);
      }
    }
  }, [editor, isLoading, isReadOnly]);

  const ToolbarButton: React.FC<{ onClick: () => void; title: string; isActive?: boolean; disabled?: boolean; children: React.ReactNode; }> = ({ onClick, title, isActive, disabled, children }) => (
    <button
      type="button"
      onMouseDown={(e) => {
          e.preventDefault();
          onClick();
      }}
      title={title}
      disabled={disabled || isLoading || isReadOnly}
      className={`p-1.5 md:p-2 rounded transition-colors flex items-center justify-center ${
          disabled || isLoading || isReadOnly
            ? 'opacity-30 cursor-not-allowed' 
            : isActive 
                ? 'bg-blue-100 text-blue-700' 
                : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
      }`}
      aria-pressed={isActive}
    >
      {children}
    </button>
  );

  const ToolbarSelect: React.FC<{ value: string; onChange: (val: string) => void; options: {label: string, value: string}[]; title: string; disabled?: boolean; }> = ({ value, onChange, options, title, disabled }) => (
    <select
      title={title}
      disabled={disabled || isLoading || isReadOnly}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`text-sm border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-blue-500 ${
        disabled || isLoading || isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-400'
      }`}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );

  useEffect(() => {
    const handleSelectionUpdate = () => {
      if (!editor || editor.isDestroyed) return;
      try {
        if (editor.view && editor.view.dom && editor.state.selection.empty) {
          setShowRewriteMenu(false);
        }
      } catch (e) {
        // Ignore if view is not available
      }
    };
    editor?.on('selectionUpdate', handleSelectionUpdate);
    return () => {
      editor?.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor]);

  const handleRewrite = async (instruction: string) => {
    if (!editor || editor.isDestroyed) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');
    if (!text) {
        alert("Por favor, selecione um texto para reescrever.");
        return;
    }

    setIsRewriting(true);
    try {
      const rewritePromise = rewriteTextWithGemini(text, instruction, undefined, model || DEFAULT_MODEL);
      
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 30000)
      );

      const newText = await Promise.race([rewritePromise, timeoutPromise]);
      
      const rawHtml = marked.parse(newText, { gfm: true, breaks: true }) as string;
      const cleanHtml = DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['style'] });
      
      if (editor && !editor.isDestroyed) {
        try {
          editor.chain()
            .focus()
            .setTextSelection({ from, to })
            .insertContent(cleanHtml)
            .run();
            
          const newTo = editor.state.selection.to;
          editor.commands.setTextSelection({ from, to: newTo });
        } catch (e) {
          console.error("Failed to update editor content after rewrite:", e);
        }
      }
    } catch (error) {
      console.error("Rewrite error:", error);
      alert("Erro ao reescrever o texto. O serviço pode estar instável ou a seleção é muito grande. Tente novamente com um trecho menor.");
    } finally {
      setIsRewriting(false);
      setShowRewriteMenu(false);
      setRewritePrompt('');
      setLengthValue(0);
      setToneValue(0);
    }
  };

  const handleCombinedRewrite = () => {
    let instructions = [];
    
    if (lengthValue !== 0) {
      if (lengthValue === -2) instructions.push("ficar muito mais curto, resumindo apenas o essencial");
      if (lengthValue === -1) instructions.push("ficar um pouco mais conciso e direto");
      if (lengthValue === 1) instructions.push("ficar um pouco mais detalhado, expandindo as ideias");
      if (lengthValue === 2) instructions.push("ficar muito mais longo e explicativo, adicionando mais detalhes");
    }

    if (toneValue !== 0) {
      if (toneValue === -2) instructions.push("ter um tom mais simples e acessível a leigos");
      if (toneValue === -1) instructions.push("ter um tom mais claro e direto, não tão formal");
      if (toneValue === 1) instructions.push("ter um tom muito formal e polido");
      if (toneValue === 2) instructions.push("ter um tom extremamente técnico e formal");
    }

    if (rewritePrompt.trim()) {
      instructions.push(rewritePrompt.trim());
    }

    if (instructions.length === 0) return;

    const finalInstruction = `Reescreva este texto para: ${instructions.join('; e ')}.`;
    handleRewrite(finalInstruction);
  };
  
  if (!editor || editor.isDestroyed) {
    const containerClasses = isMinimal 
      ? "flex flex-col w-full bg-white min-w-0" 
      : "flex flex-col w-full relative shadow-sm min-w-0";
    const editorWrapperClasses = isMinimal || isMobile
      ? "w-full flex flex-col flex-1 min-w-0 overflow-x-hidden"
      : "w-full p-4 md:p-8 flex flex-col flex-1 bg-[#fefefe] border-x border-slate-200 min-w-0 overflow-x-auto";
    const editorContainerClasses = isMinimal || isMobile
      ? `w-full bg-white ${minHeightClass} min-w-0 mx-auto flex flex-col`
      : `w-[960px] max-w-full mx-auto flex flex-col min-h-[1357px] mb-8 min-w-0 bg-white shadow-sm border border-slate-200`;

    return (
      <div className={containerClasses}>
        <div className={editorWrapperClasses}>
          <div className={editorContainerClasses}>
            <div className={`w-full flex-1 ${isMinimal ? 'p-4' : 'p-4 md:px-12 md:py-16 lg:px-24 lg:py-20'} prose prose-lg prose-slate max-w-none leading-relaxed text-black break-words ${withIndentation ? 'text-justify prose-p:indent-[1.5cm]' : ''} ${isJustified ? 'text-justify' : ''}`}>
              <MarkdownRenderer withIndentation={withIndentation} isJustified={isJustified}>{initialMarkdown}</MarkdownRenderer>
              <span className="animate-pulse">▍</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const containerClasses = isMinimal 
    ? "flex flex-col w-full bg-white min-w-0" 
    : "flex flex-col w-full relative shadow-sm min-w-0";

  const stickyHeaderClasses = isMinimal
    ? "w-full bg-white border-b border-slate-200 flex flex-col shrink-0"
    : "w-full bg-blue-50 border-b border-slate-200 flex flex-col shrink-0 z-20 sticky top-0 shadow-sm";

  const toolbarClasses = isMinimal
    ? `w-full px-2 py-2 flex flex-wrap items-center justify-between gap-2 ${isLoading ? 'pointer-events-none opacity-50' : ''}`
    : `w-full px-4 py-2 flex flex-wrap items-center justify-between gap-2 min-h-[56px] ${isLoading ? 'pointer-events-none opacity-50' : ''}`;

  const editorWrapperClasses = isMinimal || isMobile
    ? "w-full flex flex-col flex-1 min-w-0 overflow-x-hidden"
    : "w-full p-4 md:p-8 flex flex-col flex-1 bg-[#fefefe] border-x border-slate-200 min-w-0 overflow-x-auto";

  const editorContainerClasses = isMinimal || isMobile
    ? `w-full bg-white ${minHeightClass} min-w-0 mx-auto flex flex-col`
    : `w-[960px] max-w-full mx-auto flex flex-col min-h-[1357px] mb-8 min-w-0 bg-white shadow-sm border border-slate-200`;

  let currentFontFamily = 'Inter';
  let currentFontSize = '16px';
  try {
    currentFontFamily = editor.getAttributes('textStyle').fontFamily || 'Inter';
    currentFontSize = editor.getAttributes('textStyle').fontSize || '16px';
  } catch (e) {
    // Ignore if attributes cannot be retrieved
  }

  const safeIsActive = (name: string | object, options?: any) => {
    try {
      if (typeof name === 'object') {
        return editor.isActive(name);
      }
      return editor.isActive(name, options);
    } catch (e) {
      return false;
    }
  };

  const safeCan = (action: 'undo' | 'redo') => {
    try {
      if (action === 'undo') return editor.can().undo();
      if (action === 'redo') return editor.can().redo();
      return false;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className={containerClasses}>
      <div className={stickyHeaderClasses}>
        <div className={toolbarClasses}>
        <div className="flex items-center gap-1 flex-wrap">
            <ToolbarButton 
                onClick={() => editor.chain().focus().undo().run()} 
                disabled={!safeCan('undo')}
                title="Desfazer"
            >
                <UndoIcon />
            </ToolbarButton>
            <ToolbarButton 
                onClick={() => editor.chain().focus().redo().run()} 
                disabled={!safeCan('redo')}
                title="Refazer"
            >
                <RedoIcon />
            </ToolbarButton>
            
            <div className="w-px h-5 bg-slate-300 mx-1"></div>

            <ToolbarSelect
              title="Fonte"
              value={currentFontFamily}
              onChange={(val) => editor.chain().focus().setFontFamily(val).run()}
              options={[
                { label: 'Inter', value: 'Inter' },
                { label: 'Arial', value: 'Arial' },
                { label: 'Times New Roman', value: 'Times New Roman' },
                { label: 'Courier New', value: 'Courier New' },
                { label: 'Georgia', value: 'Georgia' },
              ]}
            />

            <ToolbarSelect
              title="Tamanho da Fonte"
              value={currentFontSize}
              onChange={(val) => editor.chain().focus().setFontSize(val).run()}
              options={[
                { label: '10', value: '10px' },
                { label: '11', value: '11px' },
                { label: '12', value: '12px' },
                { label: '14', value: '14px' },
                { label: '16', value: '16px' },
                { label: '18', value: '18px' },
                { label: '20', value: '20px' },
                { label: '24', value: '24px' },
                { label: '30', value: '30px' },
              ]}
            />

            <div className="w-px h-5 bg-slate-300 mx-1"></div>

            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito" isActive={safeIsActive('bold')}><BoldIcon /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico" isActive={safeIsActive('italic')}><ItalicIcon /></ToolbarButton>
            
            <div className="w-px h-5 bg-slate-300 mx-1"></div>

            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Alinhar à Esquerda" isActive={safeIsActive({ textAlign: 'left' })}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/></svg>
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centralizar" isActive={safeIsActive({ textAlign: 'center' })}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="21" x2="3" y1="12" y2="12"/><line x1="21" x2="3" y1="18" y2="18"/></svg>
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Alinhar à Direita" isActive={safeIsActive({ textAlign: 'right' })}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="21" x2="9" y1="12" y2="12"/><line x1="21" x2="7" y1="18" y2="18"/></svg>
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justificar" isActive={safeIsActive({ textAlign: 'justify' })}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="21" x2="3" y1="12" y2="12"/><line x1="21" x2="3" y1="18" y2="18"/></svg>
            </ToolbarButton>

            <div className="w-px h-5 bg-slate-300 mx-1"></div>
            
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} title="Marcadores" isActive={safeIsActive('bulletList')}><ULIcon /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista Numerada" isActive={safeIsActive('orderedList')}><OLIcon /></ToolbarButton>

            <div className="w-px h-5 bg-slate-300 mx-1"></div>

            <ToolbarButton onClick={() => editor.chain().focus().outdent().run()} title="Diminuir Recuo">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/><polyline points="8 8 4 12 8 16"/></svg>
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().indent().run()} title="Aumentar Recuo">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/><polyline points="16 16 20 12 16 8"/></svg>
            </ToolbarButton>
        </div>
        
        {isLoading ? (
            <div className="flex items-center gap-2 text-blue-600 text-sm font-medium px-3">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Gerando texto...
            </div>
        ) : (
            <div className="flex items-center">
                <button
                    onClick={handleCopy}
                    className={`font-medium py-1.5 px-3 rounded-lg transition-colors flex items-center gap-2 text-sm border shadow-sm
                    ${copyStatus === 'copied' 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    title="Copiar texto do editor"
                >
                    {copyStatus === 'copied' ? <CheckIcon /> : <CopyIcon />}
                    <span className="hidden sm:inline">{copyStatus === 'copied' ? 'Copiado!' : 'Copiar'}</span>
                </button>
            </div>
        )}
        </div>

      </div>
      
      <div className={editorWrapperClasses}>
        <div className={editorContainerClasses}>
          {isLoading && (
            <div className={`w-full flex-1 ${isMinimal || isMobile ? 'p-4' : 'p-8 md:p-12'} prose prose-lg prose-slate max-w-none leading-relaxed text-black break-words ${withIndentation ? 'text-justify prose-p:indent-[1.5cm]' : ''} ${isJustified ? 'text-justify' : ''}`}>
              <MarkdownRenderer withIndentation={withIndentation} isJustified={isJustified}>{initialMarkdown}</MarkdownRenderer>
              <span className="animate-pulse">▍</span>
            </div>
          )}
          <div className={isLoading ? 'hidden' : 'w-full flex-1'}>
              <BubbleMenu editor={editor}>
          <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-3 flex flex-col gap-3 min-w-[320px] max-w-[360px]">
            {isRewriting ? (
              <div className="flex items-center justify-center p-4 text-sm text-slate-600 font-medium">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                O Gemini está reescrevendo...
              </div>
            ) : showRewriteMenu ? (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ajustar com I.A.</span>
                  <button onClick={() => setShowRewriteMenu(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-full hover:bg-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider px-1">
                    <span>Muito curto</span>
                    <span>Tamanho</span>
                    <span>Muito longo</span>
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
                    <span>Simples</span>
                    <span>Tom</span>
                    <span>Formal</span>
                  </div>
                  <CustomSlider 
                    min={-2} 
                    max={2} 
                    value={toneValue}
                    onChange={setToneValue}
                  />
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                  <label className="text-xs font-semibold text-slate-600">Peça ao Gemini</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={rewritePrompt}
                      onChange={(e) => setRewritePrompt(e.target.value)}
                      placeholder="Ex: Mude para a 3ª pessoa..."
                      className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (rewritePrompt.trim() || lengthValue !== 0 || toneValue !== 0)) {
                          handleCombinedRewrite();
                        }
                      }}
                    />
                    <button 
                      onClick={handleCombinedRewrite}
                      disabled={!rewritePrompt.trim() && lengthValue === 0 && toneValue === 0}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito" isActive={safeIsActive('bold')}><BoldIcon /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico" isActive={safeIsActive('italic')}><ItalicIcon /></ToolbarButton>
                <div className="w-px h-5 bg-slate-300 mx-1"></div>
                <button 
                  onClick={() => setShowRewriteMenu(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-blue-700 hover:bg-blue-50 rounded-md font-medium transition-colors border border-transparent hover:border-blue-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z" clipRule="evenodd" />
                  </svg>
                  Ajustar com I.A.
                </button>
              </div>
            )}
          </div>
        </BubbleMenu>
        <EditorContent editor={editor} className="w-full min-w-0 max-w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};