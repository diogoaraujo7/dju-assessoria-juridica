
import React, { useMemo } from 'react';
import {
  Step, Task, Language,
  ChoiceThenInputStepData, ArgumentSuggestionStepData, StepType, isSpecialPetition, isDivergent, AnalysisView, AnalysisViewMode, UserAction
} from '../../types';
import { AnalysisSummaryAndMenuView } from './AnalysisSummaryAndMenuView';
import { ArgumentSuggestionContent } from './ArgumentSuggestionContent';
import { AnalysisPointsView } from './AnalysisPointsView';
import { MarkdownRenderer } from '../MarkdownRenderer';

interface AnalysisStepContentProps {
  data: ChoiceThenInputStepData | ArgumentSuggestionStepData;
  viewingStep: Step;
  task: Task | null;
  atoType: string | null;
  petitionType: string | null;
  representedParty: string | null;
  analysisView: AnalysisView;
  isLoading: boolean;
  loadingMenuItem: string | null;
  language: Language;
  sidebarOpen: boolean;
  onUserSubmit: (input: { text: string; files?: File[] | undefined; actionId?: string }) => Promise<void>;
  handleComplementaryMenuAction: (item: string) => Promise<void>;
  handleGoogleSearchForBases: (point: string, forceModel?: string | undefined) => Promise<void>;
  handleRetry: (modelOverride?: string | undefined) => Promise<void>;
  setAnalysisView: (view: AnalysisView) => void;
  handleResetBasesChoice: (step: Step) => void;
  scrollToTop?: () => void;
}

export const AnalysisStepContent: React.FC<AnalysisStepContentProps> = (props) => {
    const { 
        data, viewingStep, task, atoType, petitionType, representedParty, analysisView,
        isLoading, loadingMenuItem, language,
        onUserSubmit,
        handleComplementaryMenuAction, handleGoogleSearchForBases, handleRetry,
        setAnalysisView, handleResetBasesChoice, scrollToTop, sidebarOpen
    } = props;
    
    const typeForFlow = task === Task.PETICAO ? petitionType : atoType;
    const isDivergentFlow = isDivergent(atoType) && viewingStep === Step.ATO_ANALISE_PROCESSUAL;

    const isSpecialFlow = !!(typeForFlow && isSpecialPetition(typeForFlow));

    const formattedPointsContent = useMemo(() => {
        if (!data.content) return '';
        const unescaped = data.content.replace(/\\n/g, '\n');
        return unescaped.replace(/([^\n])\n([^\n])/g, '$1\n\n$2');
    }, [data.content]);

    if (analysisView === AnalysisViewMode.SUMMARY_AND_MENU && !isDivergentFlow) {
        return (
            <AnalysisSummaryAndMenuView 
                data={data as ChoiceThenInputStepData} 
                isLoading={isLoading} 
                loadingMenuItem={loadingMenuItem}
                language={language} 
                setAnalysisView={setAnalysisView} 
                onAction={handleComplementaryMenuAction}
                onRetry={() => handleRetry()}
            />
        );
    }

    if (data.stepType === StepType.ARGUMENT_SUGGESTION) {
        return <ArgumentSuggestionContent 
            data={data}
            onConfirm={(selected, files) => onUserSubmit({ text: selected, files })} 
            onGoogleSearchForBases={handleGoogleSearchForBases}
            isDivergentFlow={isDivergentFlow}
            sidebarOpen={sidebarOpen}
            language={language}
            scrollToTop={scrollToTop}
            onRegenerate={() => onUserSubmit({ actionId: UserAction.GENERATE_SUGGESTIONS, text: data.input?.text || '' })}
        />;
    }

    const BackButton = () => (
        <button 
            onClick={() => setAnalysisView(AnalysisViewMode.SUMMARY_AND_MENU)} 
            className="text-sm font-medium text-blue-600 hover:text-blue-800 mb-6 flex items-center gap-2 group"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-1"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
            {language === 'pt-BR' ? 'Voltar à Análise Processual' : 'Back to Case Analysis'}
        </button>
    );

    const hasSelected = !!data.input && data.input.actionId !== UserAction.SELECT_PARTY;

    const pointsTitle = (!isDivergentFlow)
        ? (language === 'pt-BR' ? 'b. Pontos Controvertidos' : 'b. Controversial Points')
        : (language === 'pt-BR' ? 'Pontos Controvertidos' : 'Controversial Points');

    return (
        <div className="animate-fade-in">
            {!isDivergentFlow && <BackButton />}
            <h3 className="text-xl font-bold text-slate-800 mb-4">{pointsTitle}</h3>
            
            {((!hasSelected && isSpecialFlow) || isDivergentFlow) && (
                <div className="p-4 bg-slate-100 rounded-lg border border-slate-200 mb-6 prose prose-slate max-w-none prose-p:my-2 prose-ul:my-2 prose-a:text-blue-600 hover:prose-a:underline">
                    <MarkdownRenderer>{formattedPointsContent}</MarkdownRenderer>
                </div>
            )}

            <AnalysisPointsView 
                data={data as ChoiceThenInputStepData}
                representedParty={representedParty}
                isLoading={isLoading}
                language={language}
                isDivergentFlow={isDivergentFlow}
                hasSelected={hasSelected}
                onUserSubmit={onUserSubmit}
                handleResetBasesChoice={() => handleResetBasesChoice(viewingStep)}
                isSpecialFlow={isSpecialFlow}
            />
        </div>
    );
};
