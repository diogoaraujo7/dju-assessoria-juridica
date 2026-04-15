
import React, { useEffect, useMemo, useRef } from 'react';
import { 
    Step, StepType, ChoiceThenInputStepData, ArgumentSuggestionStepData,
    WorkflowTriggers, Task, isDivergent, AnalysisViewMode, UserAction
} from '../types';
import { DocumentContent } from './content/DocumentContent';
import { SelectionStepContent } from './content/SelectionStepContent';
import { AnalysisStepContent } from './content/AnalysisStepContent';
import { ChatContent } from './content/ChatContent';
import { MarkdownRenderer } from './MarkdownRenderer';
import { getUI } from '../ui';
import { getStepConfig } from '../stepConfig';
import { LoadingDots } from './Loaders';
import { PointSelectionContent } from './content/PointSelectionContent';
import { LoadingTips } from './content/LoadingTips';
import { InitialPetitionForm } from '../features/peticao/components/InitialPetitionForm';
import { RetryableError } from './RetryableError';
import { CheckIcon } from './Icons';
import { useWorkflowConfig, useWorkflowDispatch, useWorkflowData } from '../context/WorkflowContext';
import { useUIState, useUIDispatch } from '../context/UIContext';
import { useGeminiState, useGeminiDispatch } from '../context/GeminiContext';

interface StepContentProps {
  scrollToTop?: () => void;
  scrollToBottom?: () => void;
}

const STEP_COMPONENT_MAP: Record<string, React.FC<any>> = {
    [StepType.CHOICE_THEN_INPUT]: AnalysisStepContent,
    [StepType.ARGUMENT_SUGGESTION]: AnalysisStepContent,
    [StepType.MULTIPLE_CHOICE]: SelectionStepContent,
    [StepType.FORM]: InitialPetitionForm,
    [StepType.POINT_SELECTION]: PointSelectionContent,
    [StepType.DOCUMENT]: DocumentContent,
    [StepType.CHAT]: ChatContent,
};

export const StepContent: React.FC<StepContentProps> = ({ scrollToTop }) => {
    const { 
        task, viewingStep, currentStep, language, atoType, petitionType, representedParty
    } = useWorkflowConfig();
    const { stepData } = useWorkflowData();

    const { isLoading, failedRequest } = useGeminiState();
    const geminiDispatch = useGeminiDispatch();
    const { 
        handleUserSubmit, handleComplementaryMenuAction, handleRetry, handleContinue, handleGenerateEmentaFromAto, handleGoogleSearchForBases, handleResetBasesChoice, handleTaskSelect, handleUpdateContent, handleSkipPrediction, handleReset, handleGoBack
    } = useWorkflowDispatch();
    const { analysisView, loadingMenuItem, sidebarOpen } = useUIState();
    const uiDispatch = useUIDispatch();
    const { setAnalysisView } = uiDispatch;
    
    const headingRef = useRef<HTMLHeadingElement>(null);

    const isStepActive = currentStep === viewingStep;
    const data = stepData[viewingStep]!;
    
    const stepConfig = getStepConfig(language, atoType)[viewingStep];
    const isFinalDocument = !!stepConfig?.isFinalDocument;

    const showGeneratingLoader = (data.stepType === StepType.CHOICE_THEN_INPUT || data.stepType === StepType.ARGUMENT_SUGGESTION) && (data as ChoiceThenInputStepData | ArgumentSuggestionStepData).isGeneratingSuggestions && isStepActive;

    const isDivergentFlow = (task === Task.ATO_DECISORIO) && isDivergent(atoType);

    const showLoading = isLoading && !data.content && !(data.stepType === StepType.ARGUMENT_SUGGESTION && (data as ArgumentSuggestionStepData).suggestions) && !data.summaryContent;
    
    const isSpecialLoadingStep = (viewingStep === Step.ATO_PONTOS_DIVERGENCIA || viewingStep === Step.REVISOR_ANALISE) && isLoading && !data.content;

    const isGeneratingSummary = (viewingStep === Step.PETICAO_ANALISE || (viewingStep === Step.ATO_ANALISE_PROCESSUAL && !isDivergentFlow)) && 
                                isLoading && 
                                (!data.summaryContent || data.summaryContent.length < 20);

    const isWaitingForPrediction = (viewingStep === Step.ATO_ANALISE_PROCESSUAL || viewingStep === Step.PETICAO_ANALISE) && isLoading && !showGeneratingLoader && !isGeneratingSummary && !loadingMenuItem;

    const handleCloseLoading = () => {
        if (showGeneratingLoader) {
            handleResetBasesChoice(viewingStep);
        } else if (isGeneratingSummary) {
            const previousStep = viewingStep === Step.PETICAO_ANALISE ? Step.PETICAO_DADOS : Step.ATO_DADOS_PROCESSO;
            handleGoBack(previousStep);
        } else if (isSpecialLoadingStep) {
            const previousStep = viewingStep === Step.ATO_PONTOS_DIVERGENCIA ? Step.ATO_VOTO_RELATOR : Step.REVISOR_UPLOAD_DOC_ANALISE;
            handleGoBack(previousStep);
        } else if (isWaitingForPrediction) {
            geminiDispatch.setLoading(false);
        } else if (loadingMenuItem) {
            uiDispatch.setLoadingMenuItem(null);
            geminiDispatch.setLoading(false);
        } else {
            geminiDispatch.setLoading(false);
        }
    };

    useEffect(() => {
        if (headingRef.current) {
            headingRef.current.focus();
        }
    }, [viewingStep]);

    const { mainDisplayContent, finalMessageContent, contentToCopyForActions, introMessage } = useMemo(() => {
        let mainDisplayContent = data.content;
        let finalMessageContent: string | null = null;
        let contentToCopyForActions = data.content;
        let introMessage: string | null = null;
        
        const startTagEmenta = '[INÍCIO DA EMENTA]';
        const endTagEmenta = '[FINAL DA EMENTA]';
        const startTagAto = '[INÍCIO DO ATO]';
        const endTagAto = '[FIM DO ATO]';

        const content = data.content || '';

        if (viewingStep === Step.EMENTA_RESULTADO) {
            const startIndex = content.indexOf(startTagEmenta);
            const endIndex = content.indexOf(endTagEmenta);
            
            if (startIndex !== -1 && endIndex !== -1) {
                introMessage = content.substring(0, startIndex).trim();
                mainDisplayContent = content.substring(startIndex + startTagEmenta.length, endIndex).trim();
                contentToCopyForActions = mainDisplayContent;
                finalMessageContent = content.substring(endIndex + endTagEmenta.length).trim();
            }
        } else if (viewingStep === Step.ELABORAR_ATO || viewingStep === Step.ELABORAR_PETICAO) {
             const startIndex = content.indexOf(startTagAto);
             const endIndex = content.indexOf(endTagAto);
             
             if (startIndex !== -1) {
                 introMessage = content.substring(0, startIndex).trim();
                 if (endIndex !== -1) {
                     mainDisplayContent = content.substring(startIndex + startTagAto.length, endIndex).trim();
                     finalMessageContent = content.substring(endIndex + endTagAto.length).trim();
                 } else {
                     mainDisplayContent = content.substring(startIndex + startTagAto.length).trim();
                 }
                 contentToCopyForActions = mainDisplayContent;
             }
        } else if (viewingStep === Step.TEMPLATE_RESULTADO && content.includes('{Instruções para a elaboração do ato processual}')) {
            let templateStartIndex = content.indexOf('TEMPLATE PARA');
            if (templateStartIndex === -1) {
                templateStartIndex = content.indexOf('{Instruções para a elaboração do ato processual}');
            }
            introMessage = null; 
            mainDisplayContent = content.substring(templateStartIndex);
            contentToCopyForActions = mainDisplayContent;
        }
        return { mainDisplayContent, finalMessageContent, contentToCopyForActions, introMessage };
    }, [data.content, viewingStep]);

    const handleContentChange = (newContent: string) => {
        let fullContent = newContent;
        if (viewingStep === Step.EMENTA_RESULTADO) {
            const startTagEmenta = '[INÍCIO DA EMENTA]';
            const endTagEmenta = '[FINAL DA EMENTA]';
            if (introMessage !== null) {
                fullContent = `${introMessage}\n\n${startTagEmenta}\n${newContent}\n${endTagEmenta}`;
                if (finalMessageContent) {
                    fullContent += `\n\n${finalMessageContent}`;
                }
            }
        } else if (viewingStep === Step.ELABORAR_ATO || viewingStep === Step.ELABORAR_PETICAO) {
            const startTagAto = '[INÍCIO DO ATO]';
            const endTagAto = '[FIM DO ATO]';
            if (introMessage !== null) {
                fullContent = `${introMessage}\n\n${startTagAto}\n${newContent}\n${endTagAto}`;
                if (finalMessageContent) {
                    fullContent += `\n\n${finalMessageContent}`;
                }
            }
        }
        
        handleUpdateContent(viewingStep, fullContent);
    };
    
    const UI = getUI(language).actions;
    
    const isRetryableError = !!failedRequest && isStepActive && (data.content.includes(UI.overloadTitle) || data.content.includes(UI.tokenLimitTitle) || data.content.includes(UI.quotaExceededTitle) || data.content.includes(UI.fileSizeLimitTitle));

    const getCommonProps = () => ({
        data: data,
        isLoading: isLoading && isStepActive,
        language,
        onUserSubmit: handleUserSubmit,
    });

    const renderContent = () => {
        const Component = STEP_COMPONENT_MAP[data.stepType];
        
        if (!Component) {
            return (
                <div className="p-4 text-red-500">
                    Error: Unknown or Mismatched StepType {(data as any).stepType}
                </div>
            );
        }

        if (data.stepType === StepType.CHOICE_THEN_INPUT || data.stepType === StepType.ARGUMENT_SUGGESTION) {
             return <Component 
                {...getCommonProps()}
                viewingStep={viewingStep}
                task={task}
                atoType={atoType}
                petitionType={petitionType}
                representedParty={representedParty}
                analysisView={analysisView}
                loadingMenuItem={loadingMenuItem}
                sidebarOpen={sidebarOpen}
                handleComplementaryMenuAction={handleComplementaryMenuAction}
                handleGoogleSearchForBases={handleGoogleSearchForBases}
                handleRetry={handleRetry}
                setAnalysisView={setAnalysisView}
                handleResetBasesChoice={handleResetBasesChoice}
                scrollToTop={scrollToTop}
             />
        }

        if (data.stepType === StepType.MULTIPLE_CHOICE) {
            return <Component 
                {...getCommonProps()}
                onSelect={(option: string, actionId?: string) => handleUserSubmit({text: option, actionId})}
            />
        }

        if (data.stepType === StepType.FORM) {
            return <Component 
                {...getCommonProps()}
                retryAction={failedRequest ? () => handleRetry() : null}
                onRetry={handleRetry}
                onCancel={() => geminiDispatch.setLoading(false)}
            />
        }

        if (data.stepType === StepType.DOCUMENT) {
            const isFinalAtoStep = viewingStep === Step.ELABORAR_ATO;
            const isEditableStep = isFinalDocument && !isLoading;
            
            const finalActionsProps = isEditableStep && !isLoading && data.content ? {
                contentToCopy: contentToCopyForActions,
                showGenerateEmenta: isFinalAtoStep,
                isGeneratingEmenta: data.isGeneratingEmenta,
                copyOptions: {
                    withIndentation: true,
                    isJustified: false
                }
            } : undefined;

            return (
                <Component 
                    {...getCommonProps()}
                    data={{ ...data, content: mainDisplayContent } as any}
                    viewingStep={viewingStep}
                    isStepActive={isStepActive}
                    isEditable={isEditableStep}
                    onContentChange={handleContentChange}
                    onRetry={() => handleRetry()}
                    onApplyRevisorSolutions={(selectedIds?: string[]) => {
                        let text = WorkflowTriggers.CMD_APLICAR_SOLUCOES;
                        if (selectedIds && selectedIds.length > 0) {
                            text += `|||${JSON.stringify(selectedIds)}`;
                        }
                        handleUserSubmit({ text });
                    }}
                    onNewAnalysis={() => handleTaskSelect(Task.REVISOR, 'models/gemini-3.1-pro-preview')}
                    onRegenerateEmenta={isFinalAtoStep ? handleGenerateEmentaFromAto : undefined}
                    finalActionsProps={finalActionsProps}
                />
            );
        }

        if (data.stepType === StepType.CHAT) {
            return <Component {...getCommonProps()} className="flex flex-col h-[calc(100vh-200px)] min-h-[500px] bg-transparent overflow-hidden max-w-4xl mx-auto w-full" />;
        }

        return <Component {...getCommonProps()} />;
    };

    const showSuccessTransition = viewingStep === Step.ATO_VOTO_RELATOR && !isLoading;

    const isShowingSuggestions = data.stepType === StepType.ARGUMENT_SUGGESTION && analysisView === AnalysisViewMode.POINTS;

    const hideTitleFor3a = analysisView === AnalysisViewMode.SUMMARY_AND_MENU && 
        (viewingStep === Step.PETICAO_ANALISE || (viewingStep === Step.ATO_ANALISE_PROCESSUAL && !isDivergentFlow));

    return (
        <div className={`animate-fade-in-up ${isFinalDocument || hideTitleFor3a ? 'flex flex-col h-full' : ''}`}>
            {(showGeneratingLoader || isGeneratingSummary || isSpecialLoadingStep || isWaitingForPrediction) && (
                <div aria-live="polite">
                    <LoadingTips 
                        language={language} 
                        isGeneratingSuggestions={showGeneratingLoader || isSpecialLoadingStep} 
                        viewingStep={viewingStep}
                        onSkip={isWaitingForPrediction ? handleSkipPrediction : undefined}
                        onRestart={showGeneratingLoader ? () => handleUserSubmit({ actionId: UserAction.GENERATE_SUGGESTIONS, text: data.input?.text || '' }) : undefined}
                        onClose={handleCloseLoading}
                    />
                </div>
            )}
            
            {showSuccessTransition && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm flex items-start sm:items-center gap-4 animate-fade-in ring-1 ring-green-100">
                    <div className="bg-green-100 p-2 rounded-full shrink-0 text-green-600">
                        <CheckIcon />
                    </div>
                    <div>
                        <h3 className="font-bold text-green-800 text-sm sm:text-base">
                            {language === 'pt-BR' ? 'Dados do Processo registrados com sucesso!' : 'Case Data successfully registered!'}
                        </h3>
                    </div>
                </div>
            )}

            {!isFinalDocument && !stepConfig?.hideTitle && !hideTitleFor3a && (
                <div className="mb-6 pb-4 border-b border-slate-200">
                    {isShowingSuggestions ? (
                        <h4 ref={headingRef} tabIndex={-1} className="text-lg font-medium text-slate-600 focus:outline-none">
                            {language === 'pt-BR' ? 'Selecione as bases argumentativas:' : 'Select the arguments:'}
                        </h4>
                    ) : (
                        <>
                            <h1 ref={headingRef} tabIndex={-1} className="text-lg font-bold text-slate-800 focus:outline-none"><MarkdownRenderer>{data.title}</MarkdownRenderer></h1>
                            {data.subtitle && <div className="mt-1 text-md text-slate-600"><MarkdownRenderer>{data.subtitle}</MarkdownRenderer></div>}
                        </>
                    )}
                </div>
            )}

            {introMessage && !isRetryableError && !isFinalDocument && !hideTitleFor3a && (
                <div className="p-4 bg-slate-100 rounded-lg border border-slate-200 mb-6 prose prose-slate max-w-none">
                    <MarkdownRenderer withIndentation={viewingStep !== Step.EMENTA_RESULTADO && viewingStep !== Step.EDITOR_EDITAR_TEXTO}>{introMessage}</MarkdownRenderer>
                </div>
            )}
            
            {isRetryableError ? (
                 <RetryableError 
                    onRetry={handleRetry} 
                    onContinue={handleContinue}
                    onReset={handleReset}
                    partialContent={data.content} 
                    language={language} 
                 />
            ) : showLoading ? (
                <div aria-live="polite"><LoadingDots /></div>
            ) : (
                <div className={isFinalDocument || hideTitleFor3a ? 'flex flex-col h-full flex-1' : ''}>
                    {renderContent()}
                </div>
            )}

            {finalMessageContent && !isRetryableError && (
                <div className="mt-8 pt-6 border-t border-dashed border-slate-200">
                     <div className="prose prose-slate max-w-none prose-p:my-2 prose-a:text-blue-600 hover:prose-a:underline">
                        <MarkdownRenderer withIndentation={viewingStep !== Step.EMENTA_RESULTADO && viewingStep !== Step.EDITOR_EDITAR_TEXTO}>{finalMessageContent}</MarkdownRenderer>
                    </div>
                </div>
            )}
        </div>
    )
}
