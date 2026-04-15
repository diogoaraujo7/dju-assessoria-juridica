
import { useEffect, RefObject } from 'react';
import { Step, StepData, StepType, AnalysisView } from '../types';

export const useSmartScroll = (
    scrollContainerRef: RefObject<HTMLDivElement>,
    viewingStep: Step,
    currentStepData: StepData | null,
    analysisView?: AnalysisView
) => {
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [viewingStep, currentStepData?.stepType, analysisView, scrollContainerRef]);

    useEffect(() => {
        const shouldScrollToBottom =
            ((viewingStep === Step.ATO_ANALISE_PROCESSUAL || viewingStep === Step.PETICAO_ANALISE) && currentStepData?.input?.text?.startsWith('1.')) ||
            (viewingStep === Step.ELABORAR_ATO && currentStepData?.stepType === StepType.DOCUMENT && currentStepData.isGeneratingEmenta);

        if (shouldScrollToBottom) {
            const timer = setTimeout(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTo({
                        top: scrollContainerRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [currentStepData, viewingStep, scrollContainerRef]);
};
