import React from 'react';
import { Language } from '../types';

interface FileAttachmentHintProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    language: Language;
}

export const FileAttachmentHint: React.FC<FileAttachmentHintProps> = ({ isOpen, onConfirm, onCancel, language }) => {
    if (!isOpen) return null;

    const isPT = language === 'pt-BR';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-scale-in border border-slate-200">
                <div className="p-6">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="bg-blue-50 text-blue-600 p-3 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">
                                {isPT ? 'Contextualize o Anexo' : 'Contextualize the Attachment'}
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                {isPT 
                                    ? 'Para melhores resultados, informe no campo de texto como este documento deve ser utilizado (ex: "adotar seus fundamentos para deferir o pedido").' 
                                    : 'For best results, specify in the text field how this document should be used (e.g., "adopt its arguments to grant the request").'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 px-6 py-4 flex gap-3 border-t border-slate-200">
                    <button 
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        {isPT ? 'Cancelar' : 'Cancel'}
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-sm"
                    >
                        {isPT ? 'Anexar Arquivo' : 'Attach File'}
                    </button>
                </div>
            </div>
        </div>
    );
};

