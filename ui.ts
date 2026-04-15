
import { Language } from './types';

export const getUI = (lang: Language) => {
    const isPT = lang === 'pt-BR';
    return {
        initialScreen: {
            title: isPT ? "Dju Assessoria Jurídica" : "Dju Legal Assistant",
            subtitle: isPT ? "Seu assistente com I.A. para tarefas jurídicas com mais agilidade e precisão." : "Your A.I. assistant for legal tasks with greater agility and precision.",
            selectModel: isPT ? "Selecione o Modelo de IA" : "Select AI Model",
            selectTask: isPT ? "Escolha uma Tarefa:" : "Choose a Task:",
            modelBadgeNew: isPT ? "Novo" : "New",
            modelBadgeFast: isPT ? "Rápido" : "Fast",
            taskAtoTitle: isPT ? "Elaborar Ato Decisório ou Parecer" : "Draft Legal Decision",
            taskAtoDesc: isPT ? "Siga um fluxo de trabalho guiado para criar decisões, sentenças, votos e mais." : "Follow a guided workflow to create decisions, sentences, votes, and more.",
            taskTemplateTitle: isPT ? "Gerar Template" : "Generate Template",
            taskTemplateDesc: isPT ? "Envie modelos de documentos e o Dju criará um template personalizado com seu estilo de escrita." : "Upload document samples and Dju will create a custom template.",
            taskEmentaTitle: isPT ? "Gerar Ementa" : "Generate Syllabus (Ementa)",
            taskEmentaDesc: isPT ? "Forneça um voto ou dados do processo para gerar a Ementa." : "Provide a vote or case data to generate the Syllabus.",
            taskPeticaoTitle: isPT ? "Elaborar Petição" : "Draft Petition",
            taskPeticaoDesc: isPT ? "Elabore diversos tipos de Petições, com qualidade técnica e argumentos persuasivos." : "Specialized assistant for drafting initials, defenses, appeals and more.",
            taskRevisorTitle: isPT ? "Gerar Relatório de Revisão" : "Generate Review Report",
            taskRevisorDesc: isPT ? "Gere relatórios de revisão detalhados de documentos jurídicos." : "Generate detailed review reports of legal documents.",
            taskEditTitle: isPT ? "Editar Texto" : "Edit Text",
            taskEditDesc: isPT ? "Faça ajustes e melhorias em seus textos com o auxílio de I.A." : "Chat with Dju and edit texts with AI assistance.",
            footerLink: isPT ? 'Conheça a aula gratuita do curso "Dju Assessoria Jurídica + O Futuro da I.A."' : 'Learn more about the free class "Dju Legal Assistant + The Future of AI"',
            footerNote: isPT ? "Lembre-se: Sempre revise as respostas e atos elaborados pelo Dju." : "Remember: Always review the responses and documents prepared by Dju.",
            educationalNotice: isPT ? "O Dju foi desenvolvido primariamente para fins educacionais." : "Dju was developed primarily for educational purposes.",
            editorInitialGreeting: isPT 
                ? '**Dju Assessoria Jurídica:**\nOlá! Você pode digitar ou colar seu texto no editor ao lado.\n\nSe quiser, pode me pedir para **reescrever** o texto, ou me dar instruções específicas de como deseja alterá-lo.\n\nTambém é possível **anexar documentos pertinentes** (como atos e peças processuais) usando o botão de clipe abaixo, para que eu os considere durante a análise e edição do seu texto.\n\n---\n\n'
                : '**Dju Legal Assistant:**\nHello! You can type or paste your text in the editor on the right.\n\nIf you want, you can ask me to **rewrite** the text, or give me specific instructions on how you want to change it.\n\nYou can also **attach relevant documents** (like acts and procedural pieces) using the clip button below, so I can consider them during the analysis and editing of your text.\n\n---\n\n'
        },
        sidebar: {
            workflow: isPT ? "Fluxo de Trabalho" : "Workflow",
            summaryAndMenu: isPT ? "a. Análise Processual" : "a. Case Analysis",
            points: isPT ? "b. Pontos Controvertidos" : "b. Controversial Points"
        },
        actions: {
            copyText: isPT ? "Copiar Texto" : "Copy Text",
            copied: isPT ? "Copiado!" : "Copied!",
            editText: isPT ? "Editar Texto" : "Edit Text",
            finishEdit: isPT ? "Concluir Edição" : "Finish Editing",
            generateEmenta: isPT ? "Gerar Ementa" : "Generate Syllabus",
            generating: isPT ? "Gerando..." : "Generating...",
            redo: isPT ? "Reescrever" : "Rewrite",
            restart: isPT ? "Retornar ao Início" : "Return to Start",
            send: isPT ? "Enviar" : "Send",
            attach: isPT ? "Anexar Arquivos" : "Attach Files",
            proceed: isPT ? "Prosseguir" : "Proceed",
            finalize: isPT ? "Finalizar e Prosseguir" : "Finalize and Proceed",
            back: isPT ? "Voltar" : "Back",
            cancel: isPT ? "Cancelar" : "Cancel",
            save: isPT ? "Salvar" : "Save",
            confirmProceed: isPT ? "Confirmar e Prosseguir" : "Confirm and Proceed",
            confirmSelection: isPT ? "Confirmar Seleção e Prosseguir" : "Confirm Selection and Proceed",
            confirmBases: isPT ? "Confirmar Argumentos e Prosseguir" : "Confirm Arguments and Proceed",
            next: isPT ? "Próximo" : "Next",
            previous: isPT ? "Anterior" : "Previous",
            readMore: isPT ? "Ler mais" : "Read more",
            readLess: isPT ? "Ler menos" : "Read less",
            hideFundamentation: isPT ? "Ocultar análise da pesquisa" : "Hide research analysis",
            readFundamentation: isPT ? "Ler análise integral da pesquisa" : "Read full research analysis",
            searchWeb: isPT ? "Pesquisar na Web" : "Search Web",
            webSearchTitle: isPT ? "Pesquisar na Web" : "Web Search",
            webSearchTitleResult: isPT ? "Argumentos Sugeridos pela Pesquisa Web:" : "Arguments Suggested by Web Search:",
            redoSearch: isPT ? "Refazer Pesquisa" : "Redo Search",
            searching: isPT ? "Pesquisando..." : "Searching...",
            tryAgain: isPT ? "Tentar Novamente" : "Try Again",
            tryModel: isPT ? "Tentar com outro modelo" : "Try with another model",
            addManual: isPT ? "Adicionar outros argumentos:" : "Add other arguments:",
            manualPlaceholder: isPT ? "Cole ou descreva aqui a jurisprudência, legislação ou outros argumentos..." : "Paste or describe jurisprudence, legislation, or other arguments here...",
            savedBases: isPT ? "Salvo!" : "Saved!",
            dispenseAnalysis: isPT ? "Dispensar análise" : "Dismiss analysis",
            reactivatePoint: isPT ? "Reativar ponto" : "Reactivate point",
            pointCounter: (current: number, total: number) => isPT ? `Ponto Controvertido #${current} de ${total}` : `Controversial Point #${current} of ${total}`,
            attachTemplate: isPT ? "Anexar template e/ou instruções (opcional)" : "Attach template and/or instructions (optional)",
            attachTemplateDesc: isPT ? "Se não desejar fornecer um modelo, apenas clique no botão abaixo para gerar a minuta." : "If you do not wish to provide a template, just click the button below to generate the draft.",
            generateFinal: isPT ? "Gerar Minuta" : "Generate Final Draft",
            yourAnswer: isPT ? "Sua resposta:" : "Your answer:",
            attachedFiles: isPT ? "ARQUIVOS ANEXADOS" : "ATTACHED FILES",
            suggestionsLabel: isPT ? "Sugestões de resposta:" : "Suggested answers:",
            selectOption: isPT ? "Selecione uma opção:" : "Select an option:",
            analyzing: isPT ? "Analisando..." : "Analyzing...",
            backToSummary: isPT ? "Voltar ao Relato dos Fatos" : "Back to Facts Summary",
            analyzePoints: isPT ? "Analisar Pontos Controvertidos" : "Analyze Controversial Points",
            waitingSummary: isPT ? "Aguarde enquanto o assistente elabora o relato dos fatos..." : "Please wait, the assistant is drafting the summary of facts...",
            generatingSuggestionsTitle: isPT ? "Gerando Sugestões..." : "Generating Suggestions...",
            generatingSuggestionsDesc: isPT ? "O Dju está analisando os pontos controvertidos para criar os melhores argumentos." : "Dju is analyzing the controversial points to create the best arguments.",
            overloadTitle: isPT ? "Não foi possível utilizar este modelo no momento." : "Unable to use this model at the moment.",
            quotaExceededTitle: isPT ? "Cota de Uso Excedida (Erro 429)" : "Usage Quota Exceeded (Error 429)",
            quotaExceededDesc: isPT ? "Você atingiu o limite de requisições gratuitas do AI Studio. Aguarde alguns instantes ou tente novamente mais tarde." : "You have reached the free request limit of AI Studio. Please wait a few moments or try again later.",
            overloadRetryOption: isPT ? "Tente novamente ou escolha outro modelo abaixo:" : "Try again or choose another model below:",
            useModel: (m: string) => isPT ? `Usar ${m}` : `Use ${m}`,
            retryCurrent: isPT ? "Tentar Novamente (Mesmo Modelo)" : "Try Again (Same Model)",
            warningLite: isPT ? "Aviso: resultados menos satisfatórios" : "Warning: less satisfactory results",
            skipStep: isPT ? "Pular esta etapa e ir para a minuta" : "Skip this step and go to draft",
            searchArgumentsTitle: isPT ? "Argumentos Sugeridos pela Pesquisa Web" : "Arguments Suggested by Web Search",
            sourcesLabel: isPT ? "Fontes Consultadas (Links):" : "Consulted Sources (Links):",
            positionSelected: isPT ? "Argumento Selecionado" : "Argument Selected",
            adoptPosition: isPT ? "Adotar este argumento" : "Adopt this argument",
            noSearch: isPT ? "Nenhuma pesquisa realizada para este ponto ainda. Clique no botão acima para buscar fundamentos externos atualizados." : "No search performed for this point yet. Click the button above to search for updated external grounds.",
            addFilesOrDesc: isPT ? "Adicionar jurisprudência, legislação ou outros argumentos manualmente..." : "Add jurisprudence, legislation or other arguments manually...",
            dispensePoint: isPT ? "Dispensar a indicação de bases para este(s) ponto(s)" : "Dismiss indication of bases for this point(s)",
            pointDispensedMsg: isPT ? "Análise dispensada para este ponto. Os argumentos não serão incluídos na minuta final." : "Analysis dismissed for this point. Arguments will not be included in the final draft.",
            pointsRemaining: (rem: number, total: number) => isPT ? `Pontos Restantes: ${rem} de ${total}` : `Remaining Points: ${rem} of ${total}`,
            allPointsAddressed: isPT ? "Todos os pontos foram abordados." : "All points have been addressed.",
            provideBasesPrefix: isPT ? "Bases para a fundamentação: " : "Bases for the foundation: ",
            provideBasesForSelected: isPT ? "Para o(s) ponto(s) selecionado(s), anexe arquivos ou descreva as bases argumentativas abaixo." : "For the selected point(s), attach files or describe the argumentative bases below.",
            examplesLabel: isPT ? "Alternativamente, você pode selecionar uma das opções dentre os seguintes exemplos de bases argumentativas:" : "Alternatively, you can select one of the following examples of argumentative bases:",
            generatedEmenta: isPT ? "Ementa Gerada" : "Generated Syllabus",
            copyEmenta: isPT ? "Copiar Ementa" : "Copy Syllabus",
            analyzingEmenta: isPT ? "Analisando o ato e gerando a ementa..." : "Analyzing the act and generating the syllabus...",
            typeMessagePlaceholder: isPT ? "Digite sua mensagem ou anexe arquivos..." : "Type your message or attach files...",
            
            tokenLimitTitle: isPT ? "Limite de conteúdo excedido" : "Content limit exceeded",
            tokenLimitDesc: isPT ? "O volume de dados (arquivos e textos) ultrapassou o limite suportado pelo modelo (aprox. 1 milhão de tokens)." : "The volume of data (files and text) exceeded the model's limit (approx. 1 million tokens).",
            tokenLimitAction: isPT ? "Para prosseguir, clique abaixo para descartar o estado atual e envie uma quantidade menor de arquivos ou textos mais curtos." : "To proceed, click below to discard current state and send fewer files or shorter texts.",
            
            fileSizeLimitTitle: isPT ? "Arquivo muito grande" : "File too large",
            fileSizeLimitDesc: isPT ? "O tamanho do documento excede o limite suportado (50MB). Por favor, reduza o tamanho do arquivo ou divida-o em partes menores." : "The document size exceeds the supported limit (50MB). Please reduce the file size or split it into smaller parts.",
            fileSizeLimitAction: isPT ? "Para prosseguir, clique abaixo para descartar o estado atual e envie arquivos menores." : "To proceed, click below to discard current state and send smaller files.",
            
            specifyTypeInput: isPT ? "Por favor, especifique qual o tipo de ato decisório que deseja elaborar:" : "Please specify which type of legal decision you wish to draft:",
            divergentFlowIntro: isPT 
                ? "Certo, elaboraremos um Voto Divergente. Por favor, forneça os dados do processo (número, partes, documentos relevantes). Na próxima etapa, solicitarei o voto do Relator."
                : "Right, we will draft a Divergent Vote. Please provide the case data (number, parties, relevant documents). In the next step, I will ask for the Rapporteur's vote.",
            standardFlowIntro: (type: string) => isPT
                ? `Entendido, vamos elaborar: ${type}. Agora, preciso que você forneça os dados do processo. Você pode descrever o caso aqui ou anexar os arquivos (PDF, Word, etc.) contendo os documentos e peças processuais relevantes.`
                : `Understood, let's draft: ${type}. Now, I need you to provide the case data. You can describe the case here or attach files (PDF, Word, etc.) containing the initial petition, defense, sentence, or whatever is relevant.`,
            divergentRequestRelator: isPT
                ? "Dados do processo recebidos. Agora, por favor, cole ou anexe o texto do **Voto do Relator** do qual você deseja divergir."
                : "Case data received. Now, please paste or attach the text of the **Rapporteur's Vote** from which you wish to diverge.",
            divergentBasesTitle: isPT ? '5. Bases da Divergência' : '5. Bases for Divergence',
            divergentBasesSubtitle: isPT ? 'Defina os fundamentos para os pontos selecionados. Você pode fornecer as bases argumentativas ou pedir sugestões.' : 'Define the grounds for the selected points. You can provide the bases or ask for suggestions.',
            divergentOptions: isPT ? ['Quero fornecer os argumentos para a divergência', 'Pedir sugestões de argumentos ao Dju'] : ['Provide bases for divergence', 'Ask Dju to suggest bases'],
            caseDataTitle: isPT ? '2. Dados do Processo' : '2. Case Data',
            confirmTitle: (isDivergent: boolean) => isPT 
                ? (isDivergent ? '6. Confirmação do Resultado' : '4. Confirmação do Resultado') 
                : (isDivergent ? '6. Outcome Confirmation' : '4. Outcome Confirmation'),
            divergentTemplateTitle: isPT ? '6. Template (opcional)' : '6. Template (optional)',
            draftDivergentTitle: isPT ? '7. Minuta do Voto Divergente' : '7. Divergent Vote Draft',
            draftOpinionTitle: isPT ? '5. Minuta do Parecer' : '5. Opinion Draft',
            draftDecisionTitle: isPT ? '5. Minuta do Ato Decisório' : '5. Legal Decision Draft',
        },
        loadingTips: isPT ? [
            "⚖️ Você pode fornecer argumentos ou pedir sugestões ao Dju.",
            "🧠 O Dju utiliza modelos de IA avançados para garantir a melhor redação jurídica.",
            "🔍 Sempre revise o resultado final para garantir a precisão técnica.",
            "📂 Para obter melhores resultados, prefira anexar arquivos com até 300 páginas (no total).",
            "📝 Utilize um Template para manter seu estilo de escrita.",
            "💡 Dica: Você pode solicitar pesquisas na web e também adicionar argumentos manualmente para cada ponto controvertido.",
            "💡 Dica: Ao final, você pode selecionar um trecho do texto e clicar em “Ajustar com I.A.” para alterar sua extensão ou tom.",
            "⚠️ Aviso: Sempre confira as informações da pesquisa web nos links das fontes consultadas."
        ] : [
            "💡 Dju does not invent facts, only analyzes what you send.",
            "⚖️ Impartiality is the focus when drafting legal decisions.",
            "📜 You can ask Dju to suggest arguments or provide your own.",
            "🧠 Dju uses advanced AI models to ensure the best legal writing.",
            "🔍 Always review the final result to ensure technical accuracy.",
            "📂 Attaching PDF documents helps Dju understand the context better.",
            "⚡ Dju can search for updated jurisprudence on the web (Google Search).",
            "📝 Use the Template step to maintain your writing style.",
            "💡 Tip: You can request web searches and manually add arguments for each controversial point.",
            "💡 Tip: At the end, you can select a text segment and click “Adjust with A.I.” to change its length or tone.",
            "⚠️ Warning: Always verify information and web search results by visiting the source links."
        ],
        templateStepTip: isPT 
            ? "💡 Dica: Ao final, você poderá selecionar trechos do texto e usar o 'Ajustar com I.A.' para refinar a extensão e o tom."
            : "💡 Tip: At the end, you can select text segments and use 'Adjust with A.I.' to refine length and tone.",
        loadingMarketing: {
            intro: isPT ? "Clique no link abaixo para abrir a aula em uma nova página." : "Want to master AI?",
            linkText: isPT ? "Conheça a aula gratuita do curso Dju + O Futuro da I.A." : "Click here to watch the free class"
        }
    };
};

export const getMenuOptions = (lang: Language) => {
    const isPT = lang === 'pt-BR';
    return isPT ? [
        { label: "Dados do processo", prompt: "Dados do processo, tipo de ação/recurso;" },
        { label: "Fundamentos das partes", prompt: "Descreva de forma minuciosa os fundamentos jurídicos expostos pelas partes." },
        { label: "Fundamentos da decisão recorrida", prompt: "Descreva de forma minuciosa os fundamentos jurídicos expostos na fundamentação da decisão recorrida." },
        { label: "Preparo ou custas", prompt: "Informe sobre o recolhimento do preparo recursal ou das custas processuais." },
        { label: "Provas", prompt: "A descrição das provas expressamente referenciadas e/ou anexadas no processo." },
        { label: "Manifestação do MP/Defensoria", prompt: "Se houver, relate os fundamentos jurídicos apresentados pelo Ministério Público, Defensoria Pública e/ou terceiro interessado." },
        { label: "Dispositivos legais citados", prompt: "Os dispositivos legais relevantes citados expressamente." },
        { label: "Jurisprudência citada", prompt: "A jurisprudência relevante citada (identificando os Acórdãos, Súmulas, Temas, etc)." },
        { label: "Próximo andamento", prompt: "Descreva qual o próximo andamento processual, considerando as manifestações e decisões anteriores." },
        { label: "Palavras-chave e indexação", prompt: "As cinco palavras-chave/expressões e uma frase sintética que sirvam para indexar o processo, a partir dos fatos mais específicos, da tese jurídica central e da legislação aplicável." }
    ] : [
        { label: "Case data", prompt: "Case data, type of action/appeal;" },
        { label: "Parties' legal grounds", prompt: "Meticulously describe the legal grounds exposed by the parties;" },
        { label: "Appealed decision grounds", prompt: "In cases of appeals, meticulously describe the legal grounds set out in the reasoning of the appealed decision/sentence;" },
        { label: "Appellate fees or costs", prompt: "Inform about the payment of appellate fees or procedural costs;" },
        { label: "Evidence", prompt: "Description of evidence expressly referenced and/or attached in the process;" },
        { label: "Prosecutor/Defender opinion", prompt: "If any, report the legal grounds presented by the Public Prosecutor, Public Defender, and/or third parties;" },
        { label: "Legal provisions", prompt: "Relevant legal provisions expressly cited;" },
        { label: "Jurisprudence", prompt: "Relevant jurisprudence cited (identifying Judgments, Summaries, Themes, etc);" },
        { label: "Next procedural step", prompt: "The next procedural step, considering previous manifestations and decisions;" },
        { label: "Keywords and indexing", prompt: "Five keywords/expressions and a synthetic phrase to index the process, based on specific facts, central legal thesis, and applicable legislation." }
    ];
};

export const getArgumentSuggestionsButtons = (lang: Language) => {
    const isPT = lang === 'pt-BR';
    const prefix = "Bases para a fundamentação: ";
    return isPT ? [
        { label: "Petição do recurso", promptText: `${prefix}adotar os fundamentos da petição do recurso. Resultado: DAR PROVIMENTO ao recurso.` },
        { label: "Contrarrazões", promptText: `${prefix}adotar os fundamentos da petição de contrarrazões. Resultado: NEGAR PROVIMENTO ao recurso.` },
        { label: "Decisão recorrida", promptText: `${prefix}adotar os fundamentos da decisão/sentença recorrida. Resultado: MANTER a decisão.` },
        { label: "Manifestação do MP", promptText: `${prefix}adotar os fundamentos da manifestação do Ministério Público. Resultado: DAR PROVIMENTO ao recurso.` },
        { label: "Petição inicial", promptText: `${prefix}adotar os fundamentos da petição inicial. Resultado: JULGAR PROCEDENTE o pedido.` }
    ] : [
        { label: "Appeal petition", promptText: `${prefix}adopt the grounds of the appeal petition. Result: GRANT the appeal.` },
        { label: "Counter-arguments", promptText: `${prefix}adopt the grounds of the counter-arguments petition. Result: DENY the appeal.` },
        { label: "Appealed decision", promptText: `${prefix}adopt the grounds of the appealed decision/sentence. Result: MAINTAIN the decision.` },
        { label: "Prosecutor's opinion", promptText: `${prefix}adopt the grounds of the Public Prosecutor's opinion. Result: GRANT the appeal.` },
        { label: "Initial petition", promptText: `${prefix}adopt the grounds of the initial petition. Result: JUDGE the request as MERITED.` }
    ];
};
