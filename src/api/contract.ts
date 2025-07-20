import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

const CollectionName = z.string().describe('The collection name');

const SuccessResponse = z.boolean();

const Collection = z.object({
    name: z.string()
});

const DeleteCollectionRequest = z.object({
    collection: CollectionName
});

const DeletePointsRequest = z.object({
    collection: CollectionName,
    key: z.string()
});

const Context = z.object({
    tags: z.array(z.string()).optional(),
    key: z.string().optional(),
    type: z.string().optional(),
    limit: z.number().optional(),
    collection: CollectionName
}).describe('Context settings');

const GenerationOptions = z.object({
    temperature: z.number().optional(),
    topK: z.number().optional(),
    topP: z.number().optional(),
    minP: z.number().optional(),
    suffix: z.string().optional(),
    think: z.boolean().optional(),
    model: z.string().optional(),
    format: z.string().optional()
}).describe('Additional LLM options');

const EmbedTextRequest = z.object({
    text: z.string().nonempty(),
    title: z.string().optional(),
    context: Context
});

const GenerateTextRequest = z.object({
    text: z.string(),
    context: Context.optional(),
    options: GenerationOptions.optional()
});

const GenerateTextResponse = z.object({
    choices: z.array(
        z.object({
            text: z.string()
        })
    ),
    usage: z.object({
        completion_tokens: z.number()
    })
});

const FindSimilarQuery = z.object({
    text: z.string().nonempty(),
    context: Context
});

const FindSimilarResponse = z.array(
    z.object({
        score: z.number(),
        payload: z.record(z.string(), z.unknown())
    })
);

export const contract = c.router({
    deleteCollection: {
        method: 'POST',
        path: '/deleteCollection',
        body: DeleteCollectionRequest,
        responses: {
            200: SuccessResponse,
        },
        summary: 'Delete collection by name',
    },
    deletePoints: {
        method: 'POST',
        path: '/deletePoints',
        body: DeletePointsRequest,
        responses: {
            200: SuccessResponse,
        },
        summary: 'Delete points from collection by key identifier',
    },
    getCollections: {
        method: 'GET',
        path: '/getCollections',
        responses: {
            200: z.array(Collection),
        },
        summary: 'Get all collections',
    },
    embedText: {
        method: 'POST',
        path: '/embedText',
        body: EmbedTextRequest,
        responses: {
            200: SuccessResponse,
        },
        summary: 'Embed text to vector database',
    },
    generateText: {
        method: 'POST',
        path: '/generateText',
        body: GenerateTextRequest,
        responses: {
            200: GenerateTextResponse,
        },
        summary: 'Generate text complection',
    },
    findSimilar: {
        method: 'GET',
        path: '/findSimilar',
        query: FindSimilarQuery,
        responses: {
            200: FindSimilarResponse,
        },
        summary: 'Find similar text chunks',
    },
});
