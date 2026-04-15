
import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../types';
import { getUI } from '../ui';
import { useWorkflowState, useWorkflowDispatch } from '../context/WorkflowContext';
import { useGeminiState } from '../context/GeminiContext';
import { Settings, ExternalLink, ChevronDown, Cpu } from 'lucide-react';

import { DEFAULT_MODEL, PRO_MODEL } from '../services/geminiService';

const TaskCard: React.FC<{ title: string, description: string, onClick: () => void, disabled: boolean, icon: React.ReactNode }> = 
  ({ title, description, onClick, disabled, icon }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="p-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-left transition-all hover:shadow-lg hover:-translate-y-1 disabled:opacity-50 disabled:cursor-wait w-full flex flex-col items-start h-full"
    >
        <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg mb-3">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <p className="text-slate-600 mt-1 text-sm flex-1 leading-snug">{description}</p>
    </button>
);


export const InitialSelectionScreen: React.FC = () => {
  const { language } = useWorkflowState();
  const { isLoading } = useGeminiState();
  const { handleTaskSelect } = useWorkflowDispatch();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  
  const isDisabled = isLoading;
  const UI = getUI(language).initialScreen;
  
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getModelForTask = (task: Task) => {
      if (task === Task.REVISOR) return DEFAULT_MODEL;
      return selectedModel;
  };

  return (
    <div className="animate-fade-in-up max-w-6xl mx-auto flex flex-col min-h-[80vh] py-2">
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">{UI.title}</h1>
        <p className="mt-2 text-lg text-slate-600 max-w-2xl mx-auto">{UI.subtitle}</p>
      </div>

      <div className="space-y-6">
        {/* Task Selection */}
        <div>
          <div className="flex items-center justify-between mb-4 max-w-6xl mx-auto">
            <h2 className="text-xl font-bold text-slate-800 text-left">{UI.selectTask}</h2>
            
            {/* Settings Menu */}
            <div className="relative" ref={settingsRef}>
               <button 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
               >
                  <Settings size={16} />
                  <span className="text-sm font-medium">{language === 'pt-BR' ? 'Configurações' : 'Settings'}</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isSettingsOpen ? 'rotate-180' : ''}`} />
               </button>

               {isSettingsOpen && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                      <div className="p-4 space-y-4">
                          
                          {/* Model Selection */}
                          <div className="space-y-2">
                              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  <Cpu size={14} />
                                  {language === 'pt-BR' ? 'Modelo de IA' : 'AI Model'}
                              </label>
                              <select 
                                  value={selectedModel}
                                  onChange={(e) => setSelectedModel(e.target.value)}
                                  className="w-full text-sm border border-slate-200 rounded-md py-1.5 px-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                  <option value={DEFAULT_MODEL}>Gemini 3 Flash Preview</option>
                                  <option value={PRO_MODEL}>Gemini 3.1 Pro Preview</option>
                              </select>
                              <p className="text-[10px] text-slate-400 leading-tight">
                                  {language === 'pt-BR' 
                                      ? 'Nota: O Relatório de Revisão utiliza o modelo Pro.' 
                                      : 'Note: Revisor uses the Pro model only for complex report generation.'}
                              </p>
                          </div>
                      </div>
                  </div>
               )}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            <TaskCard 
              title={UI.taskAtoTitle}
              description={UI.taskAtoDesc}
              onClick={() => handleTaskSelect(Task.ATO_DECISORIO, getModelForTask(Task.ATO_DECISORIO))}
              disabled={isDisabled}
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>}
            />
            <TaskCard 
              title={UI.taskEmentaTitle}
              description={UI.taskEmentaDesc}
              onClick={() => handleTaskSelect(Task.EMENTA, getModelForTask(Task.EMENTA))}
              disabled={isDisabled}
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" /></svg>}
            />
            <TaskCard 
              title={UI.taskTemplateTitle}
              description={UI.taskTemplateDesc}
              onClick={() => handleTaskSelect(Task.TEMPLATE, getModelForTask(Task.TEMPLATE))}
              disabled={isDisabled}
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h.01M15 12h.01M10.5 16.5h3M13.5 3.375H10.5a2.25 2.25 0 0 0-2.25 2.25v1.5a2.25 2.25 0 0 0 2.25 2.25h3a2.25 2.25 0 0 0 2.25-2.25v-1.5a2.25 2.25 0 0 0-2.25-2.25Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 21a3 3 0 0 0 3-3V7.5a3 3 0 0 0-3-3H7.5a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h9Z" /></svg>}
            />
            <TaskCard 
              title={UI.taskPeticaoTitle}
              description={UI.taskPeticaoDesc}
              onClick={() => handleTaskSelect(Task.PETICAO, getModelForTask(Task.PETICAO))}
              disabled={isDisabled}
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 12.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>}
            />
            <TaskCard 
              title={UI.taskRevisorTitle}
              description={UI.taskRevisorDesc}
              onClick={() => handleTaskSelect(Task.REVISOR, getModelForTask(Task.REVISOR))}
              disabled={isDisabled}
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg>}
            />
            <TaskCard 
              title={UI.taskEditTitle}
              description={UI.taskEditDesc}
              onClick={() => handleTaskSelect(Task.EDITOR, getModelForTask(Task.EDITOR))}
              disabled={isDisabled}
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 12.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>}
            />
          </div>
        </div>
      </div>

       <div className="mt-auto pt-12 w-full">
        <div className="pt-6 pb-4 border-t border-slate-200 w-full max-w-6xl mx-auto px-4 flex flex-col items-center gap-0">
            {/* Tutorial Link (Top Center) */}
            <a 
                href="https://institutovicario.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors text-center"
            >
                <span>{language === 'pt-BR' ? 'Clique aqui para liberar o acesso gratuito às tarefas do App (Tutorial rápido) e conheça o curso: Dju + O Futuro da I.A.' : 'View Tutorial'}</span>
                <ExternalLink size={14} className="shrink-0" />
            </a>

            {/* Bottom Row: Logo, Notice, Socials */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full">
                {/* Logo (Left) */}
                <div className="flex-1 flex justify-start items-center">
                    <a href="https://institutovicario.com.br/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity">
                        <img 
                            src="/logovicario.png" 
                            alt="Vicário Logo" 
                            className="h-[60px] object-contain" 
                            referrerPolicy="no-referrer"
                        />
                    </a>
                </div>

                {/* Educational Notice (Center) */}
                <div className="flex-[2] flex justify-center items-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400 shrink-0">
                            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                        </svg>
                        <span className="whitespace-nowrap">{UI.educationalNotice}</span>
                    </div>
                </div>

                {/* Social Media (Right) */}
                <div className="flex-1 flex justify-end items-center gap-4 text-slate-400">
                    <a href="https://www.instagram.com/institutovicario/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors" aria-label="Instagram">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                        </svg>
                    </a>
                    <a href="https://www.youtube.com/@institutovicario" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors" aria-label="YouTube">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path fillRule="evenodd" d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" clipRule="evenodd" />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
       </div>
    </div>
  );
};
