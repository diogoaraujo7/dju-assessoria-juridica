import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { Components } from 'react-markdown';

interface MarkdownRendererProps {
    children: string;
    className?: string;
    components?: Components;
    withIndentation?: boolean;
    isJustified?: boolean;
}

const customSchema = {
    ...defaultSchema,
    attributes: {
        ...defaultSchema.attributes,
        '*': [...(defaultSchema.attributes?.['*'] || []), 'style', 'className'],
    },
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children, className, components, withIndentation, isJustified }) => {
    const sanitizedChildren = typeof children === 'string' ? children.replace(/\\n/g, '\n') : children;

    return (
        <div className={className}>
            <Markdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, [rehypeSanitize, customSchema]]}
                components={{
                    a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />,
                    p: ({ node, ...props }) => (
                        <p 
                            {...props} 
                            className={`${withIndentation ? '[text-indent:1.5cm] text-justify' : ''} ${isJustified ? 'text-justify' : ''} mb-4 leading-relaxed ${props.className || ''}`} 
                        />
                    ),
                    blockquote: ({ node, ...props }) => (
                        <blockquote 
                            {...props} 
                            className={`border-l-4 border-slate-200 pl-4 italic my-4 ${props.className || ''}`} 
                        />
                    ),
                    ...components
                }}
            >
                {sanitizedChildren}
            </Markdown>
        </div>
    );
};