
import React, { useTransition } from 'react';
import { Step, Task, Language, isDivergent, isSpecialPetition, PetitionIdentifiers, FormStepData } from '../types';
import { AtoType } from '../types/domain';
import { getStepConfig } from '../stepConfig';
import { getUI } from '../ui';
import { useWorkflowConfig, useWorkflowDispatch, useWorkflowData } from '../context/WorkflowContext';
import { useUIState, useUIDispatch } from '../context/UIContext';
import { workflows } from '../configs/workflowConfig';

interface StepItemProps {
    title: string,
    isCompleted: boolean,
    isActive: boolean,
    isViewing: boolean,
    onClick: () => void,
    isSubItem?: boolean,
    forceEnable?: boolean,
    isPending: boolean,
    language: Language,
}

const StepItem: React.FC<StepItemProps> = ({ title, isCompleted, isActive, isViewing, onClick, isSubItem = false, forceEnable = false, isPending, language }) => {
    
    const getStatusClasses = () => {
        if (isViewing) return 'bg-blue-100 text-blue-700 border-l-4 border-blue-500';
        if (isActive) return 'bg-slate-100 text-slate-800 font-semibold';
        if (isCompleted) return 'text-slate-500 hover:bg-slate-100';
        return 'text-slate-400 cursor-not-allowed';
    }

    const canClick = isCompleted || isActive || isViewing || forceEnable;

    const getAriaLabel = () => {
        const isPT = language === 'pt-BR';
        let status = '';
        if (isActive) status = isPT ? '(Etapa Atual)' : '(Current Step)';
        else if (isCompleted) status = isPT ? '(Concluído)' : '(Completed)';
        else if (!canClick) status = isPT ? '(Pendente)' : '(Pending)';
        
        return `${title} ${status}`;
    };

    return (
        <li className="list-none">
            <button
                type="button"
                onClick={canClick ? onClick : undefined}
                className={`w-full text-left flex items-center gap-4 py-3 transition-colors duration-200 ${isSubItem ? 'pl-8' : 'px-4'} ${getStatusClasses()} ${canClick ? 'cursor-pointer' : ''} ${isPending && isViewing ? 'opacity-70 animate-pulse' : ''}`}
                aria-current={isActive ? 'step' : undefined}
                aria-label={getAriaLabel()}
                aria-disabled={!canClick}
                disabled={!canClick}
                role="link"
            >
                 <div className="flex items-center justify-center w-6 h-6 shrink-0" aria-hidden="true">
                    {isCompleted && !isActive && !isViewing && !isSubItem ? (
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-green-500">
                            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.06 0l4-5.5Z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <div className={`w-3 h-3 rounded-full ${isViewing ? 'bg-blue-500' : isActive ? 'bg-slate-400' : isCompleted ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                    )}
                </div>
                <span className={`text-sm ${isViewing ? 'font-bold' : 'font-medium'}`}>{title}</span>
            </button>
        </li>
    );
};

export const WorkflowSidebar: React.FC = () => {
    const { task, currentStep, completedSteps, viewingStep, atoType, petitionType, language } = useWorkflowConfig();
    const { stepData } = useWorkflowData();
    
    const { setViewingStep } = useWorkflowDispatch();
    const { sidebarOpen, analysisView } = useUIState();
    const { setSidebarOpen, setAnalysisView } = useUIDispatch();
    
    const [isPending, startTransition] = useTransition();

    const UI_DATA = getUI(language);
    const UI = UI_DATA.sidebar;
    const STEP_CONFIG = getStepConfig(language);

    const onToggle = () => setSidebarOpen(!sidebarOpen);

    const handleStepClick = (step: Step) => {
        if (window.innerWidth < 768) onToggle();
        startTransition(() => {
            setViewingStep(step);
        });
    };

    const getStepsForTask = (task: Task): Step[] => {
        const taskWorkflow = workflows[task];
        if (!taskWorkflow) return [];

        if (task === Task.ATO_DECISORIO) {
            const isDivergentFlow = isDivergent(atoType);
            return isDivergentFlow ? taskWorkflow.divergent : taskWorkflow.default;
        }

        if (task === Task.PETICAO) {
            const isSpecialFlow = isSpecialPetition(petitionType);
            return isSpecialFlow && taskWorkflow.special ? taskWorkflow.special : taskWorkflow.default;
        }

        return taskWorkflow.default;
    };

    const steps = getStepsForTask(task!);
    const isDivergentFlow = (task === Task.ATO_DECISORIO) && isDivergent(atoType);
    const isSpecialFlow = (task === Task.PETICAO) && isSpecialPetition(petitionType);
    
    const getTitleOverride = (step: Step, language: Language) => {
        const isPT = language === 'pt-BR';
        
        if (task === Task.PETICAO) {
            if (petitionType === PetitionIdentifiers.INITIAL_PETITION || petitionType?.startsWith('1. ')) {
                if (step === Step.PETICAO_DADOS) {
                    const stepDataObj = stepData[Step.PETICAO_DADOS] as FormStepData | undefined;
                    const phase = stepDataObj?.formPhase;
                    if (phase === 'review') return isPT ? '2. Dados da Petição' : '2. Petition Data';
                    return isPT ? '2. Relato dos Fatos' : '2. Statement of Facts';
                }
            }
        }

        if (task === Task.ATO_DECISORIO && step === Step.ELABORAR_ATO && !isDivergentFlow) {
            const isOpinion = atoType?.includes(AtoType.PARECER);
            return isOpinion ? UI_DATA.actions.draftOpinionTitle : UI_DATA.actions.draftDecisionTitle;
        }

        if (isDivergentFlow) {
            switch (step) {
                case Step.ATO_ANALISE_PROCESSUAL:
                    return isPT ? '5. Bases da Divergência' : '5. Bases for Divergence';
                case Step.ATO_TEMPLATE:
                    return isPT ? '6. Template (opcional)' : '6. Template (optional)';
                case Step.ELABORAR_ATO:
                    return isPT ? '7. Minuta do Voto Divergente' : '7. Divergent Vote Draft';
                default:
                    return null;
            }
        }

        if (isSpecialFlow) {
            switch (step) {
                case Step.PETICAO_TEMPLATE:
                    return isPT ? '4. Template (opcional)' : '4. Template (optional)';
                case Step.ELABORAR_PETICAO:
                    return isPT ? '5. Minuta da Petição' : '5. Petition Draft';
                default:
                    return null;
            }
        }

        return null;
    };

    const renderSubItems = (step: Step) => {
        const config = STEP_CONFIG[step];
        const isActiveOrCompleted = completedSteps.has(step) || currentStep === step;

        if (config?.sidebarSubItems && isActiveOrCompleted && viewingStep === step && !isDivergentFlow) {
            return (
                <ul className="space-y-1 mt-1 mb-2 border-l-2 border-slate-200 ml-7 list-none" aria-label={language === 'pt-BR' ? "Sub-etapas de análise" : "Analysis sub-steps"}>
                    {config.sidebarSubItems.map((subItem) => (
                        <li key={subItem.id}>
                            <button 
                                type="button"
                                onClick={() => setAnalysisView(subItem.view)}
                                className={`w-full text-left pl-4 py-2 text-sm cursor-pointer hover:text-blue-600 transition-colors ${analysisView === subItem.view ? 'text-blue-700 font-bold bg-blue-50/50' : 'text-slate-600'}`}
                                aria-current={analysisView === subItem.view ? 'page' : undefined}
                            >
                                {subItem.label}
                            </button>
                        </li>
                    ))}
                </ul>
            );
        }
        return null;
    };

    return (
        <>
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-20 md:hidden animate-fade-in"
                    onClick={onToggle}
                    aria-hidden="true"
                />
            )}

            <aside 
                className={`
                    fixed md:static inset-y-0 left-0 z-30 w-72 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out shadow-xl md:shadow-none flex flex-col h-full
                    ${sidebarOpen ? 'translate-x-0 md:ml-0' : '-translate-x-full md:translate-x-0 md:-ml-72'}
                `}
                aria-label={language === 'pt-BR' ? "Menu de Navegação do Fluxo" : "Workflow Navigation Menu"}
            >
                <div className="h-14 flex items-center px-6 border-b border-slate-200 bg-slate-50 shrink-0">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        {UI.workflow}
                    </h2>
                </div>
                
                <div className="flex-1 overflow-y-auto py-4">
                    <nav>
                        <ul className="space-y-1 list-none">
                            {steps.map((step) => {
                                const isCompleted = completedSteps.has(step);
                                const isActive = currentStep === step;
                                const isViewing = viewingStep === step;
                                const forceEnable = (step === Step.ATO_TIPO || step === Step.PETICAO_TIPO) && isCompleted; 
                                const config = STEP_CONFIG[step];
                                const data = stepData[step];
                                
                                let title = data?.title || config?.title || '';

                                const override = getTitleOverride(step, language);
                                if (override) {
                                    title = override;
                                } else if (data?.title) {
                                    title = data.title;
                                }

                                return (
                                    <div key={step}>
                                        <StepItem 
                                            title={title}
                                            isCompleted={isCompleted}
                                            isActive={isActive}
                                            isViewing={isViewing}
                                            onClick={() => handleStepClick(step)}
                                            forceEnable={forceEnable}
                                            isPending={isPending}
                                            language={language}
                                        />
                                        {renderSubItems(step)}
                                    </div>
                                );
                            })}
                        </ul>
                    </nav>
                </div>
                
                <div className="p-4 border-t border-slate-200 text-xs text-slate-400 text-center bg-slate-50 shrink-0">
                    Dju App v1.0
                </div>
            </aside>
        </>
    );
};
