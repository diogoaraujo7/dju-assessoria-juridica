import React, { useRef, useState, useEffect } from 'react';
import { FileIcon, CheckIcon } from '../Icons';

const CustomSlider = ({ min, max, value, onChange, onCommit }: { min: number, max: number, value: number, onChange: (v: number) => void, onCommit?: (v: number) => void }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (trackRef.current && e.target === trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const range = max - min;
      const newValue = Math.round(min + percent * range);
      if (newValue !== localValue) {
        setLocalValue(newValue);
        onChange(newValue);
      }
    }
    
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const range = max - min;
    const newValue = Math.round(min + percent * range);
    if (newValue !== localValue) {
      setLocalValue(newValue);
      onChange(newValue);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    if (onCommit) onCommit(localValue);
  };

  const percent = ((localValue - min) / (max - min)) * 100;

  const ticks = [];
  for (let i = min; i <= max; i++) {
    const tickPercent = ((i - min) / (max - min)) * 100;
    ticks.push(
      <div 
        key={i} 
        className="absolute w-1 h-1 bg-slate-400 rounded-full pointer-events-none z-0"
        style={{ left: `calc(${tickPercent}% - 2px)` }}
      />
    );
  }

  return (
    <div 
      className="relative w-full h-6 flex items-center cursor-pointer" 
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="absolute w-full h-1.5 bg-slate-200 rounded-full pointer-events-none"></div>
      
      {ticks}
      
      <div 
        className="absolute h-5 w-3.5 bg-blue-600 rounded shadow cursor-grab active:cursor-grabbing hover:bg-blue-500 transition-colors flex flex-col items-center justify-center gap-[2px] z-10"
        style={{ left: `calc(${percent}% - 7px)`, touchAction: 'none' }}
      >
        <div className="w-0.5 h-1 bg-white/60 rounded-full pointer-events-none"></div>
        <div className="w-0.5 h-1 bg-white/60 rounded-full pointer-events-none"></div>
      </div>
    </div>
  );
};

interface TemplateInputFormProps {
    content?: string;
    isLoading: boolean;
    onUserSubmit: (input: { text: string; files?: File[]; lengthValue?: number; toneValue?: number }) => void;
    tip?: string;
}

export const TemplateInputForm: React.FC<TemplateInputFormProps> = ({ isLoading, onUserSubmit, tip }) => {
    const [templateText, setTemplateText] = useState('');
    const [templateFiles, setTemplateFiles] = useState<File[]>([]);
    const [showFileSuccess, setShowFileSuccess] = useState(false);
    const [lengthValue, setLengthValue] = useState(0);
    const [toneValue, setToneValue] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setTemplateFiles(prev => [...prev, ...Array.from(event.target.files!)]);
            setShowFileSuccess(true);
            setTimeout(() => setShowFileSuccess(false), 3000);
        }
    };

    const removeFile = (fileName: string) => {
        setTemplateFiles(prev => prev.filter(file => file.name !== fileName));
    };

    const handleSubmit = () => {
        onUserSubmit({ text: templateText || "Nenhum template fornecido.", files: templateFiles, lengthValue, toneValue });
    };

    const renderLengthIndicator = () => {
        const lines = lengthValue + 4; // -2 -> 2 lines, 0 -> 4 lines, 2 -> 6 lines
        return (
            <div className="w-10 h-10 bg-white border border-slate-300 rounded shadow-sm flex flex-col items-center justify-center p-1 gap-0.5">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-0.5 rounded-full w-full transition-all duration-300 ${i < lines ? 'bg-slate-400' : 'bg-transparent'}`}
                        style={{ opacity: i < lines ? 1 : 0 }}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-full animate-fade-in">
            <div className="p-6 overflow-y-auto">
                <div className="flex flex-col gap-6">
                    
                    {/* Estilo e Tom */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                            <h3 className="text-lg font-semibold text-slate-800">Estilo e Tom</h3>
                        </div>
                        
                        <div className="sm:ml-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Extensão */}
                            <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="flex flex-row items-center justify-start gap-4">
                                    <label className="text-sm font-semibold text-slate-700">Extensão do Texto</label>
                                    {renderLengthIndicator()}
                                </div>
                                <div className="flex justify-between text-[11px] text-slate-500 font-medium px-1 mt-2">
                                    <span>Mais curto</span>
                                    <span>Mais longo</span>
                                </div>
                                <CustomSlider 
                                    min={-2} 
                                    max={2} 
                                    value={lengthValue}
                                    onChange={setLengthValue}
                                />
                                <p className="text-[11px] text-slate-500 mt-2 text-center h-8 flex items-center justify-center">
                                    {lengthValue === -2 && "Muito curto (até 100 palavras sobre cada ponto)"}
                                    {lengthValue === -1 && "Curto (até 150 palavras sobre cada ponto)"}
                                    {lengthValue === 0 && "Médio (aprox. 250 palavras sobre cada ponto)"}
                                    {lengthValue === 1 && "Longo (aprox. 300 palavras sobre cada ponto)"}
                                    {lengthValue === 2 && "Muito longo (aprox. 350 palavras sobre cada ponto)"}
                                </p>
                            </div>

                            {/* Tom */}
                            <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="flex flex-row items-center justify-start gap-4">
                                    <label className="text-sm font-semibold text-slate-700">Tom da Escrita</label>
                                    <div className="w-10 h-10"></div>
                                </div>
                                <div className="flex justify-between text-[11px] text-slate-500 font-medium px-1 mt-2">
                                    <span>Mais simples</span>
                                    <span>Mais formal</span>
                                </div>
                                <CustomSlider 
                                    min={-2} 
                                    max={2} 
                                    value={toneValue}
                                    onChange={setToneValue}
                                />
                                <p className="text-[11px] text-slate-500 mt-2 text-center h-8 flex items-center justify-center">
                                    {toneValue === -2 && "Mais simples e acessível a leigos"}
                                    {toneValue === -1 && "Claro e direto, não tão formal"}
                                    {toneValue === 0 && "Normal (tom padrão)"}
                                    {toneValue === 1 && "Muito formal e polido"}
                                    {toneValue === 2 && "Extremamente técnico e formal"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Template e Instruções */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                            <h3 className="text-lg font-semibold text-slate-800">Template e Instruções (opcional)</h3>
                        </div>
                        <p className="text-slate-500 mb-4 text-xs sm:ml-10">
                            Anexe um modelo ou digite instruções adicionais para que o Dju siga seu estilo.
                        </p>
                        
                        <div className={`sm:ml-10 flex-1 flex flex-col transition-opacity ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                            <div className="bg-white border border-slate-300 rounded-xl p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all shadow-sm flex flex-col min-h-[120px]">
                                {templateFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2 px-1 pt-1 border-b border-slate-100 pb-2">
                                        {templateFiles.map((file, index) => (
                                            <div key={index} className="bg-slate-50 border border-slate-200 text-[10px] rounded-full py-1 pl-2 pr-3 flex items-center gap-1.5">
                                                <FileIcon fileType={file.type} />
                                                <span className="text-slate-700 font-medium truncate max-w-[120px]">{file.name}</span>
                                                <button type="button" onClick={() => removeFile(file.name)} className="text-slate-400 hover:text-red-500 font-mono text-base leading-none ml-0.5" disabled={isLoading}>
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <textarea
                                    ref={textAreaRef}
                                    value={templateText}
                                    onChange={(e) => setTemplateText(e.target.value)}
                                    placeholder="Cole um modelo ou digite instruções específicas..."
                                    className="w-full bg-transparent p-1.5 resize-none focus:outline-none placeholder-slate-400 text-sm flex-1"
                                    disabled={isLoading}
                                />
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-blue-600 hover:text-blue-700 font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 px-2 py-1.5 rounded-lg hover:bg-blue-50"
                                    disabled={isLoading}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.41-7.81 7.81a1.5 1.5 0 0 0 2.122 2.122l7.81-7.81" /></svg>
                                    Anexar Arquivo
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept=".pdf,.txt,.doc,.docx" disabled={isLoading} />
                            </div>
                            {showFileSuccess && (
                                <div className="mt-1.5 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-xs animate-fade-in">
                                    <CheckIcon /> 
                                    <span className="font-medium">Arquivo(s) anexado(s) com sucesso!</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                {tip && (
                    <div className="text-[11px] text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 flex-1 max-w-md animate-fade-in">
                        {tip}
                    </div>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-blue-600 text-white font-semibold py-2.5 px-8 rounded-xl hover:bg-blue-500 transition-all disabled:bg-slate-400 w-full sm:w-auto text-sm shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    Gerar Minuta
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                </button>
            </div>
        </div>
    );
};