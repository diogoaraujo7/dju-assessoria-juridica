
export enum GeminiErrorCode {
    OVERLOAD = 'OVERLOAD',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
    SAFETY = 'SAFETY',
    PARSING = 'PARSING',
    NETWORK = 'NETWORK',
    GENERIC = 'GENERIC',
    API_KEY = 'API_KEY',
    TOKEN_LIMIT = 'TOKEN_LIMIT',
    FILE_SIZE_LIMIT = 'FILE_SIZE_LIMIT'
}

export class GeminiError extends Error {
    public readonly code: GeminiErrorCode;
    public readonly originalError?: unknown;
    public readonly isRetryable: boolean;

    constructor(
        code: GeminiErrorCode, 
        message: string, 
        originalError?: unknown,
        isRetryable: boolean = false
    ) {
        super(message);
        this.name = 'GeminiError';
        this.code = code;
        this.originalError = originalError;
        this.isRetryable = isRetryable;
    }

    static fromError(error: unknown): GeminiError {
        if (error instanceof GeminiError) return error;

        let msg = error instanceof Error ? error.message : String(error);
        
        try {
            const jsonStart = msg.indexOf('{');
            const jsonEnd = msg.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonStr = msg.substring(jsonStart, jsonEnd + 1);
                const parsed = JSON.parse(jsonStr);
                if (parsed.error && parsed.error.message) {
                    msg = parsed.error.message;
                } else if (parsed.message) {
                    msg = parsed.message;
                }
            }
        } catch (e) {
        }

        const lowerMsg = msg.toLowerCase();

        if (lowerMsg.includes('token count exceeds') || lowerMsg.includes('maximum number of tokens')) {
             return new GeminiError(GeminiErrorCode.TOKEN_LIMIT, "Limite de tokens (volume de dados) excedido.", error, false);
        }

        if (lowerMsg.includes('document size exceeds') || lowerMsg.includes('file size exceeds')) {
             return new GeminiError(GeminiErrorCode.FILE_SIZE_LIMIT, "O tamanho do documento excede o limite suportado (50MB). Por favor, reduza o tamanho do arquivo.", error, false);
        }

        if (lowerMsg.includes('429') || lowerMsg.includes('quota') || lowerMsg.includes('resource_exhausted')) {
             return new GeminiError(GeminiErrorCode.QUOTA_EXCEEDED, "Cota de requisições excedida (Erro 429). O modelo está temporariamente indisponível devido ao alto volume de uso. Aguarde alguns instantes e tente novamente.", error, true);
        }

        if (
            lowerMsg.includes('503') || 
            lowerMsg.includes('overloaded') || 
            lowerMsg.includes('unavailable') ||
            lowerMsg.includes('internal server error')
        ) {
            return new GeminiError(GeminiErrorCode.OVERLOAD, "O modelo de IA está sobrecarregado (503). Tente novamente.", error, true);
        }

        if (lowerMsg.includes('safety') || lowerMsg.includes('blocked')) {
            return new GeminiError(GeminiErrorCode.SAFETY, "A resposta foi bloqueada pelas configurações de segurança.", error, false);
        }

        if (lowerMsg.includes('api key') || lowerMsg.includes('403') || lowerMsg.includes('permission denied')) {
            return new GeminiError(GeminiErrorCode.API_KEY, "Erro de permissão ou Chave de API inválida.", error, false);
        }

        if (lowerMsg.includes('rpc failed') || lowerMsg.includes('xhr error') || lowerMsg.includes('failed to fetch')) {
            return new GeminiError(GeminiErrorCode.NETWORK, "Erro de conexão com o servidor da IA. Verifique sua internet ou tente novamente em instantes.", error, true);
        }

        return new GeminiError(GeminiErrorCode.GENERIC, msg, error, true);
    }
}
