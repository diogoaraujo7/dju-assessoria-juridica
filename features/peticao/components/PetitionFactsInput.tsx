
import React, { useState, useRef } from 'react';
import { Language } from '../../../types';
import { FileIcon } from '../../../components/Icons';

interface PetitionFactsInputProps {
    onAnalyze: (text: string, files: File[]) => void;
    isLoading: boolean;
    language: Language;
}

export const PetitionFactsInput: React.FC<PetitionFactsInputProps> = ({ onAnalyze, isLoading, language }) => {
    const [facts, setFacts] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isPT = language === 'pt-BR';

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
        onAnalyze(facts, files);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div>
                <label htmlFor="facts-input" className="block text-base font-semibold text-slate-700 mb-2">
                    {isPT ? "Narrativa dos Fatos (Obrigatório)" : "Statement of Facts (Required)"}
                </label>
                <textarea 
                    id="facts-input"
                    value={facts}
                    onChange={(e) => setFacts(e.target.value)}
                    placeholder={isPT ? "Descreva detalhadamente o ocorrido. O que aconteceu? Quando? Onde?..." : "Describe in detail what happened..."}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[250px] text-lg leading-relaxed"
                    required
                    disabled={isLoading}
                />
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {isPT ? "Anexar Documentos de Prova (Opcional)" : "Attach Evidence (Optional)"}
                </label>
                 <div className="flex flex-wrap items-center gap-4">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                        disabled={isLoading}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.41-7.81 7.81a1.5 1.5 0 0 0 2.122 2.122l7.81-7.81" /></svg>
                         {isPT ? "Anexar Arquivos" : "Attach Files"}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept=".pdf,.txt,.doc,.docx" disabled={isLoading} />
                 </div>

                 {files.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {files.map((file, index) => (
                            <div key={index} className="bg-slate-200 text-xs rounded-full py-1 pl-2 pr-3 flex items-center gap-2">
                                <FileIcon fileType={file.type} />
                                <span className="text-slate-600">{file.name}</span>
                                <button type="button" onClick={() => removeFile(file.name)} className="text-slate-500 hover:text-slate-800 font-mono text-lg leading-none -mr-1" disabled={isLoading}>
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="pt-6 border-t border-slate-200 flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading || !facts.trim()}
                    className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-500 transition-colors shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    {isPT ? "Analisar Fatos" : "Analyze Facts"} &rarr;
                </button>
            </div>
        </form>
    );
};
