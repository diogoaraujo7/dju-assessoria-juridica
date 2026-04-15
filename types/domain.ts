
export type Language = 'pt-BR' | 'en-US';

export enum StepType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  DOCUMENT = 'DOCUMENT',
  CHOICE_THEN_INPUT = 'CHOICE_THEN_INPUT',
  ARGUMENT_SUGGESTION = 'ARGUMENT_SUGGESTION',
  POINT_SELECTION = 'POINT_SELECTION',
  FORM = 'FORM',
  CHAT = 'CHAT',
}

export enum UserAction {
  PROCEED = 'PROCEED',
  MANUAL_INPUT = 'MANUAL_INPUT',
  GENERATE_SUGGESTIONS = 'GENERATE_SUGGESTIONS',
  CONFIRM = 'CONFIRM',
  REJECT = 'REJECT',
  SKIP_BASES = 'SKIP_BASES',
  SELECT_OPTION = 'SELECT_OPTION',
  SELECT_PARTY = 'SELECT_PARTY'
}

export enum AtoType {
  DECISAO_LIMINAR = 'Decisão liminar',
  SENTENCA = 'Sentença',
  VOTO = 'Voto',
  VOTO_DIVERGENTE = 'Voto Divergente',
  VOTO_DIVERGENTE_EN = 'Divergent Vote',
  PARECER = 'Parecer',
  OUTRO = 'Outro'
}

export enum Task {
  ATO_DECISORIO = 'ATO_DECISORIO',
  TEMPLATE = 'TEMPLATE',
  EMENTA = 'EMENTA',
  PETICAO = 'PETICAO',
  REVISOR = 'REVISOR',
  EDITOR = 'EDITOR',
}

export const WorkflowTriggers = {
  SPECIFY_KEYWORD_PT: "especificado:",
  SKIP_BASES: "pular_etapa_bases",
  BASES_PREFIX: "Bases para a fundamentação: ",
  ANALYSIS_DISMISSED: "análise foi dispensada",
  DISPENSE_CMD: "DISPENSE",
  CMD_APLICAR_SOLUCOES: "CMD_APLICAR_SOLUCOES"
} as const;

export const PetitionIdentifiers = {
  INITIAL_PETITION: '1.',
  TEMPLATE_PETITION_OPTION: '7.',
  SPECIAL_ORAL: '11.',
  SPECIAL_EXPERTS: '12.',
  SPECIAL_HEARING: '13.',
  SPECIFY_PLACEHOLDER_PT: '(a especificar)',
  SPECIFY_PLACEHOLDER_EN: '(specify)'
} as const;

export const isDivergent = (text: string | null | undefined): boolean => {
  if (!text) return false;
  return text.includes(AtoType.VOTO_DIVERGENTE) || text.includes(AtoType.VOTO_DIVERGENTE_EN);
};

export const isSpecialPetition = (text: string | null | undefined): boolean => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return lowerText.includes('sustentação oral') || lowerText.includes('oral argument') ||
         lowerText.includes('quesitos periciais') || lowerText.includes('expert questions') ||
         lowerText.includes('perguntas para audiência') || lowerText.includes('hearing questions');
};

export const GeneralSteps = {
  TASK_SELECTION: 'TASK_SELECTION',
  FINALIZADO: 'FINALIZADO',
} as const;

export const AtoDecisorioSteps = {
  ELABORAR_ATO: 'ELABORAR_ATO',
  ATO_TIPO: 'ATO_TIPO',
  ATO_DADOS_PROCESSO: 'ATO_DADOS_PROCESSO',
  ATO_VOTO_RELATOR: 'ATO_VOTO_RELATOR',
  ATO_PONTOS_DIVERGENCIA: 'ATO_PONTOS_DIVERGENCIA',
  ATO_ANALISE_PROCESSUAL: 'ATO_ANALISE_PROCESSUAL',
  ATO_TEMPLATE: 'ATO_TEMPLATE',
} as const;

export const TemplateSteps = {
  TEMPLATE_TIPO_DE_ATO: 'TEMPLATE_TIPO_DE_ATO',
  TEMPLATE_PETICAO_SUBTIPO: 'TEMPLATE_PETICAO_SUBTIPO',
  TEMPLATE_UPLOAD: 'TEMPLATE_UPLOAD',
  TEMPLATE_RESULTADO: 'TEMPLATE_RESULTADO',
} as const;

export const EmentaSteps = {
  EMENTA_UPLOAD: 'EMENTA_UPLOAD',
  EMENTA_RESULTADO: 'EMENTA_RESULTADO',
} as const;

export const PeticaoSteps = {
  PETICAO_TIPO: 'PETICAO_TIPO',
  PETICAO_DADOS: 'PETICAO_DADOS',
  PETICAO_ANALISE: 'PETICAO_ANALISE',
  PETICAO_TEMPLATE: 'PETICAO_TEMPLATE',
  ELABORAR_PETICAO: 'ELABORAR_PETICAO',
} as const;

export const RevisorSteps = {
  REVISOR_UPLOAD_LINHA_BASE: 'REVISOR_UPLOAD_LINHA_BASE',
  REVISOR_UPLOAD_DOC_ANALISE: 'REVISOR_UPLOAD_DOC_ANALISE',
  REVISOR_ANALISE: 'REVISOR_ANALISE',
  REVISOR_RESULTADO_FINAL: 'REVISOR_RESULTADO_FINAL',
} as const;

export const EditorSteps = {
  EDITOR_EDITAR_TEXTO: 'EDITOR_EDITAR_TEXTO',
  EDITOR_CHAT_LIVRE: 'EDITOR_CHAT_LIVRE',
  EDITOR_PENDING_EDIT: 'EDITOR_PENDING_EDIT',
} as const;

export type GeneralStep = typeof GeneralSteps[keyof typeof GeneralSteps];
export type AtoDecisorioStep = typeof AtoDecisorioSteps[keyof typeof AtoDecisorioSteps];
export type TemplateStep = typeof TemplateSteps[keyof typeof TemplateSteps];
export type EmentaStep = typeof EmentaSteps[keyof typeof EmentaSteps];
export type PeticaoStep = typeof PeticaoSteps[keyof typeof PeticaoSteps];
export type RevisorStep = typeof RevisorSteps[keyof typeof RevisorSteps];
export type EditorStep = typeof EditorSteps[keyof typeof EditorSteps];

export type Step = 
  | GeneralStep 
  | AtoDecisorioStep 
  | TemplateStep 
  | EmentaStep 
  | PeticaoStep 
  | RevisorStep
  | EditorStep;

export const Step = {
  ...GeneralSteps,
  ...AtoDecisorioSteps,
  ...TemplateSteps,
  ...EmentaSteps,
  ...PeticaoSteps,
  ...RevisorSteps,
  ...EditorSteps,
} as const;
