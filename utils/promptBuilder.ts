
import { Argument, GoogleSearchResult } from '../types';

interface BuildArgumentOptions {
    suggestions: any[];
    selectedArguments: Map<string, Set<string>>;
    selectedSearchArguments: Map<string, Set<string>>;
    additionalBases: Record<string, { text: string; files: File[] }>;
    dismissedPoints: Set<string>;
    googleSearchResults?: Record<string, GoogleSearchResult>;
}

export const buildArgumentConfirmation = (options: BuildArgumentOptions): { text: string; files: File[] } => {
    const { 
        suggestions, 
        selectedArguments, 
        selectedSearchArguments, 
        additionalBases, 
        dismissedPoints, 
        googleSearchResults 
    } = options;

    const allFiles: File[] = [];

    const allArgumentsMap = new Map<string, Argument>();
    suggestions.forEach(suggestion => {
        (suggestion.argumentosFavoraveis || []).forEach((arg: Argument) => allArgumentsMap.set(arg.titulo, arg));
        (suggestion.argumentosContrarios || []).forEach((arg: Argument) => allArgumentsMap.set(arg.titulo, arg));
    });

    const allSearchArgumentsMap = new Map<string, Argument>();
    if (googleSearchResults) {
        Object.values(googleSearchResults).forEach((result: GoogleSearchResult) => {
            if (result.searchArguments) {
                result.searchArguments.forEach(arg => allSearchArgumentsMap.set(arg.titulo, arg));
            }
        });
    }

    const formattedText = suggestions.map(suggestion => {
        const pointIdentifier = suggestion.pontoControvertido;
        const [descricao, pergunta] = (pointIdentifier || '').split('---PERGUNTA---');
        const pontoText = `${(descricao || '').trim()} Questão: ${(pergunta || '').trim()}`;

        if (dismissedPoints.has(pointIdentifier)) {
            return `Para o ponto controvertido "${pontoText}", a análise foi dispensada pelo usuário.`;
        }

        const selectedTitles = selectedArguments.get(pointIdentifier) || new Set();
        const selectedSearchTitles = selectedSearchArguments.get(pointIdentifier) || new Set();
        const additionalData = additionalBases[pointIdentifier];
        const searchResult = googleSearchResults?.[pointIdentifier];
        
        if (additionalData) {
            allFiles.push(...additionalData.files);
        }

        if (selectedTitles.size === 0 && selectedSearchTitles.size === 0 && (!additionalData || !additionalData.text.trim())) {
            return null;
        }
        
        let pointResult = `Para o ponto controvertido "${pontoText}", adotam-se os seguintes argumentos e as seguintes informações complementares:\n`;
        
        const cleanRegex = /[\s\n]*[*]*[-_]*\s*DETALHES\s*[-_]*[*]*[\s\n]*/gi;

        if (selectedTitles.size > 0) {
            pointResult += '\n**Argumentos Selecionados:**\n' + Array.from(selectedTitles).map(title => {
                const arg = allArgumentsMap.get(title);
                if (!arg) return `- ${title}`;
                const fullText = arg.fundamentacao ? arg.fundamentacao.replace(cleanRegex, '\n\n') : '';
                return `- ${arg.titulo}${fullText ? `: ${fullText}` : ''}`;
            }).join('\n');
        }

         if (selectedSearchTitles.size > 0) {
            pointResult += '\n\n**Argumentos da Pesquisa Web Selecionados:**\n' + Array.from(selectedSearchTitles).map(title => {
                const arg = allSearchArgumentsMap.get(title);
                if (!arg) return `- ${title}`;
                 const fullText = arg.fundamentacao ? arg.fundamentacao.replace(cleanRegex, '\n\n') : '';
                return `- ${arg.titulo}${fullText ? `: ${fullText}` : ''}`;
            }).join('\n');
        }
        
        if ((selectedSearchTitles.size > 0) && searchResult && searchResult.analysis) {
             const cleanAnalysis = searchResult.analysis.replace(cleanRegex, '\n\n');
             pointResult += '\n\n**Contexto da Pesquisa Web (Análise Geral):**\n' + cleanAnalysis;
        }

        if (additionalData && additionalData.text.trim()) {
            pointResult += '\n\n**Argumentos Complementares:**\n' + additionalData.text.trim();
             if (additionalData.files.length > 0) {
                pointResult += `\n(Arquivos anexados: ${additionalData.files.map(f => f.name).join(', ')})`;
            }
        }

        return pointResult;
    }).filter(Boolean).join('\n\n---\n\n');

    return {
        text: formattedText || "Nenhum argumento selecionado ou ponto dispensado.",
        files: allFiles
    };
};
