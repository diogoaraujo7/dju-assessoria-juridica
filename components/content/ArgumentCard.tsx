
import React, { useState } from 'react';
import { Language } from '../../types';
import { getUI } from '../../ui';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ArgumentCardProps {
    title: string;
    content: string;
    isSelected: boolean;
    onSelect: () => void;
    language: Language;
    isSearchBased?: boolean;
}

export const ArgumentCard: React.FC<ArgumentCardProps> = ({ title, content, isSelected, onSelect, language, isSearchBased = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const UI = getUI(language).actions;
    const safeContent = (content || '').replace(/\\n/g, '\n');
    const safeTitle = (title || '').replace(/\\n/g, '\n');

    const cleanRegex = /([*_]*\s*[-]*\s*DETALHE[S]?\s*:?\s*[-]*\s*[*_]*)/i;

    let summaryText = safeContent;
    let detailedText = '';

    const match = safeContent.match(cleanRegex);
    if (match && match.index !== undefined) {
        summaryText = safeContent.substring(0, match.index).trim();
        detailedText = safeContent.substring(match.index + match[0].length).trim();
    } else {
        const parts = safeContent.split(/---DETALHES?---/i);
        if (parts.length > 1) {
            summaryText = parts[0].trim();
            detailedText = parts.slice(1).join('\n').trim();
        }
    }
    
    const getPreviewFallback = (text: string) => {
         if (!text) return '';
        const sentenceRegex = /^(.+?(?<!\b(art|v|n|fls|pág|pag|doc|num|id|lei|súm))\s*[.?!])(\s|$)/i;
        
        const match = text.match(sentenceRegex);
        if (match) {
            return match[1];
        }
        return text.length > 150 ? text.substring(0, 150) + "..." : text;
    };

    const displaySummary = (detailedText ? summaryText : getPreviewFallback(safeContent)).replace(/^\s+|\s+$/g, '');
    const displayDetail = detailedText ? detailedText.replace(/^\s+|\s+$/g, '') : (safeContent !== displaySummary ? safeContent.replace(displaySummary, '').replace(/^\s+|\s+$/g, '') : '');
    const hasDetails = !!displayDetail && displayDetail.length > 5;

    const styles = isSearchBased ? {
        container: isSelected 
            ? 'bg-violet-50 border-violet-400 shadow-sm ring-1 ring-violet-300' 
            : 'bg-white border-violet-200 hover:bg-violet-50/60 hover:border-violet-300 hover:shadow-sm hover:-translate-y-0.5',
        title: 'text-base text-slate-800', 
        summary: 'text-sm text-slate-700 leading-relaxed select-text cursor-text',
        details: 'text-sm text-slate-600 mt-3 pt-3 border-t border-violet-100 select-text cursor-text',
        iconColor: 'text-violet-500',
        iconBorder: 'border-violet-200',
        readMore: 'text-violet-600 hover:text-violet-800',
        citationBadge: 'text-violet-700 bg-violet-50 border-violet-200'
    } : {
        container: isSelected 
            ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500' 
            : 'bg-white border-slate-200 hover:bg-slate-50 hover:shadow-sm hover:-translate-y-0.5',
        title: 'text-base text-slate-900',
        summary: 'text-sm text-slate-800 leading-relaxed select-text cursor-text',
        details: 'text-sm text-slate-700 mt-3 pt-3 border-t border-slate-200/60 select-text cursor-text',
        iconColor: 'text-blue-600',
        iconBorder: 'border-slate-300',
        readMore: 'text-slate-600 hover:text-blue-600',
        citationBadge: 'text-blue-600 bg-blue-50 border-blue-200'
    };
    
    const CardMarkdown: React.FC<{content: string}> = ({ content }) => {
        return (
             <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                    em: ({node, ...props}) => <i {...props} className="italic" />,
                    strong: ({node, ...props}) => <b {...props} className="font-bold" />,
                    p: ({node, ...props}) => <p {...props} className="my-0 text-justify" />, 
                    a: ({node, ...props}) => {
                        const isCitation = /^[\d,\s]+$/.test(String(props.children).replace(/[\[\]]/g, ''));
                        if (isCitation) {
                             return <span className={`inline-flex items-center justify-center align-super text-[0.7em] font-bold border rounded px-1 mx-0.5 ${styles.citationBadge}`}>{props.children}</span>
                        }
                        return <a {...props} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" />
                    }
                }}
            >
                {content}
            </Markdown>
        )
    };

    const handleCardClick = (_e: React.MouseEvent) => {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
            return;
        }
        onSelect();
    };

    return (
        <div
            onClick={handleCardClick}
            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 flex flex-col ${styles.container}`}
        >
            <div className="flex items-start gap-3 mb-1">
                <div className="flex-shrink-0 mt-0.5">
                    {isSelected ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${styles.iconColor}`}>
                            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.06 0l4-5.5Z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <div className={`w-5 h-5 border-2 rounded-full ${styles.iconBorder}`}></div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className={`font-bold leading-snug ${styles.title}`}>
                        <CardMarkdown content={safeTitle} />
                    </h4>
                    
                    <div className={`mt-2 prose prose-sm max-w-none ${styles.summary}`}>
                        <CardMarkdown content={displaySummary} />
                    </div>

                    {isExpanded && hasDetails && (
                        <div className={`prose prose-sm max-w-none animate-fade-in ${styles.details}`}>
                             <CardMarkdown content={displayDetail} />
                        </div>
                    )}

                    {hasDetails && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                            className={`text-xs font-semibold mt-3 inline-flex items-center gap-1 uppercase tracking-wide transition-colors ${styles.readMore}`}
                        >
                            {isExpanded ? UI.readLess : UI.readMore}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
