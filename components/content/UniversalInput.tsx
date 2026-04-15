
import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../../types';
import { getUI } from '../../ui';
import { FileIcon } from '../Icons';
import { FileAttachmentHint } from '../FileAttachmentHint';

interface UniversalInputProps {
  onSubmit: (input: { text: string; files: File[]; actionId?: string }) => void;
  isLoading: boolean;
  isStepActive: boolean;
  showProceedButton?: boolean;
  proceedLabel?: string;
  hideSendButton?: boolean;
  language?: Language;
  value?: string;
  onChange?: (text: string) => void;
  disabled?: boolean;
  disabledPlaceholder?: string;
  showAttachmentHint?: boolean;
}

export const UniversalInput: React.FC<UniversalInputProps> = ({ 
    onSubmit, 
    isLoading, 
    isStepActive, 
    showProceedButton = false, 
    proceedLabel,
    hideSendButton = false,
    language = 'pt-BR',
    value,
    onChange,
    disabled = false,
    disabledPlaceholder,
    showAttachmentHint = false
}) => {
  const [internalText, setInternalText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const isControlled = value !== undefined;
  const text = isControlled ? value : internalText;

  const UI = getUI(language as Language).actions;
  const isDisabled = isLoading || !isStepActive || isSubmitting || disabled;
  const defaultPlaceholder = !isStepActive ? (language === 'pt-BR' ? "Aguardando etapa atual..." : "Waiting for current step...") : UI.typeMessagePlaceholder;
  const placeholderText = disabledPlaceholder && isDisabled ? disabledPlaceholder : defaultPlaceholder;

  useEffect(() => {
      if (!isLoading) {
          setIsSubmitting(false);
      }
  }, [isLoading]);

  useEffect(() => {
    if (isStepActive && textAreaRef.current && text) {
        const len = text.length;
        textAreaRef.current.focus();
        textAreaRef.current.setSelectionRange(len, len);
    }
  }, [isStepActive]); // Focus when step becomes active or component mounts

  useEffect(() => {
    if (textAreaRef.current) {
        textAreaRef.current.style.height = 'auto';
        textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (isControlled && onChange) {
          onChange(newValue);
      } else {
          setInternalText(newValue);
      }
  };

  const clearText = () => {
      if (isControlled && onChange) {
          onChange('');
      } else {
          setInternalText('');
      }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(prev => [...prev, ...Array.from(event.target.files!)]);
    }
  };

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDisabled && (text.trim() || files.length > 0)) {
      setIsSubmitting(true);
      onSubmit({ text, files });
      clearText();
      setFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
    }
  }
  
  const handleProceedClick = () => {
    if (!isDisabled) {
      setIsSubmitting(true);
      onSubmit({ text, files, actionId: 'PROCEED' });
      clearText();
      setFiles([]);
    }
  };

  const handleAttachClick = () => {
      if (showAttachmentHint) {
          setShowHint(true);
      } else {
          fileInputRef.current?.click();
      }
  };

  const handleConfirmHint = () => {
      setShowHint(false);
      fileInputRef.current?.click();
  };

  const handleCancelHint = () => {
      setShowHint(false);
  };

  return (
    <div className={`transition-opacity duration-200 ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'opacity-100'}`}>
        <div className="bg-white border border-slate-300 rounded-xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-shadow">
            {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 px-2 pt-1 border-b border-slate-200 pb-3">
                    {files.map((file, index) => (
                        <div key={index} className="bg-slate-200 text-xs rounded-full py-1 pl-2 pr-3 flex items-center gap-2">
                            <FileIcon fileType={file.type} />
                            <span className="text-slate-600">{file.name}</span>
                            <button type="button" onClick={() => removeFile(file.name)} className="text-slate-500 hover:text-slate-800 font-mono text-lg leading-none -mr-1" disabled={isDisabled}>
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <textarea
                ref={textAreaRef}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholderText}
                className="w-full bg-transparent p-2 resize-none focus:outline-none placeholder-slate-500 min-h-10 text-slate-800"
                disabled={isDisabled}
            />
        </div>
        <div className="mt-3 flex items-center flex-wrap gap-3">
            {!hideSendButton && (
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isDisabled || (!text.trim() && files.length === 0)}
                    className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed hover:bg-blue-500 transition-all flex items-center gap-2 text-sm shadow-sm active:scale-95"
                >
                    {isSubmitting ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
                    )}
                    {isSubmitting ? (language === 'pt-BR' ? 'Enviando...' : 'Sending...') : UI.send}
                </button>
            )}
            <button
                type="button"
                onClick={handleAttachClick}
                className="bg-slate-100 text-slate-700 font-medium py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm border border-slate-200"
                disabled={isDisabled}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.122 2.122l7.81-7.81" /></svg>
                {UI.attach}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept=".pdf,.txt,.doc,.docx" disabled={isDisabled} />

            <FileAttachmentHint 
                isOpen={showHint} 
                onConfirm={handleConfirmHint} 
                onCancel={handleCancelHint} 
                language={language} 
            />

            {showProceedButton && (
                 <button
                    type="button"
                    onClick={handleProceedClick}
                    disabled={isDisabled}
                    className="bg-blue-600 text-white font-medium py-2 px-5 rounded-lg disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed hover:bg-blue-500 transition-all text-sm shadow-sm ml-auto flex items-center gap-2"
                >
                    {isSubmitting && (
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {proceedLabel || UI.proceed}
                </button>
            )}
        </div>
    </div>
  );
};
