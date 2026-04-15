
import React, { useState, useMemo } from 'react';
import { GroundingChunk, Language } from '../../types';
import { getUI } from '../../ui';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { WebSearchIcon } from '../Icons';

interface WebSearchAnalysisProps {
    analysis: string;
    groundingSources: GroundingChunk[];
    language: Language;
}

export const WebSearchAnalysis: React.FC<WebSearchAnalysisProps> = ({ analysis, groundingSources = [], language }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const UI = getUI(language).actions;
    
    const validSources = useMemo(() => {
        return groundingSources.filter(s => s.web && s.web.uri);
    }, [groundingSources]);
    
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
                    title="Ver fonte"
                >
                    {displayText}
                </a>
            );
        }

        return <a {...props} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline font-bold transition-colors cursor-pointer decoration-2 underline-offset-2" />;
    };

    return (
        <div className="border border-indigo-200 bg-white rounded-xl overflow-hidden mt-6 shadow-sm">
             <div 
                className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between cursor-pointer hover:bg-indigo-100/70 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm uppercase tracking-wide">
                    <WebSearchIcon />
                    <span>ANÁLISE DETALHADA</span>
                </div>
                <button
                    className="text-sm font-semibold inline-flex items-center gap-2 uppercase tracking-wide text-indigo-600"
                >
                    {isExpanded ? UI.hideFundamentation : UI.readFundamentation}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            
            {isExpanded && (
                <div className="p-6 animate-fade-in bg-white cursor-text" onClick={(e) => e.stopPropagation()}>
                    <div className="text-base leading-relaxed text-slate-800 text-justify prose max-w-none prose-p:my-3 prose-strong:font-bold prose-h3:text-indigo-800 prose-h3:font-bold prose-ul:list-disc">
                        <MarkdownRenderer
                            components={{ 
                                a: LinkRenderer,
                                p: ({node, ...props}: any) => <p style={{textAlign: 'justify'}} className="my-3" {...props} />
                            }}
                        >
                            {(analysis || '').replace(/\\n/g, '\n')}
                        </MarkdownRenderer>
                    </div>
                
                    {validSources.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-indigo-100">
                                <p className="text-[11px] uppercase tracking-wider font-bold text-indigo-500 mb-3">
                                {UI.sourcesLabel}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                {validSources.map((source, idx) => {
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
                                            key={idx}
                                            href={uri}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 rounded-full text-xs font-medium text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 transition-all max-w-full shadow-sm hover:shadow-md"
                                            title={displayTitle}
                                        >
                                            <span className="font-bold text-indigo-400">[{idx + 1}]</span>
                                            <span className="truncate max-w-[220px]">{displayTitle}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-indigo-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5">
                                                <path fillRule="evenodd" d="M5 10a.75.75 0 0 1 .75-.75h6.638L10.23 7.29a.75.75 0 1 1 1.04-1.08l3.5 3.25a.75.75 0 0 1 0 1.08l-3.5 3.25a.75.75 0 1 1-1.04-1.08l2.158-1.96H5.75A.75.75 0 0 1 5 10Z" clipRule="evenodd" />
                                            </svg>
                                        </a>
                                    )
                                })}
                                </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
