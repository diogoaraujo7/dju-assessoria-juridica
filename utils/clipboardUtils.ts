
import { marked } from 'marked';

export interface CopyOptions {
    isJustified?: boolean;
    withIndentation?: boolean;
}

export const copyToClipboard = async (text: string, richContent?: string, options?: CopyOptions): Promise<void> => {
    try {
        let htmlFragment = richContent ? richContent : await marked.parse(text, { gfm: true, breaks: true });
        
        // Process HTML to ensure compatibility with Word/Google Docs
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlFragment;
        
        // Fix blockquotes: ensure they match the screen (not italic) without forcing arbitrary indents
        const blockquotes = tempDiv.querySelectorAll('blockquote');
        blockquotes.forEach(bq => {
            bq.style.fontStyle = 'normal';
        });

        // Apply alignment and indentation to match the screen
        const paragraphs = tempDiv.querySelectorAll('p');
        paragraphs.forEach(p => {
            p.setAttribute('dir', 'ltr');
            
            p.style.marginTop = '0pt';
            p.style.marginBottom = '12pt';
            p.style.lineHeight = '1.5';
            p.style.fontFamily = 'Arial, sans-serif';
            p.style.fontSize = '11pt';
            p.style.color = '#000000';

            if (options?.withIndentation) {
                p.style.textAlign = 'justify';
                p.style.textIndent = '35.4pt';
                p.style.textIndent = '42.5pt'; 
            } else if (options?.isJustified) {
                p.style.textAlign = 'justify';
            }
            
            // Wrap inner content in a span to ensure styles are applied to text nodes
            if (!p.querySelector('span')) {
                const span = document.createElement('span');
                span.style.fontSize = '11pt';
                span.style.fontFamily = 'Arial, sans-serif';
                span.style.color = '#000000';
                span.style.backgroundColor = 'transparent';
                span.style.fontWeight = '400';
                span.style.fontStyle = 'normal';
                span.style.fontVariant = 'normal';
                span.style.textDecoration = 'none';
                span.style.verticalAlign = 'baseline';
                span.style.whiteSpace = 'pre-wrap';
                
                // Move all child nodes into the span
                while (p.firstChild) {
                    span.appendChild(p.firstChild);
                }
                p.appendChild(span);
            }
        });

        const listItems = tempDiv.querySelectorAll('li');
        listItems.forEach(li => {
            li.setAttribute('dir', 'ltr');
            if (options?.withIndentation || options?.isJustified) {
                li.style.textAlign = 'justify';
            }
            li.style.marginBottom = '6pt';
            li.style.lineHeight = '1.5';
            li.style.fontFamily = 'Arial, sans-serif';
            li.style.fontSize = '11pt';
            li.style.color = '#000000';
        });
        
        htmlFragment = tempDiv.innerHTML;
        
        let wrapperStyle = 'font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #000000;';
        if (options?.withIndentation || options?.isJustified) {
            wrapperStyle += ' text-align: justify;';
        }

        const guid = 'docs-internal-guid-' + Math.random().toString(36).substring(2, 15);

        const wordReadyHtml = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
            <meta charset="utf-8">
            </head>
            <body>
                <b id="${guid}" style="font-weight:normal;">
                    <div style="${wrapperStyle}">
                        ${htmlFragment}
                    </div>
                </b>
            </body>
            </html>
        `;
        
        const htmlBlob = new Blob([wordReadyHtml], { type: 'text/html' });
        const textBlob = new Blob([text], { type: 'text/plain' });

        const clipboardItem = new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob,
        });

        await navigator.clipboard.write([clipboardItem]);
    } catch (err) {
        console.error('Failed to copy rich text, falling back to plain text: ', err);
        try {
            await navigator.clipboard.writeText(text);
        } catch (fallbackErr) {
            console.error('Fallback to writeText also failed: ', fallbackErr);
            throw new Error('Failed to copy text.');
        }
    }
};
