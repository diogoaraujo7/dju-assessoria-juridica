import React, { useState, useEffect, useCallback } from 'react';
import { useWorkflowConfig, useWorkflowData, useWorkflowDispatch } from '../context/WorkflowContext';
import { useGeminiState } from '../context/GeminiContext';
import { Step } from '../types';
import { getStepConfig } from '../stepConfig';
import { BotIcon } from './Icons';
import { MessageSquare, FileText, Check, X } from 'lucide-react';
import { UniversalInput } from './content/UniversalInput';
import { DocumentContent } from './content/DocumentContent';
import { ChatContent } from './content/ChatContent';

export const ChatEditLayout: React.FC = () => {
    const { language, viewingStep, currentStep, atoType } = useWorkflowConfig();
    const { stepData } = useWorkflowData();
    const { isLoading, loadingStep } = useGeminiState();
    const { handleUserSubmit, handleUpdateStepData } = useWorkflowDispatch();
    
    const [editedContent, setEditedContent] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'chat' | 'editor'>('editor');
    const [editorKey, setEditorKey] = useState(0);

    const handleContentChange = useCallback((newContent: string) => {
        setEditedContent(newContent);
    }, []);
    
    const data = stepData[Step.EDITOR_EDITAR_TEXTO];
    const chatData = stepData[Step.EDITOR_CHAT_LIVRE];
    const pendingEditData = stepData[Step.EDITOR_PENDING_EDIT];

    const hasPendingEdit = Boolean(pendingEditData && pendingEditData.content && !isLoading);
    const displayData = hasPendingEdit ? pendingEditData : data;

    const stepConfig = getStepConfig(language, atoType)[currentStep];
    const suggestionButtons = stepConfig?.suggestionButtons;

    const isCurrentStep = currentStep === viewingStep;
    
    const isChatLoading = isLoading && loadingStep === Step.EDITOR_CHAT_LIVRE;
    const isEditorLoading = isLoading && (loadingStep === Step.EDITOR_EDITAR_TEXTO || loadingStep === Step.EDITOR_PENDING_EDIT);

    useEffect(() => {
        setEditedContent(null);
    }, [displayData?.content]);

    const handleChatSubmit = useCallback((input: { text: string; files?: File[]; actionId?: string }) => {
        handleUserSubmit({
            ...input,
            currentEditorContent: editedContent ?? data?.content ?? ''
        });
    }, [handleUserSubmit, editedContent, data?.content]);

    const handleApplyPendingEdit = () => {
        if (pendingEditData?.content) {
            const editStep = Step.EDITOR_EDITAR_TEXTO;
            const pendingStep = Step.EDITOR_PENDING_EDIT;
            const chatStep = Step.EDITOR_CHAT_LIVRE;

            handleUpdateStepData(editStep, { content: pendingEditData.content });
            handleUpdateStepData(pendingStep, { content: '' });
            setEditedContent(null);
            setEditorKey(k => k + 1);
            
            const currentChatContent = chatData?.content || '';
            handleUpdateStepData(chatStep, { 
                content: currentChatContent + `**Você:**\n${language === 'pt-BR' ? 'Aplicar alterações.' : 'Apply changes.'}\n\n---\n\n**Dju Assessoria Jurídica:**\n${language === 'pt-BR' ? 'Alterações aplicadas com sucesso.' : 'Changes applied successfully.'}\n\n---\n\n` 
            });
        }
    };

    const handleDiscardPendingEdit = () => {
        const pendingStep = Step.EDITOR_PENDING_EDIT;
        const chatStep = Step.EDITOR_CHAT_LIVRE;

        handleUpdateStepData(pendingStep, { content: '' });
        setEditedContent(null);
        setEditorKey(k => k + 1);
        
        const currentChatContent = chatData?.content || '';
        handleUpdateStepData(chatStep, { 
            content: currentChatContent + `**Você:**\n${language === 'pt-BR' ? 'Descartar alterações.' : 'Discard changes.'}\n\n---\n\n**Dju Assessoria Jurídica:**\n${language === 'pt-BR' ? 'Alterações descartadas. O texto original foi mantido.' : 'Changes discarded. Original text kept.'}\n\n---\n\n` 
        });
    };

    return (
        <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden animate-fade-in bg-slate-50 relative">
            {/* Tab Switcher (Hidden on large screens where both panes are visible) */}
            <div className="flex border-b border-slate-200 bg-white shrink-0 z-30 lg:hidden">
                <button 
                    onClick={() => setActiveTab('editor')}
                    className={`flex-1 lg:flex-none lg:px-8 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-all ${activeTab === 'editor' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                    <FileText size={18} />
                    {language === 'pt-BR' ? 'Editor' : 'Editor'}
                </button>
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 lg:flex-none lg:px-8 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-all ${activeTab === 'chat' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                    <MessageSquare size={18} />
                    {language === 'pt-BR' ? 'Chat' : 'Chat'}
                </button>
            </div>

            {/* Left Pane: Chat */}
            <div className={`${activeTab === 'chat' ? 'flex' : 'hidden lg:flex'} lg:w-1/3 lg:min-w-[350px] lg:max-w-[450px] border-r border-slate-200 bg-slate-50 flex-col h-full overflow-hidden`}>
                <div className="p-4 border-b border-slate-200 bg-white shadow-sm z-10">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <MessageSquare size={18} className="text-blue-600" />
                        {language === 'pt-BR' ? 'Chat do Editor' : 'Editor Chat'}
                    </h2>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col">
                    {chatData ? (
                        <ChatContent 
                            data={chatData as any}
                            isLoading={isChatLoading}
                            language={language}
                            onUserSubmit={handleChatSubmit}
                            className="flex flex-col h-full overflow-hidden"
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 p-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                                <BotIcon />
                            </div>
                            <p className="italic text-center text-sm">
                                {language === 'pt-BR' ? 'Envie uma mensagem para ajustar o texto ao lado.' : 'Send a message to adjust the text on the right.'}
                            </p>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                    {suggestionButtons && suggestionButtons.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {suggestionButtons.map((btn: any, idx: number) => {
                                const label = typeof btn === 'string' ? btn : btn.label;
                                const prompt = typeof btn === 'string' ? btn : btn.promptText;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleChatSubmit({ text: prompt })}
                                        disabled={isLoading}
                                        className="text-xs font-medium px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50"
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    <UniversalInput
                        onSubmit={handleChatSubmit}
                        isLoading={isLoading}
                        isStepActive={isCurrentStep}
                        showProceedButton={false}
                        language={language}
                        disabled={hasPendingEdit}
                        disabledPlaceholder={language === 'pt-BR' ? 'Aguardando confirmação no editor...' : 'Waiting for confirmation in editor...'}
                    />
                </div>
            </div>

            {/* Right Pane: Editor */}
            <div className={`${activeTab === 'editor' ? 'flex' : 'hidden'} lg:flex flex-1 flex-col bg-white overflow-hidden h-full relative`}>
                <div className="flex-1 overflow-y-auto">
                    {displayData ? (
                        <div className="w-full">
                            <DocumentContent 
                                data={displayData as any}
                                isLoading={isEditorLoading}
                                language={language}
                                onUserSubmit={handleChatSubmit}
                                viewingStep={viewingStep}
                                isEditable={true}
                                isReadOnly={hasPendingEdit}
                                onContentChange={handleContentChange}
                                editorKey={`${viewingStep}-${editorKey}`}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            Carregando editor...
                        </div>
                    )}
                </div>
            </div>
            
            {/* Pending Edit Overlay */}
            {hasPendingEdit && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-lg">
                    <div className="bg-white rounded-2xl shadow-2xl p-4 animate-fade-in-up border border-blue-100 ring-1 ring-black/5 flex flex-col sm:flex-row items-center gap-4 justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-full shrink-0 text-blue-600">
                                <BotIcon />
                            </div>
                            <p className="text-sm font-medium text-slate-700">
                                {language === 'pt-BR' 
                                    ? 'Nova versão gerada. Deseja aplicar?' 
                                    : 'New version generated. Apply changes?'}
                            </p>
                        </div>
                        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                            <button
                                onClick={handleDiscardPendingEdit}
                                className="flex-1 sm:flex-none px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <X size={16} />
                                {language === 'pt-BR' ? 'Descartar' : 'Discard'}
                            </button>
                            <button
                                onClick={handleApplyPendingEdit}
                                className="flex-1 sm:flex-none px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                            >
                                <Check size={16} />
                                {language === 'pt-BR' ? 'Aplicar' : 'Apply'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
