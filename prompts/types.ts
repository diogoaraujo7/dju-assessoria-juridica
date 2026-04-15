
import { Part } from '@google/genai';
import { ZodType } from 'zod';

export interface PromptFactoryResult {
    contents: Part[];
    schema?: any;
    zodSchema?: ZodType<any>;
}
