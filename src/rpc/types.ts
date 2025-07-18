import z from 'zod';

export const CollectionNameDto = z.string()
    .nonempty()
    .describe('The collection name');

export const ContextDto = z.object({
    tags: z.array(z.string()).optional(),
    key: z.string().optional(),
    type: z.string().optional(),
    limit: z.number().optional(),
    collection: CollectionNameDto
}).describe('Context settings');

export const GenerationOptionsDto = z.object({
    temperature: z.number().optional(),
    topK: z.number().optional(),
    topP: z.number().optional(),
    minP: z.number().optional(),
    suffix: z.string().optional(),
    think: z.boolean().optional(),
    model: z.string().optional(),
    format: z.string().optional()
}).describe('Additional LLM options');
