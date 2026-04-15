
import { z } from 'zod';
import { zArgumentSchema, zAtoGerarSugestoesSchema } from '../schemas';

export type Argument = z.infer<typeof zArgumentSchema>;

export type ArgumentSuggestionData = z.infer<typeof zAtoGerarSugestoesSchema>[number];

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface GoogleSearchResult {
  analysis: string;
  searchArguments: Argument[];
  sources: GroundingChunk[];
  error?: 'overloaded' | 'other';
}
