
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { StepType, AnalysisViewMode, Step, Task, isDivergent } from '../types';
import { StepContent } from './StepContent';
import { UniversalInput } from './content/UniversalInput';
import { getStepConfig } from '../stepConfig';
import { useWorkflowConfig, useWorkflowDispatch, useWorkflowData } from '../context/WorkflowContext';
import { useUIState, useUIDispatch } from '../context/UIContext';
import { useGeminiState } from '../context/GeminiContext';
import { LoadingDots } from './Loaders';
import { useSmartScroll } from '../hooks/useSmartScroll';

import { ChatEditLayout } from './ChatEditLayout';

export const MainContent: React.FC = () => {
  const { viewingStep, currentStep, language, task, atoType } = useWorkflowConfig();
  const { stepData } = useWorkflowData();
  
  const { isLoading, failedRequest } = useGeminiState();
  const { handleUserSubmit, handleReset } = useWorkflowDispatch();
  const { sidebarOpen, analysisView } = useUIState();
  const { setSidebarOpen } = useUIDispatch();
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isInputOpen, setIsInputOpen] = useState(false);
  
  const isEditorMode = task === 'EDITOR';
  const hideSidebar = isEditorMode;
  const isChatEditLayout = isEditorMode;

  const isCurrentStep = currentStep === viewingStep;
  const currentStepData = stepData[viewingStep] || null;
  const stepConfigMap = getStepConfig(language, atoType);
  const currentStepConfig = stepConfigMap[viewingStep];

  useSmartScroll(scrollContainerRef as React.RefObject<HTMLDivElement>, viewingStep, currentStepData, analysisView);

  const isFinalDocumentStep = !!currentStepConfig?.isFinalDocument;
  const isPrimaryInput = !!currentStepConfig?.isPrimaryInput;
  const isFormStep = currentStepData?.stepType === StepType.FORM;

  const isDivergentFlow = (task === Task.ATO_DECISORIO) && isDivergent(atoType);
  const isAnalysisChatLayout = analysisView === AnalysisViewMode.SUMMARY_AND_MENU && 
        (viewingStep === Step.PETICAO_ANALISE || (viewingStep === Step.ATO_ANALISE_PROCESSUAL && !isDivergentFlow));

  const scrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);
  
  useEffect(() => {
    const stepType = currentStepData?.stepType;
    const input = currentStepData?.input;
    const contentText = currentStepData?.content?.toLowerCase() || '';

    const shouldOpenInput = 
        isPrimaryInput ||
        (stepType === StepType.CHOICE_THEN_INPUT && input?.text?.startsWith('1.')) ||
        contentText.includes('especifique') || 
        contentText.includes('specify');

    if (isFinalDocumentStep) {
        setIsInputOpen(false);
    } else {
        setIsInputOpen(!!shouldOpenInput);
    }
  }, [viewingStep, currentStepData?.stepType, currentStepData?.input, currentStepData?.content, isFinalDocumentStep, isPrimaryInput]);
  
  const handleHeaderResetClick = () => {
    setShowResetConfirm(true);
  };
  
  const confirmReset = () => {
      setShowResetConfirm(false);
      handleReset();
  };
  
  const cancelReset = () => {
      setShowResetConfirm(false);
  };

  const handleOpenInputPanel = () => {
    setIsInputOpen(true);
  };

  const showInput = isCurrentStep && (!!currentStepConfig?.hasUniversalInput || (isFinalDocumentStep && task !== 'REVISOR')) && !failedRequest && !isFormStep && !isChatEditLayout;
  const showProceedButton = !!currentStepConfig?.hasProceedButton;
  
  return (
    <main className={`flex-1 flex flex-col overflow-hidden bg-slate-50 relative min-w-0`}>
      <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 shrink-0 z-20 shadow-sm justify-between">
        <div className="flex items-center min-w-0 overflow-hidden flex-1">
            {!hideSidebar && (
              <button
                  type="button"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 mr-2"
                  aria-label="Toggle Sidebar"
                  title="Abrir/Fechar Menu Lateral"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
              </button>
            )}
            <div className="font-medium text-slate-700 truncate">
                {currentStepData?.title ? currentStepData.title : (language === 'pt-BR' ? 'Dju Assessoria Jurídica' : 'Dju Legal Assistant')}
            </div>
        </div>
        
        <button
            type="button"
            onClick={handleHeaderResetClick}
            className="ml-2 p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shrink-0"
            title={language === 'pt-BR' ? "Reiniciar e voltar ao início" : "Restart and return to home"}
        >
            <span className="hidden sm:inline">{language === 'pt-BR' ? 'Início' : 'Home'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                 <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
        </button>
      </div>

      {isChatEditLayout ? (
        <ChatEditLayout />
      ) : (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto flex flex-col min-w-0">
          <div className={`grow p-4 sm:p-6 flex flex-col min-w-0 ${isAnalysisChatLayout ? 'h-full overflow-hidden' : 'shrink-0'}`}>
            {currentStepData ? (
              <StepContent 
                scrollToTop={scrollToTop}
                scrollToBottom={scrollToBottom}
              />
            ) : (
              <div className="flex items-center justify-center h-full flex-1">
                 <LoadingDots />
              </div>
            )}
          </div>
        </div>
      )}
      
      {showInput && (
        <div className={`bg-white z-10 border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-all duration-300`}>
            {!isInputOpen && (
                 <button 
                    onClick={handleOpenInputPanel}
                    className="w-full flex items-center justify-center p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 text-sm font-medium gap-2 border-b border-slate-100 transition-colors focus:outline-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                    </svg>
                    {language === 'pt-BR' ? "Mostrar Painel de Mensagens" : "Show Message Panel"}
                </button>
            )}
            
            <div className={`overflow-hidden transition-all duration-300 ease-in-out relative ${isInputOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                {isInputOpen && (
                     <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-full flex justify-center">
                        <button 
                            onClick={() => setIsInputOpen(false)}
                            className="h-5 w-12 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full flex items-center justify-center transition-colors focus:outline-none group"
                            aria-label={language === 'pt-BR' ? "Ocultar Painel de Mensagens" : "Hide Message Panel"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 group-hover:scale-110 transition-transform">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>
                    </div>
                )}
                {showInput && (
                    <div className={`p-4 pt-5`}>
                        <UniversalInput
                            onSubmit={handleUserSubmit}
                            isLoading={isLoading}
                            isStepActive={isCurrentStep}
                            showProceedButton={showProceedButton}
                            proceedLabel={undefined}
                            hideSendButton={false}
                            language={language}
                            showAttachmentHint={currentStep === Step.ATO_ANALISE_PROCESSUAL || currentStep === Step.PETICAO_ANALISE}
                        />
                    </div>
                )}
            </div>
        </div>
      )}
      
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in-up border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                    {language === 'pt-BR' ? 'Reiniciar Procedimento?' : 'Restart Procedure?'}
                </h3>
                <p className="text-slate-600 mb-6">
                    {language === 'pt-BR' 
                        ? "Tem certeza que deseja retornar à tela inicial? Todo o progresso atual e as informações coletadas serão perdidos. Você deverá reiniciar o procedimento." 
                        : "Are you sure you want to return to the start screen? All current progress and collected information will be lost."}
                </p>
                <div className="flex justify-end gap-3">
                    <button 
                        type="button"
                        onClick={cancelReset}
                        className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        {language === 'pt-BR' ? 'Cancelar' : 'Cancel'}
                    </button>
                    <button 
                        type="button"
                        onClick={confirmReset}
                        className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                    >
                        {language === 'pt-BR' ? 'Sim, Reiniciar' : 'Yes, Restart'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </main>
  );
};
