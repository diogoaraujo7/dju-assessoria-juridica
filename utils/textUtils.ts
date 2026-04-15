
import { jsonrepair } from 'jsonrepair';

/**
 * Centralized utility for text processing.
 */

export const extractCleanEmenta = (content: string): string => {
    if (!content) return '';
    
    const startTag = '[INÍCIO DA EMENTA]';
    const endTag = '[FINAL DA EMENTA]';
    const startIndex = content.indexOf(startTag);
    const endIndex = content.indexOf(endTag);

    if (startIndex !== -1 && endIndex !== -1) {
        return content.substring(startIndex + startTag.length, endIndex).trim();
    }
    
    return content.trim();
};

export const sanitizeJsonOutput = (text: string): string => {
    if (!text) return '{}';
    
    let clean = text.replace(/```json\s*|```/g, '');
    
    const firstBrace = clean.indexOf('{');
    const firstBracket = clean.indexOf('[');
    
    let startIndex = -1;
    
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startIndex = firstBrace;
    } else if (firstBracket !== -1) {
        startIndex = firstBracket;
    }

    if (startIndex !== -1) {
        const lastBrace = clean.lastIndexOf('}');
        const lastBracket = clean.lastIndexOf(']');
        let endIndex = -1;

        if (startIndex === firstBrace) {
            endIndex = lastBrace;
        } else {
            endIndex = lastBracket;
        }

        if (endIndex !== -1 && endIndex > startIndex) {
            clean = clean.substring(startIndex, endIndex + 1);
        }
    } else {
    }
    
    try {
        return jsonrepair(clean);
    } catch (e) {
        console.warn("JSON Repair failed, falling back to raw cleanup", e);
        return clean;
    }
};
