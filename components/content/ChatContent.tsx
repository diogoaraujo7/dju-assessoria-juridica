import React, { useRef, useEffect, useMemo } from 'react';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { StepData } from '../../types';
import { BotIcon, UserIcon } from '../Icons';

interface ChatContentProps {
    data: StepData;
    isLoading: boolean;
    language: string;
    onUserSubmit?: (input: { text: string; files?: File[] }) => void;
    className?: string;
}

interface ChatMessage {
    role: 'user' | 'bot';
    text: string;
    sources?: any[];
}

export const ChatContent: React.FC<ChatContentProps> = ({ data, isLoading, language, onUserSubmit, className }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const LinkRenderer = (props: any) => {
        let text = '';
        if (typeof props.children === 'string') {
            text = props.children;
        } else if (Array.isArray(props.children) && typeof props.children[0] === 'string') {
            text = props.children[0];
        } else {
            text = String(props.children);
        }
        
        const isCitationIndex = /^\[?\d+\]?$/.test(text);

        if (isCitationIndex) {
            const displayText = text.startsWith('[') ? text : `[${text}]`;
            return (
                <a 
                    {...props} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline align-super text-[0.7em] font-bold text-indigo-800 hover:text-indigo-600 transition-colors no-underline cursor-pointer"
                    title={language === 'pt-BR' ? 'Ver fonte' : 'View source'}
                >
                    {displayText}
                </a>
            );
        }

        return <a {...props} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline font-bold transition-colors cursor-pointer decoration-2 underline-offset-2" />;
    };

    const messages = useMemo(() => {
        if (!data.content) return [];
        
        const parts = data.content.split('\n\n---\n\n');
        const parsedMessages: ChatMessage[] = [];
        
        parts.forEach(part => {
            let role: 'user' | 'bot' = 'bot';
            let text = part.trim();
            
            if (text.startsWith('**Você:**\n')) {
                role = 'user';
                text = text.replace('**Você:**\n', '').trim();
            } else if (text.startsWith('**Dju Assessoria Jurídica:**\n')) {
                role = 'bot';
                text = text.replace('**Dju Assessoria Jurídica:**\n', '').trim();
            } else if (text === '') {
                return;
            }

            let sources: any[] | undefined;
            const sourcesMatch = text.match(/\[SOURCES:\s*(\[[\s\S]*\])\]$/);
            if (sourcesMatch) {
                try {
                    sources = JSON.parse(sourcesMatch[1]);
                    text = text.replace(sourcesMatch[0], '').trim();
                } catch (e) {
                    console.error("Failed to parse sources", e);
                }
            }

            parsedMessages.push({ role, text, sources });
        });
        
        return parsedMessages;
    }, [data.content]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    return (
        <div className={className || "flex flex-col h-[600px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"}>
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
            >
                {messages.length > 0 ? (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} min-w-0`}>
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-white border border-slate-200 text-blue-600'}`}>
                                {msg.role === 'user' ? <UserIcon /> : <BotIcon />}
                            </div>
                            <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 shadow-sm break-words min-w-0 ${msg.role === 'user' ? 'bg-slate-100 text-slate-800 rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}>
                                <div className={`prose prose-sm max-w-none prose-slate min-w-0`}>
                                    {msg.role === 'user' && msg.text.includes('**Arquivos anexados:**') ? (
                                        <>
                                            <MarkdownRenderer components={{ a: LinkRenderer }}>{msg.text.split('\n\n**Arquivos anexados:**')[0]}</MarkdownRenderer>
                                            <div className="mt-3 pt-3 border-t border-slate-200">
                                                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Arquivos Anexados</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {msg.text.split('**Arquivos anexados:**\n')[1]?.split(' ').map((file, i) => {
                                                        const cleanName = file.replace(/[`📎]/g, '').trim();
                                                        if (!cleanName) return null;
                                                        return (
                                                            <span key={i} className="bg-white border border-slate-200 text-slate-700 text-xs rounded-full py-1 px-3 flex items-center gap-1.5 shadow-sm max-w-full">
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 opacity-80 shrink-0">
                                                                    <path fillRule="evenodd" d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 9.52l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.451a1.125 1.125 0 0 0 1.587 1.595l3.454-3.553a3 3 0 0 0 0-4.242Z" clipRule="evenodd" />
                                                                </svg>
                                                                <span className="truncate">{cleanName}</span>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <MarkdownRenderer components={{ a: LinkRenderer }}>{msg.text}</MarkdownRenderer>
                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-indigo-100">
                                                    <p className="text-[11px] uppercase tracking-wider font-bold text-indigo-500 mb-3">
                                                        {language === 'pt-BR' ? 'Fontes Consultadas' : 'Sources'}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {msg.sources.map((source, i) => {
                                                            const uri = source.web?.uri || '';
                                                            let hostname = 'Fonte';
                                                            if (uri) {
                                                                try {
                                                                    hostname = new URL(uri).hostname.replace('www.', '');
                                                                } catch (e) {
                                                                    hostname = 'Fonte';
                                                                }
                                                            }
                                                            const displayTitle = source.web?.title || hostname;
                                                            
                                                            return (
                                                                <a 
                                                                    key={i} 
                                                                    href={uri} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 rounded-full text-xs font-medium text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 transition-all max-w-full shadow-sm hover:shadow-md"
                                                                    title={displayTitle}
                                                                >
                                                                    <span className="font-bold text-indigo-400">[{i + 1}]</span>
                                                                    <span className="truncate max-w-[220px]">{displayTitle}</span>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-indigo-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5">
                                                                        <path fillRule="evenodd" d="M5 10a.75.75 0 0 1 .75-.75h6.638L10.23 7.29a.75.75 0 1 1 1.04-1.08l3.5 3.25a.75.75 0 0 1 0 1.08l-3.5 3.25a.75.75 0 1 1-1.04-1.08l2.158-1.96H5.75A.75.75 0 0 1 5 10Z" clipRule="evenodd" />
                                                                    </svg>
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6 sm:space-y-8 animate-fade-in p-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 shadow-sm">
                            <BotIcon />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-semibold text-slate-700 text-center max-w-md">
                            {language === 'pt-BR' ? 'Como posso ajudar você hoje?' : 'How can I help you today?'}
                        </h2>
                        {data.suggestionButtons && data.suggestionButtons.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 w-full max-w-2xl mt-2 sm:mt-4">
                                {data.suggestionButtons.map((suggestion, idx) => {
                                    const text = typeof suggestion === 'string' ? suggestion : suggestion.label;
                                    const actionText = typeof suggestion === 'string' ? suggestion : suggestion.promptText;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => onUserSubmit && onUserSubmit({ text: actionText })}
                                            className="px-4 py-3 sm:px-6 sm:py-4 bg-white border border-slate-200 rounded-2xl text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all text-left shadow-sm flex items-center gap-3 min-w-[200px] sm:min-w-[250px] flex-1 max-w-[300px]"
                                        >
                                            <span className="flex-1 font-medium text-sm sm:text-base">{text}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
                {isLoading && (
                    <div className="flex gap-4 flex-row">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border border-slate-200 text-blue-600 flex items-center justify-center shadow-sm">
                            <BotIcon />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2 h-[52px]">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
