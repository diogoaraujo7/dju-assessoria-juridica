
import { Chat, Part } from '@google/genai';
import { Step, StepData, Task, StepType, DocumentStepData, WorkflowInput, AnalysisViewMode } from '../types';
import { Action, WorkflowState } from '../context/WorkflowContext';
import { GeminiAction, GeminiState } from '../context/GeminiContext';
import { UIAction } from '../context/UIContext';
import { processStream, createChatSession, generateStructuredContent, performGoogleSearch } from './geminiService';
import { getStepConfig } from '../stepConfig';
import { getUI } from '../ui';
import { getPrompts, getSystemPrompt } from '../prompts/index';
import { getWorkflowHandler } from './WorkflowRegistry';
import { executeWorkflowAction } from '../services/workflowStepExecutor';
import { EventEmitter } from './EventEmitter';
import { GeminiError, GeminiErrorCode } from '../types/errors';
import { fileToGenerativePart } from '../utils/fileUtils';

export type EngineEvent = 
    | { type: 'workflow'; action: Action }
    | { type: 'gemini'; action: GeminiAction }
    | { type: 'ui'; action: UIAction };

interface ExecuteStepParams {
    chat: Chat | null;
    prompt: string | Part[];
    nextStep: Step;
    targetStep?: Step;
    stepDataToAdd: Partial<Record<Step, StepData>>;
    failedRequest: { prompt: string | Part[]; step: Step; isEmenta?: boolean; complementaryItem?: string } | null;
    handleFailure: (retryFn: () => void, stepToUpdate: Step, error?: GeminiError, originalPrompt?: string | Part[]) => void;
    onComplete?: () => void;
    initialContent?: string;
}

interface EngineContext {
    state: WorkflowState;
    geminiState: GeminiState;
}

export class WorkflowEngine extends EventEmitter<EngineEvent> {
    private streamBuffer: string = '';
    private lastUpdateTimestamp: number = 0;
    private readonly UPDATE_INTERVAL_MS = 80;

    private async emitLoadingComplete() {
        await new Promise(resolve => setTimeout(resolve, 50));
        this.emit({ type: 'gemini', action: { type: 'SET_LOADING', payload: false } });
    }

    private clearState() {
        this.streamBuffer = '';
        this.lastUpdateTimestamp = 0;
    }

    public async executeStep({
        chat,
        prompt,
        nextStep,
        targetStep,
        stepDataToAdd,
        handleFailure,
        onComplete,
        initialContent = ''
    }: ExecuteStepParams): Promise<void> {
        if (!chat) {
            console.error("Chat instance is null in WorkflowEngine");
            if (onComplete) onComplete();
            return;
        }

        const streamTarget = targetStep || nextStep;

        this.emit({ type: 'workflow', action: { type: 'ADVANCE_STEP', payload: { nextStep, stepDataToAdd } } });
        this.emit({ type: 'gemini', action: { type: 'SET_LOADING_STEP', payload: streamTarget } });

        this.streamBuffer = initialContent;
        this.lastUpdateTimestamp = Date.now();

        await processStream(
            chat,
            prompt,
            (chunkText) => {
                this.streamBuffer = initialContent + chunkText;
                this.tryFlushBuffer(streamTarget);
            },
            (finalGroundingMetadata) => {
                if (finalGroundingMetadata && finalGroundingMetadata.groundingChunks) {
                    const validSources = finalGroundingMetadata.groundingChunks.filter((c: any) => c.web && c.web.uri);
                    if (validSources.length > 0) {
                        this.streamBuffer += `\n\n[SOURCES: ${JSON.stringify(validSources)}]`;
                    }
                }
                this.flushBuffer(streamTarget);
                this.clearState();
                this.emit({ type: 'gemini', action: { type: 'SET_LOADING_STEP', payload: null } });
                if (onComplete) onComplete();
            },
            (retryFn, error) => {
                this.clearState();
                this.emit({ type: 'gemini', action: { type: 'SET_LOADING_STEP', payload: null } });
                handleFailure(retryFn, streamTarget, error, prompt);
            }
        );
    }

    private tryFlushBuffer(step: Step) {
        const now = Date.now();
        if (now - this.lastUpdateTimestamp > this.UPDATE_INTERVAL_MS) {
            this.flushBuffer(step);
        }
    }

    private flushBuffer(step: Step) {
        if (!this.streamBuffer) return;
        this.emit({ type: 'workflow', action: { type: 'UPDATE_STEP_DATA', payload: { step: step, data: { content: this.streamBuffer } } } });
        this.lastUpdateTimestamp = Date.now();
    }

    public async startTask(task: Task, model: string, ctx: EngineContext) {
        const { state } = ctx;
        
        this.clearState();
        this.emit({ type: 'gemini', action: { type: 'SET_LOADING', payload: true } });
        if (typeof window !== 'undefined' && window.innerWidth < 768) { 
            this.emit({ type: 'ui', action: { type: 'SET_SIDEBAR_OPEN', payload: false } });
        }

        try {
            const tools = (task === Task.REVISOR || task === Task.EDITOR) ? [{ googleSearch: {} }] : undefined;
            const newChat = createChatSession(model, getSystemPrompt(state.language, task), undefined, tools);
            
            const STEP_CONFIG = getStepConfig(state.language, state.atoType);
            const UI = getUI(state.language);
            
            let nextStep: Step; 
            const taskSelectionData = { ...STEP_CONFIG[Step.TASK_SELECTION], input: { text: task }, content: '' } as StepData;
            let nextStepInitialContent = '';

            switch (task) {
                case Task.ATO_DECISORIO: 
                    nextStep = Step.ATO_TIPO; 
                    nextStepInitialContent = UI.initialScreen.selectTask; 
                    break;
                case Task.TEMPLATE: 
                    nextStep = Step.TEMPLATE_TIPO_DE_ATO; 
                    nextStepInitialContent = UI.initialScreen.selectTask;
                    break;
                case Task.EMENTA: 
                    nextStep = Step.EMENTA_UPLOAD; 
                    break;
                case Task.PETICAO: 
                    nextStep = Step.PETICAO_TIPO; 
                    nextStepInitialContent = UI.initialScreen.selectTask;
                    break;
                case Task.REVISOR: 
                    nextStep = Step.REVISOR_UPLOAD_LINHA_BASE;
                    break;
                case Task.EDITOR:
                    nextStep = Step.EDITOR_EDITAR_TEXTO;
                    break;
                default: throw new Error("Task not recognized");
            }

            const initialStepData: Partial<Record<Step, StepData>> = {
                [Step.TASK_SELECTION]: taskSelectionData,
                [nextStep]: { 
                    ...STEP_CONFIG[nextStep], 
                    content: nextStepInitialContent || (task === Task.REVISOR ? (state.language === 'pt-BR' ? 'Para elaborar o Relatório, primeiramente, apresente os documentos que servem como **Linha de Base** para a análise. Por exemplo: para revisar uma Sentença, anexe as peças processuais anteriores (petição inicial, contestação, réplica…), ou seja, aqueles documentos que contém as informações do processo.' : 'To prepare the Report, first, present the documents that serve as the Baseline for the analysis. For example: to review a Court Decision, attach the prior procedural documents (initial petition, defense, reply...), that is, those documents that contain the case information.') : ''), 
                    input: null 
                } as StepData
            };

            if (task === Task.EDITOR) {
                const ui = getUI(state.language);
                const initialChatMessage = ui.initialScreen.editorInitialGreeting;
                initialStepData[Step.EDITOR_CHAT_LIVRE] = { ...(STEP_CONFIG[Step.EDITOR_CHAT_LIVRE] as StepData), content: initialChatMessage, input: null };
            }

            this.emit({ type: 'workflow', action: { type: 'START_TASK', payload: { task, nextStep, initialStepData } } });
            this.emit({ type: 'gemini', action: { type: 'SET_CHAT_SESSION', payload: { chat: newChat, model } } });
            this.emit({ type: 'ui', action: { type: 'SET_ANALYSIS_VIEW', payload: AnalysisViewMode.SUMMARY_AND_MENU } });
            await this.emitLoadingComplete();

        } catch (error) {
            console.error("Error starting task:", error);
            await this.emitLoadingComplete();
            alert("Falha ao iniciar o assistente. " + (error instanceof Error ? error.message : ""));
        }
    }

    public async switchModel(model: string, ctx: EngineContext, forceRecreate: boolean = false) {
        const { state, geminiState } = ctx;
        if (geminiState.model === model && !forceRecreate) return;
        
        this.emit({ type: 'gemini', action: { type: 'SET_LOADING', payload: true } });
        
        try {
            const systemInstruction = getSystemPrompt(state.language, state.task || undefined);
            const history = geminiState.chat ? await geminiState.chat.getHistory() : [];
            const tools = (state.task === Task.REVISOR || state.task === Task.EDITOR) ? [{ googleSearch: {} }] : undefined;
            const newChat = createChatSession(model, systemInstruction, history, tools);
            
            this.emit({ type: 'gemini', action: { type: 'SET_CHAT_SESSION', payload: { chat: newChat, model } } });
            await this.emitLoadingComplete();
        } catch (error) {
            console.error("Error switching model:", error);
            await this.emitLoadingComplete();
        }
    }

    public async submitUserAction(input: WorkflowInput, ctx: EngineContext) {
        const { state } = ctx;
        if (!ctx.geminiState.chat && state.task !== Task.PETICAO) return;
        
        this.emit({ type: 'gemini', action: { type: 'SET_LOADING', payload: true } });
        this.emit({ type: 'gemini', action: { type: 'SET_FAILED_REQUEST', payload: null } });

        this.emit({ type: 'workflow', action: { type: 'UPDATE_STEP_DATA', payload: { step: state.currentStep, data: { input: { text: input.text, files: input.files?.map(f => f.name), actionId: input.actionId, lengthValue: input.lengthValue, toneValue: input.toneValue } } } } });
        this.emit({ type: 'workflow', action: { type: 'ADD_COMPLETED_STEP', payload: state.currentStep } });

        const handler = getWorkflowHandler(state.task);
        
        const dispatchProxy = (action: Action) => {
            this.emit({ type: 'workflow', action });
        };

        const workflowProps = {
            state: ctx.state,
            gemini: ctx.geminiState,
            dispatch: dispatchProxy,
            engine: this,
            handleFailure: (retryFn: () => void, stepToUpdate: Step, error?: GeminiError, originalPrompt?: string | Part[], schema?: any) => 
                this.handleFailure(retryFn, stepToUpdate, ctx, error, originalPrompt, schema),
            generateSuggestions: (promptAndSchema: { prompt: string | Part[], schema: any }, stepToUpdate: Step) => 
                this.generateSuggestions(promptAndSchema, stepToUpdate, ctx),
            handleConfirmationStep: (isConfirmed: boolean, nextTemplateStep: Step, previousAnalysisStep: Step) => 
                this.handleConfirmationStep(isConfirmed, nextTemplateStep, previousAnalysisStep, ctx),
            onProcessComplete: () => this.emitLoadingComplete()
        };

        if (handler) {
            await handler(workflowProps, input);
        } else {
            await this.emitLoadingComplete();
        }
    }

    public async retryStep(modelOverride: string | undefined, ctx: EngineContext) {
        const { state, geminiState } = ctx;
        let stepToRetry: Step | undefined;
        let lastRequest: string | Part[] | { prompt: string | Part[]; schema: any; } | undefined;

        if (geminiState.failedRequest) {
            stepToRetry = geminiState.failedRequest.step;
            lastRequest = geminiState.failedRequest.schema 
                ? { prompt: geminiState.failedRequest.prompt, schema: geminiState.failedRequest.schema } 
                : geminiState.failedRequest.prompt;
        } else {
            stepToRetry = state.currentStep;
            lastRequest = state.stepData[stepToRetry]?.lastPrompt;
        }

        if (!stepToRetry || !lastRequest) return;

        const stepDataForRetry = state.stepData[stepToRetry];
        this.emit({ type: 'gemini', action: { type: 'SET_LOADING', payload: true } });
        this.emit({ type: 'gemini', action: { type: 'SET_FAILED_REQUEST', payload: null } });
        this.emit({ type: 'workflow', action: { type: 'UPDATE_STEP_DATA', payload: { step: stepToRetry, data: { content: '', suggestions: null } } } });

        const modelToUse = modelOverride || geminiState.model!;
        
        let prompt: string | Part[];
        let schema: any = null;

        if (typeof lastRequest === 'object' && 'prompt' in lastRequest && 'schema' in lastRequest) {
            prompt = lastRequest.prompt as (string | Part[]);
            schema = lastRequest.schema;
        } else {
            prompt = lastRequest as (string | Part[]);
        }

        const isJsonRequest = !!schema;
        const isEmentaRetry = geminiState.failedRequest?.isEmenta || (stepToRetry === Step.ELABORAR_ATO && stepDataForRetry?.stepType === StepType.DOCUMENT && (stepDataForRetry as DocumentStepData).isGeneratingEmenta);
        const isComplementaryRetry = !!geminiState.failedRequest?.complementaryItem;

        if (geminiState.chat && !isEmentaRetry && !isComplementaryRetry) {
            const chatHistory = await geminiState.chat.getHistory();
            let newHistory = chatHistory;
            
            if (!geminiState.failedRequest && chatHistory.length >= 2) {
                const lastMsg = chatHistory[chatHistory.length - 1];
                const prevMsg = chatHistory[chatHistory.length - 2];
                if (lastMsg.role === 'model' && prevMsg.role === 'user') {
                    newHistory = chatHistory.slice(0, -2);
                }
            }

            const systemInstruction = getSystemPrompt(state.language, state.task || undefined);
            const tools = (state.task === Task.REVISOR || state.task === Task.EDITOR) ? [{ googleSearch: {} }] : undefined;
            const newChat = createChatSession(modelToUse, systemInstruction, newHistory, tools);
            this.emit({ type: 'gemini', action: { type: 'SET_CHAT_SESSION', payload: { chat: newChat, model: modelToUse } } });
        }

        const promptFactoryResult = {
            contents: Array.isArray(prompt) ? prompt : [{ text: prompt as string }],
            schema: schema
        };

        const dispatchProxy = (action: Action) => {
            this.emit({ type: 'workflow', action });
        };

        if (isJsonRequest) {
            const hookProps = {
                state, gemini: { ...geminiState, model: modelToUse }, dispatch: dispatchProxy, engine: this,
                handleFailure: (r: () => void, s: Step, err?: GeminiError, p?: string | Part[], sch?: any) => this.handleFailure(r, s, ctx, err, p, sch),
                generateSuggestions: (p: any, s: Step) => this.generateSuggestions(p, s, ctx),
                handleConfirmationStep: (c: boolean, n: Step, p: Step) => this.handleConfirmationStep(c, n, p, ctx),
                onProcessComplete: () => this.emitLoadingComplete()
            };
            await executeWorkflowAction(hookProps, { promptFactoryResult, nextStep: stepToRetry! });
        } else {
            if (isEmentaRetry) {
                this.generateEmenta(ctx);
            } else if (isComplementaryRetry) {
                this.runComplementaryAction(geminiState.failedRequest!.complementaryItem!, ctx);
            } else {
                if (stepToRetry === Step.ELABORAR_ATO) {
                     this.emit({ type: 'workflow', action: { type: 'UPDATE_STEP_DATA', payload: { step: stepToRetry, data: { ementaContent: '', isGeneratingEmenta: false } } } });
                }

                await this.executeStep({
                    chat: geminiState.chat, prompt, nextStep: stepToRetry!, stepDataToAdd: {}, failedRequest: null,
                    handleFailure: (r, s, e, p) => this.handleFailure(r, s, ctx, e, p),
                    onComplete: () => this.emitLoadingComplete()
                });
            }
        }
    }

    public async rewriteWithInstruction(instruction: string, ctx: EngineContext, files?: File[]) {
        const { state, geminiState } = ctx;
        const stepToRetry = state.currentStep;
        const lastRequest = state.stepData[stepToRetry]?.lastPrompt;

        if (!stepToRetry || !lastRequest) return;

        this.emit({ type: 'gemini', action: { type: 'SET_LOADING', payload: true } });
        this.emit({ type: 'gemini', action: { type: 'SET_FAILED_REQUEST', payload: null } });
        this.emit({ type: 'workflow', action: { type: 'UPDATE_STEP_DATA', payload: { step: stepToRetry, data: { content: '', suggestions: null } } } });

        const modelToUse = geminiState.model!;
        
        let prompt: string | Part[];
        let schema: any = null;

        if (typeof lastRequest === 'object' && 'prompt' in lastRequest && 'schema' in lastRequest) {
            prompt = lastRequest.prompt as (string | Part[]);
            schema = lastRequest.schema;
        } else {
            prompt = lastRequest as (string | Part[]);
        }

        const isJsonRequest = !!schema;
        const isEmentaRetry = geminiState.failedRequest?.isEmenta || (stepToRetry === Step.ELABORAR_ATO && state.stepData[stepToRetry]?.stepType === StepType.DOCUMENT && (state.stepData[stepToRetry] as DocumentStepData).isGeneratingEmenta);

        if (geminiState.chat && !isEmentaRetry) {
            const chatHistory = await geminiState.chat.getHistory();
            let newHistory = chatHistory;
            
            if (!geminiState.failedRequest && chatHistory.length >= 2) {
                const lastMsg = chatHistory[chatHistory.length - 1];
                const prevMsg = chatHistory[chatHistory.length - 2];
                if (lastMsg.role === 'model' && prevMsg.role === 'user') {
                    newHistory = chatHistory.slice(0, -2);
                }
            }

            const systemInstruction = getSystemPrompt(state.language, state.task || undefined);
            const tools = (state.task === Task.REVISOR || state.task === Task.EDITOR) ? [{ googleSearch: {} }] : undefined;
            const newChat = createChatSession(modelToUse, systemInstruction, newHistory, tools);
            this.emit({ type: 'gemini', action: { type: 'SET_CHAT_SESSION', payload: { chat: newChat, model: modelToUse } } });
        }

        let instructionText = `\n\n[INSTRUÇÃO DO USUÁRIO PARA REESCRITA]: Por favor, reescreva o documento seguindo esta nova diretriz: ${instruction}`;
        
        let newPromptParts: Part[] = [];
        if (Array.isArray(prompt)) {
            newPromptParts = [...prompt];
        } else {
            newPromptParts = [{ text: prompt as string }];
        }

        if (files && files.length > 0) {
            const fileParts = await Promise.all(files.map(fileToGenerativePart));
            newPromptParts.push(...fileParts);
        }
        
        newPromptParts.push({ text: instructionText });
        prompt = newPromptParts;

        const promptFactoryResult = {
            contents: prompt,
            schema: schema
        };

        const dispatchProxy = (action: Action) => {
            this.emit({ type: 'workflow', action });
        };

        if (isJsonRequest) {
            const hookProps = {
                state, gemini: { ...geminiState, model: modelToUse }, dispatch: dispatchProxy, engine: this,
                handleFailure: (r: () => void, s: Step, err?: GeminiError, p?: string | Part[], sch?: any) => this.handleFailure(r, s, ctx, err, p, sch),
                generateSuggestions: (p: any, s: Step) => this.generateSuggestions(p, s, ctx),
                handleConfirmationStep: (c: boolean, n: Step, p: Step) => this.handleConfirmationStep(c, n, p, ctx),
                onProcessComplete: () => this.emitLoadingComplete()
            };
            await executeWorkflowAction(hookProps, { promptFactoryResult, nextStep: stepToRetry! });
        } else {
            if (isEmentaRetry) {
                this.generateEmenta(ctx, instruction);
            } else {
                if (stepToRetry === Step.ELABORAR_ATO) {
                     this.emit({ type: 'workflow', action: { type: 'UPDATE_STEP_DATA', payload: { step: stepToRetry, data: { ementaContent: '', isGeneratingEmenta: false } } } });
                }

                await this.executeStep({
                    chat: geminiState.chat, prompt, nextStep: stepToRetry!, stepDataToAdd: {}, failedRequest: null,
                    handleFailure: (r, s, e, p) => this.handleFailure(r, s, ctx, e, p),
                    onComplete: () => this.emitLoadingComplete()
                });
            }
        }
    }

    public async continueGeneration(ctx: EngineContext) {
        const { state, geminiState } = ctx;
        const UI = getUI(state.language);
        const PROMPTS = getPrompts(state.language);
        const failedReq = geminiState.failedRequest;
        if (!failedReq) return;

        const stepToContinue = failedReq.step;
        const currentContent = state.stepData[stepToContinue]?.content || '';
        const cleanContent = currentContent.replace(UI.actions.overloadTitle, '').replace(UI.actions.quotaExceededTitle, '').replace(UI.actions.tokenLimitTitle, '').replace(UI.actions.fileSizeLimitTitle, '').trim();
        
        if (!cleanContent) {
            this.retryStep(undefined, ctx);
            return;
        }

        const lastChunk = cleanContent.slice(-400);
        const result = await PROMPTS.continuarGeracao(lastChunk);
        const continuationPrompt = result.contents;

        this.emit({ type: 'gemini', action: { type: 'SET_LOADING', payload: true } });
        this.emit({ type: 'gemini', action: { type: 'SET_FAILED_REQUEST', payload: null } });
        
        this.emit({ type: 'workflow', action: { type: 'UPDATE_STEP_DATA', payload: { step: stepToContinue, data: { content: cleanContent } } } });

        await this.executeStep({
            chat: geminiState.chat,
            prompt: continuationPrompt,
            nextStep: stepToContinue,
            stepDataToAdd: {},
            failedRequest: failedReq,
            handleFailure: (r, s, e, p) => this.handleFailure(r, s, ctx, e, p),
            onComplete: () => this.emitLoadingComplete(),
            initialContent: cleanContent
        });
    }

    public async performSearch(point: string, forceModel: string | undefined, ctx: EngineContext) {
        const { state } = ctx;
        const PROMPTS = getPrompts(state.language);
        const pointKey = point;
        
        const stepToUpdate = state.task === Task.PETICAO ? Step.PETICAO_ANALISE : Step.ATO_ANALISE_PROCESSUAL;

        this.emit({ type: 'workflow', action: { type: 'UPDATE_GOOGLE_SEARCH_STATUS', payload: { pointKey, isSearching: true, stepToUpdate } } });
        
        let contextInstruction = "";
        if (state.task === Task.PETICAO) {
            const petitionType = state.stepData[Step.PETICAO_TIPO]?.input?.text || "peça processual";
            const representedParty = state.representedParty || "a parte peticionante";
            contextInstruction = `CONTEXTO ESPECÍFICO (FLUXO DE PETIÇÃO): Você está auxiliando na elaboração de uma peça processual do tipo: "${petitionType}". A parte representada é: "${representedParty}". OBJETIVO: Encontrar fundamentos jurídicos e jurisprudência que beneficiem a parte representada nesta peça. DIRETRIZ DE VIÉS: Ao gerar a seção "# ARGUMENTOS", você DEVE selecionar e redigir os argumentos de forma PARCIAL e PERSUASIVA, alinhados ao interesse do peticionante.`;
        } else {
            contextInstruction = `CONTEXTO ESPECÍFICO (ATO DECISÓRIO): Você está auxiliando um jurista. Apresente os argumentos de forma técnica.`;
        }
        const prompt = await PROMPTS.pesquisaGoogle(point, contextInstruction);
        const modelToUse = forceModel || 'models/gemini-3-flash-preview';

        const result = await performGoogleSearch(modelToUse, prompt, getSystemPrompt(state.language, state.task || undefined));
        
        this.emit({ type: 'workflow', action: { type: 'UPDATE_GOOGLE_SEARCH_RESULT', payload: { pointKey, result, stepToUpdate } } });
    }

    public async runComplementaryAction(item: string, ctx: EngineContext) {
        const { geminiState, state } = ctx;
        const PROMPTS = getPrompts(state.language);
        const UI = getUI(state.language);

        if (!geminiState.chat) return;
        this.emit({ type: 'gemini', action: { type: 'SET_LOADING', payload: true } });
        this.emit({ type: 'ui', action: { type: 'SET_LOADING_MENU_ITEM', payload: item } });
        
        const stepToUpdate = state.task === Task.PETICAO ? Step.PETICAO_ANALISE : Step.ATO_ANALISE_PROCESSUAL;
        const dataStep = state.task === Task.PETICAO ? Step.PETICAO_DADOS : Step.ATO_DADOS_PROCESSO;

        let contextText = '';
        let contextFiles: File[] = [];

        if (state.crossStepContext) {
             contextText = state.crossStepContext.textPayload;
             contextFiles = state.crossStepContext.contextFiles || [];
        } 
        
        if (!contextText && state.stepData[dataStep]?.input?.text) {
             contextText = state.stepData[dataStep]!.input!.text;
        }
        
        if (!contextText && state.stepData[stepToUpdate]?.summaryContent) {
             contextText = state.stepData[stepToUpdate]!.summaryContent!;
        }

        const result = await PROMPTS.menuComplementar(item, contextText, contextFiles);
        const prompt = result.contents;
        
        this.emit({ type: 'workflow', action: { type: 'UPDATE_STEP_DATA', payload: { step: stepToUpdate, data: { lastPrompt: prompt } } } });

        let chatToUse = geminiState.chat;
        
        try {
            const history = await geminiState.chat.getHistory();
            const systemInstruction = getSystemPrompt(state.language, state.task || undefined);
            const tools = [{ googleSearch: {} }];
            const modelToUse = geminiState.model || 'models/gemini-3.1-pro-preview';
            chatToUse = createChatSession(modelToUse, systemInstruction, history, tools);
            this.emit({ type: 'gemini', action: { type: 'SET_CHAT_SESSION', payload: { chat: chatToUse, model: modelToUse } } });
        } catch (error) {
            console.error("Error enabling Google Search for complementary action:", error);
            // Fallback to existing chat if there's an error getting history
        }

        processStream(chatToUse, prompt,
            (chunk) => {
                this.emit({ type: 'gemini', action: { type: 'SET_FAILED_REQUEST', payload: null } });
                this.emit({ type: 'workflow', action: { type: 'UPDATE_SUB_RESPONSE', payload: { step: stepToUpdate, item, response: chunk } } });
            },
            async (finalGroundingMetadata) => {
                if (finalGroundingMetadata && finalGroundingMetadata.groundingChunks) {
                    const validSources = finalGroundingMetadata.groundingChunks.filter((c: any) => c.web && c.web.uri);
                    if (validSources.length > 0) {
                        this.emit({ type: 'workflow', action: { type: 'UPDATE_SUB_RESPONSE_SOURCES', payload: { step: stepToUpdate, item, sources: validSources } } });
                    }
                }
                await this.emitLoadingComplete();
                this.emit({ type: 'ui', action: { type: 'SET_LOADING_MENU_ITEM', payload: null } });
            },
            (_retryFn, error) => {
                let errorTitle = UI.actions.overloadTitle;
                if (error?.code === GeminiErrorCode.TOKEN_LIMIT) {
                    errorTitle = UI.actions.tokenLimitTitle;
                } else if (error?.code === GeminiErrorCode.QUOTA_EXCEEDED) {
                    errorTitle = UI.actions.quotaExceededTitle;
                } else if (error?.code === GeminiErrorCode.FILE_SIZE_LIMIT) {
                    errorTitle = UI.actions.fileSizeLimitTitle;
                }
                this.emit({ type: 'workflow', action: { type: 'UPDATE_SUB_RESPONSE', payload: { step: stepToUpdate, item, response: errorTitle } } });
                this.emit({ type: 'gemini', action: { type: 'SET_FAILED_REQUEST', payload: { prompt, step: stepToUpdate, complementaryItem: item } } });
                this.emitLoadingComplete();
                this.emit({ type: 'ui', action: { type: 'SET_LOADING_MENU_ITEM', payload: null } });
            }
        );
    }

    public async generateEmenta(ctx: EngineContext, instruction?: string) {
        const { geminiState, state } = ctx;
        const PROMPTS = getPrompts(state.language);
        const UI = getUI(state.language);

        const modelToUse = geminiState.model || 'models/gemini-3.1-pro-preview';
        const atoContent = state.stepData[Step.ELABORAR_ATO]?.content;

        if (!atoContent) return;

        this.emit({ type: 'workflow', action: { type: 'UPDATE_STEP_DATA', payload: { step: Step.ELABORAR_ATO, data: { isGeneratingEmenta: true, ementaContent: '' } } } });
        
        const result = await PROMPTS.ementaDoAtoFinal(atoContent);
        let prompt = result.contents;
        
        if (instruction) {
            const instructionText = `\n\n[INSTRUÇÃO DO USUÁRIO PARA REESCRITA]: Por favor, reescreva a ementa seguindo esta nova diretriz: ${instruction}`;
            if (Array.isArray(prompt)) {
                prompt = [...prompt, { text: instructionText }];
            } else {
                prompt = [{ text: prompt as string }, { text: instructionText }];
            }
        }
        
        const ementaSystemInstruction = getSystemPrompt(state.language, Task.EMENTA);
        const isolatedChat = createChatSession(modelToUse, ementaSystemInstruction);

        await processStream(isolatedChat, prompt,
            (chunk) => {
                this.emit({ type: 'gemini', action: { type: 'SET_FAILED_REQUEST', payload: null } });
                this.emit({ type: 'workflow', action: { type: 'UPDATE_STEP_DATA', payload: { step: Step.ELABORAR_ATO, data: { ementaContent: chunk } } } });
            },
            async () => {
                this.emit({ type: 'workflow', action: { type: 'UPDATE_STEP_DATA', payload: { step: Step.ELABORAR_ATO, data: { isGeneratingEmenta: false } } } });
                await this.emitLoadingComplete();
            },
            async (_retryFn, error) => {
                let errorTitle = UI.actions.overloadTitle;
                if (error?.code === GeminiErrorCode.TOKEN_LIMIT) {
                    errorTitle = UI.actions.tokenLimitTitle;
                } else if (error?.code === GeminiErrorCode.QUOTA_EXCEEDED) {
                    errorTitle = UI.actions.quotaExceededTitle;
                } else if (error?.code === GeminiErrorCode.FILE_SIZE_LIMIT) {
                    errorTitle = UI.actions.fileSizeLimitTitle;
                }
                this.emit({ type: 'workflow', action: { type: 'UPDATE_STEP_DATA', payload: { step: Step.ELABORAR_ATO, data: { ementaContent: errorTitle, isGeneratingEmenta: false } } } });
                this.emit({ type: 'gemini', action: { type: 'SET_FAILED_REQUEST', payload: { prompt, step: Step.ELABORAR_ATO, isEmenta: true } } });
                await this.emitLoadingComplete();
            }
        );
    }

    private handleFailure(_retryFn: () => void, stepToUpdate: Step, ctx: EngineContext, error?: GeminiError, originalPrompt?: string | Part[], schema?: any) {
        const UI = getUI(ctx.state.language);
        let errorTitle = UI.actions.overloadTitle;
        
        if (error?.code === GeminiErrorCode.TOKEN_LIMIT) {
            errorTitle = UI.actions.tokenLimitTitle;
        } else if (error?.code === GeminiErrorCode.QUOTA_EXCEEDED) {
            errorTitle = UI.actions.quotaExceededTitle;
        } else if (error?.code === GeminiErrorCode.FILE_SIZE_LIMIT) {
            errorTitle = UI.actions.fileSizeLimitTitle;
        }

        this.emit({ type: 'workflow', action: { type: 'UPDATE_STEP_DATA', payload: { step: stepToUpdate, data: { content: errorTitle } } } });
        
        if (originalPrompt) {
            this.emit({ type: 'gemini', action: { type: 'SET_FAILED_REQUEST', payload: { prompt: originalPrompt, step: stepToUpdate, schema } } });
        }
        this.emitLoadingComplete();
    }

    private generateSuggestions(promptAndSchema: {prompt: string | Part[], schema: any}, stepToUpdate: Step, ctx: EngineContext) {
        const { geminiState, state } = ctx;
        if (!geminiState.model) return;
        const STEP_CONFIG = getStepConfig(state.language, state.atoType);
        
        this.emit({ type: 'workflow', action: { type: 'UPDATE_STEP_DATA', payload: { step: stepToUpdate, data: { lastPrompt: promptAndSchema } } } });

        const zodSchemaToUse = state.stepData[stepToUpdate]?.outputSchema || STEP_CONFIG[stepToUpdate]?.outputSchema;

        generateStructuredContent(
            geminiState.model, promptAndSchema.prompt, promptAndSchema.schema,
            (suggestions) => {
                this.emit({ type: 'gemini', action: { type: 'SET_FAILED_REQUEST', payload: null } });
                const data: Partial<StepData> = { stepType: StepType.ARGUMENT_SUGGESTION, isGeneratingSuggestions: false, suggestions: suggestions };
                if (!suggestions) {
                     data.content = (state.language === 'pt-BR' ? "Erro ao processar estrutura da resposta. Tente novamente." : "Error processing response structure. Try again.");
                     this.emit({ type: 'gemini', action: { type: 'SET_FAILED_REQUEST', payload: { prompt: promptAndSchema.prompt, step: stepToUpdate, schema: promptAndSchema.schema } } });
                }
                this.emit({ type: 'workflow', action: { type: 'UPDATE_STEP_DATA', payload: { step: stepToUpdate, data } } });
                this.emitLoadingComplete();
            },
            (_retryFn, error) => {
                this.handleFailure(_retryFn, stepToUpdate, ctx, error, promptAndSchema.prompt, promptAndSchema.schema);
            },
            zodSchemaToUse
        );
    }

    private handleConfirmationStep(isConfirmed: boolean, nextTemplateStep: Step, previousAnalysisStep: Step, ctx: EngineContext) {
        const { state } = ctx;
        const STEP_CONFIG = getStepConfig(state.language, state.atoType);
        
        this.emitLoadingComplete();
        
        if (isConfirmed) {
            const content = (state.language === 'pt-BR' ? "Esta etapa é opcional..." : "This step is optional...");
            const stepDataToAdd = { [nextTemplateStep]: { ...(STEP_CONFIG[nextTemplateStep] as StepData), content, input: null } };
            this.emit({ type: 'workflow', action: { type: 'ADVANCE_STEP', payload: { nextStep: nextTemplateStep, stepDataToAdd } } });
        } else {
            this.emit({ type: 'workflow', action: { type: 'ADVANCE_STEP', payload: { nextStep: previousAnalysisStep, stepDataToAdd: {} } } });
            this.emit({ type: 'workflow', action: { type: 'UPDATE_STEP_DATA', payload: { step: previousAnalysisStep, data: { input: null, suggestions: null, isGeneratingSuggestions: false } } } });
        }
    }
}
