
import { Part } from '@google/genai';

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
};

const MAMMOTH_WORKER_CODE = `
    import * as mammoth from 'https://aistudiocdn.com/mammoth@^1.11.0';

    self.onmessage = async (e) => {
        const { arrayBuffer } = e.data;
        try {
            const extractor = mammoth.extractRawText || (mammoth.default && mammoth.default.extractRawText);
            
            if (!extractor) {
                throw new Error("Mammoth library not loaded correctly in worker.");
            }

            const result = await extractor({ arrayBuffer });
            self.postMessage({ type: 'success', text: result.value });
        } catch (error) {
            self.postMessage({ type: 'error', error: error.message || String(error) });
        }
    };
`;

const createMammothWorker = () => {
    const blob = new Blob([MAMMOTH_WORKER_CODE], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    return new Worker(workerUrl, { type: "module" });
};

export const fileToGenerativePart = async (file: File): Promise<Part> => {
    const mimeType = file.type;
    const fileName = file.name;

    if (mimeType === 'text/plain' || fileName.endsWith('.txt')) {
         return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = () => {
                const textContent = reader.result as string;
                 resolve({
                    text: `\n\n>>> INÍCIO DE PEÇA/DOCUMENTO (IDENTIFICAR TIPO PELO CONTEÚDO) >>>\n\n${textContent}\n\n<<< FIM DO CONTEÚDO <<<\n\n`,
                });
            };
            reader.onerror = (error) => reject(error);
        });
    }

    if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.endsWith('.docx') ||
        mimeType === 'application/msword' ||
        fileName.endsWith('.doc')
    ) {
        return new Promise(async (resolve, _reject) => {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const worker = createMammothWorker();

                worker.onmessage = (e) => {
                    const { type, text, error } = e.data;
                    worker.terminate();

                    if (type === 'success') {
                        resolve({
                            text: `\n\n>>> INÍCIO DE PEÇA/DOCUMENTO (IDENTIFICAR TIPO PELO CONTEÚDO) >>>\n\n${text}\n\n<<< FIM DO CONTEÚDO <<<\n\n`,
                        });
                    } else {
                        console.error('Worker error parsing Word document:', error);
                        resolve({
                            text: `\n\n--- Falha ao processar o arquivo ${fileName}. Não foi possível extrair o texto. O arquivo pode estar corrompido ou em um formato não suportado. Erro: ${error} ---`,
                        });
                    }
                };

                worker.onerror = (e) => {
                    worker.terminate();
                    const msg = (e instanceof ErrorEvent) ? e.message : 'Erro desconhecido no carregamento do worker';
                    console.error('Worker infrastructure error:', e);
                    resolve({
                        text: `\n\n--- Falha crítica ao processar o arquivo ${fileName}. Detalhe: ${msg}. ---`,
                    });
                };

                worker.postMessage({ arrayBuffer, fileName }, [arrayBuffer]);

            } catch (error) {
                 console.error('Error preparing file for worker:', error);
                 resolve({
                    text: `\n\n--- Falha ao ler o arquivo ${fileName}. ---`,
                });
            }
        });
    }

    const base64Data = await fileToBase64(file);
    return {
        inlineData: {
            mimeType: mimeType,
            data: base64Data,
        },
    };
};

export const prepareInputParts = async (
    userInput: { text: string; files?: File[] }, 
    prependedParts: Part[] | { text: string }[] = []
): Promise<Part[]> => {
    const fileParts = userInput.files ? await Promise.all(userInput.files.map(fileToGenerativePart)) : [];
    
    const parts: Part[] = [
        ...prependedParts,
        ...fileParts,
    ] as Part[];
    
    if (userInput.text && userInput.text.trim() !== '') {
        parts.push({ text: userInput.text });
    }
    
    return parts;
};