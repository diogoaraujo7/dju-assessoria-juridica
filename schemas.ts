
import { Type, Schema } from '@google/genai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const zArgumentSchema = z.object({
    titulo: z.string(),
    fundamentacao: z.string(),
});

const zSuggestionButtonSchema = z.object({
    label: z.string().describe("O texto curto que aparecerá no botão (ex: 'Apelação do Autor')."),
    promptText: z.string().describe("O texto completo que será inserido no campo de mensagem ao clicar. DEVE seguir o formato: 'Bases para a fundamentação: adotar os fundamentos de [Peça/Decisão]. Resultado: [Resultado Jurídico esperado, levando em consideração, inclusive, o tipo de ato em elaboração, ex: DAR PROVIMENTO ao recurso para...].'"),
});

export const zAtoGerarSugestoesSchema = z.array(z.object({
    pontoControvertido: z.string().describe("Descrição sucinta do ponto, em uma frase curta (no máximo, 15 palavras), separador '---PERGUNTA---', e a pergunta-chave."),
    labelFavoravel: z.string().optional().describe("Rótulo curto (máximo 5 palavras) para a coluna de argumentos favoráveis. Exemplo: 'Pela majoração da indenização'."),
    argumentosFavoraveis: z.array(zArgumentSchema).describe("Lista de argumentos favoráveis. Se não houver, retorne array vazio."),
    labelContrario: z.string().optional().describe("Rótulo curto (máximo 5 palavras) para a coluna de argumentos contrários. Exemplo: 'Pela manutenção da indenização'."),
    argumentosContrarios: z.array(zArgumentSchema).describe("Lista de argumentos contrários. Se não houver, retorne array vazio."),
}));

export const zAtoGerarSugestoesDivergenciaSchema = z.array(z.object({
    pontoControvertido: z.string().describe("Descrição sucinta do ponto, em uma frase curta (no máximo, 15 palavras), separador '---PERGUNTA---', e a pergunta-chave."),
    labelContrario: z.string().optional().describe("Rótulo curto (máximo 5 palavras) para os argumentos de divergência. Exemplo: 'Divergência'."),
    argumentosContrarios: z.array(zArgumentSchema).describe("Lista de argumentos para a divergência. Se não houver, retorne array vazio."),
}));

export const zPeticaoGerarSugestoesSchema = z.array(z.object({
    pontoControvertido: z.string().describe("Descrição sucinta do ponto, em uma frase curta (no máximo, 15 palavras), separador '---PERGUNTA---', e a pergunta-chave."),
    labelFavoravel: z.string().optional().describe("Rótulo curto (máximo 5 palavras) para os argumentos favoráveis à tese. Exemplo: 'Pela majoração da indenização'."),
    argumentosFavoraveis: z.array(zArgumentSchema).describe("Lista de argumentos favoráveis. Se não houver, retorne array vazio."),
}));

export const zAnaliseProcessualSchema = z.object({
    resumo: z.string().describe("O relato detalhado (com minúcias) e completo dos fatos do processo. Use sintaxe Markdown estrita: títulos em linhas isoladas começando com '## ' e subtítulos com '### '. OBRIGATÓRIO: Cada título ou subtítulo DEVE ser precedido por duas quebras de linha (\\n\\n) para garantir a formatação Markdown."),
    pontosControvertidos: z.string().describe("Os pontos controvertidos identificados, formatados em markdown com marcadores (bullet points) ou numeração, separados por linhas em branco."),
    sugestoesBotoes: z.array(zSuggestionButtonSchema).describe("Até 5 sugestões de botões referentes a atos chaves. Cada botão deve ter um 'label' curto e um 'promptText' completo com a ação e o resultado jurídico esperado."),
});

export const zAnaliseVotoRelatorSchema = z.object({
    sinteseVoto: z.string().describe("A síntese detalhada do voto do relator. OBRIGATÓRIO: Use duas quebras de linha (\\n\\n) para separar parágrafos."),
    pontosControvertidos: z.string().describe("Os pontos controvertidos identificados no voto, formatados estritamente como uma lista Markdown válida usando marcadores (- ou *)."),
    sugestoesBotoes: z.array(zSuggestionButtonSchema).optional().describe("Até 5 sugestões de botões cujos fundamentos possam servir de base para a divergência (ex: 'Razões da Apelação'). O 'promptText' deve conter o comando para adotar tais fundamentos e o resultado (ex: DAR PROVIMENTO)."),
});

export const zPeticaoExtrairDadosSchema = z.object({
    facts: z.string().optional().describe("A narrativa dos fatos (não preencher na extração, campo de uso interno)."),
    plaintiff: z.string().optional().default('').describe("Autor(es) e sua qualificação."),
    defendant: z.string().optional().default('').describe("Réu(s) e sua qualificação."),
    rights: z.string().optional().default('').describe("Fundamentos jurídicos e direitos violados."),
    hasInjunction: z.boolean().optional().default(false).describe("True se houver pedido de tutela de urgência/liminar, False caso contrário."),
    requests: z.string().optional().default('').describe("Pedidos finais da petição."),
    value: z.string().optional().default('').describe("Valor da causa."),
    evidence: z.string().optional().default('').describe("Provas que pretende produzir."),
});

export const zPeticaoIdentificarPartesSchema = z.object({
    autores: z.array(z.string()).describe("Lista com os nomes completos dos autores (polo ativo)."),
    reus: z.array(z.string()).describe("Lista com os nomes completos dos réus (polo passivo)."),
});

export const zPeticaoAnalisePreliminarSchema = z.object({
    autores: z.array(z.string()).describe("Lista com os nomes completos dos autores."),
    reus: z.array(z.string()).describe("Lista com os nomes completos dos réus."),
    resumo: z.string().describe("O relato detalhado (com minúcias) e completo dos fatos do processo. Use sintaxe Markdown estrita: títulos em linhas isoladas começando com '## ' e subtítulos com '### '. OBRIGATÓRIO: Cada título ou subtítulo DEVE ser precedido por duas quebras de linha (\\n\\n) para garantir a formatação Markdown."),
    pontosControvertidos: z.string().describe("Os pontos controvertidos identificados, formatados estritamente como uma lista Markdown válida usando marcadores (- ou *)."),
    sugestoesBotoes: z.array(zSuggestionButtonSchema).describe("Até 5 sugestões de botões. Cada botão deve ter 'label' (ex: 'Contestação') e 'promptText' (ex: 'Bases para fundamentação: adotar a tese da Contestação. Resultado: JULGAR IMPROCEDENTE a ação.')."),
});

export const zRevisorIntentSchema = z.object({
    intent: z.enum(['EDIT_DOCUMENT', 'CHAT_RESPONSE']).describe("The intent of the user. 'EDIT_DOCUMENT' se o usuário pede para alterar, reescrever, formatar, resumir ou modificar o texto no editor. 'CHAT_RESPONSE' se o usuário faz uma pergunta, pede uma pesquisa (ex: jurisprudência), ou apenas conversa sem querer modificar o documento atual."),
});

const TYPE_MAPPING: Record<string, Type> = {
    'string': Type.STRING,
    'number': Type.NUMBER,
    'integer': Type.INTEGER,
    'boolean': Type.BOOLEAN,
    'array': Type.ARRAY,
    'object': Type.OBJECT,
    'null': Type.NULL
};

function toGeminiSchema(jsonSchema: Record<string, any>): Schema {
    if (!jsonSchema) return { type: Type.STRING };

    let schemaType = jsonSchema.type;

    if (Array.isArray(schemaType)) {
        const validTypes = schemaType.filter((t: string) => t !== 'null');
        schemaType = validTypes.length > 0 ? validTypes[0] : 'string';
    }

    const geminiType = TYPE_MAPPING[schemaType];

    if (!geminiType) {
        if (jsonSchema.properties) {
            return { 
                type: Type.OBJECT, 
                properties: convertProperties(jsonSchema.properties), 
                required: jsonSchema.required 
            };
        }
        return { type: Type.STRING };
    }

    const result: Schema = { type: geminiType };

    if (jsonSchema.description) {
        result.description = jsonSchema.description;
    }

    if (jsonSchema.enum) {
        result.enum = jsonSchema.enum;
    }

    if (geminiType === Type.OBJECT && jsonSchema.properties) {
        result.properties = convertProperties(jsonSchema.properties);
        if (jsonSchema.required) {
            result.required = jsonSchema.required;
        }
    } else if (geminiType === Type.ARRAY && jsonSchema.items) {
        result.items = toGeminiSchema(jsonSchema.items);
    }

    return result;
}

function convertProperties(properties: Record<string, any>): Record<string, Schema> {
    const converted: Record<string, Schema> = {};
    for (const [key, value] of Object.entries(properties)) {
        converted[key] = toGeminiSchema(value);
    }
    return converted;
}

const options = { $refStrategy: "none" } as const;

const convert = (schema: any) => {
    const json = zodToJsonSchema(schema, options) as Record<string, any>; 
    return toGeminiSchema(json);
};

export const atoGerarSugestoesSchema = convert(zAtoGerarSugestoesSchema);
export const atoGerarSugestoesDivergenciaSchema = convert(zAtoGerarSugestoesDivergenciaSchema);
export const peticaoGerarSugestoesSchema = convert(zPeticaoGerarSugestoesSchema);
export const analiseProcessualSchema = convert(zAnaliseProcessualSchema);
export const analiseVotoRelatorSchema = convert(zAnaliseVotoRelatorSchema);
export const peticaoExtrairDadosSchema = convert(zPeticaoExtrairDadosSchema);
export const peticaoIdentificarPartesSchema = convert(zPeticaoIdentificarPartesSchema);
export const peticaoAnalisePreliminarSchema = convert(zPeticaoAnalisePreliminarSchema);
export const revisorIntentSchema = convert(zRevisorIntentSchema);
