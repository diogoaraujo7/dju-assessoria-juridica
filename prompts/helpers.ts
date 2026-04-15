
import { Part } from '@google/genai';

export const textPart = (text: string): Part => ({ text });

export const getStyleInstructions = (lengthValue?: number, toneValue?: number): string => {
    let instructions = [];
    
    if (lengthValue !== undefined) {
        if (lengthValue === -2) instructions.push("ter uma extensão muito curta (até 100 palavras para tratar de cada ponto controvertido na fundamentação)");
        if (lengthValue === -1) instructions.push("ter uma extensão curta (até 150 palavras para tratar de cada ponto controvertido na fundamentação)");
        if (lengthValue === 0) instructions.push("ter uma extensão média (aproximadamente, 250 palavras para tratar de cada ponto controvertido na fundamentação)");
        if (lengthValue === 1) instructions.push("ter uma extensão longa (aproximadamente, 300 palavras para tratar de cada ponto controvertido na fundamentação)");
        if (lengthValue === 2) instructions.push("ter uma extensão muito longa (mais de 350 palavras para tratar de cada ponto controvertido na fundamentação)");
    }

    if (toneValue !== undefined && toneValue !== 0) {
        if (toneValue === -2) instructions.push("ter um tom mais simples e acessível a leigos");
        if (toneValue === -1) instructions.push("ter um tom mais claro e direto, não tão formal");
        if (toneValue === 1) instructions.push("ter um tom muito formal e polido");
        if (toneValue === 2) instructions.push("ter um tom extremamente técnico e formal");
    }

    if (instructions.length === 0) return "";

    return `\n\nINSTRUÇÕES DE ESTILO (EXTENSÃO E TOM):\nEm relação à fundamentação, o texto gerado deve ${instructions.join('; e ')}.`;
};
