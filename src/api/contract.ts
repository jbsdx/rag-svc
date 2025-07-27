import { initContract } from '@ts-rest/core';
import { z } from 'zod';

export type SecurityRequirementObject = Record<string, string[]>;

const openApiSecurity: SecurityRequirementObject[] = [{
    ApiKey: []
}];

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
    collection: CollectionName,
    key: z.string().optional(),
    limit: z.number().optional(),
    tags: z.array(z.string()).optional(),
    type: z.string().optional()
}).describe('Context settings');

const GenerationOptions = z.object({
    format: z.string().optional(),
    minP: z.number().optional(),
    model: z.string().optional(),
    suffix: z.string().optional(),
    temperature: z.number().optional(),
    think: z.boolean().optional(),
    topK: z.number().optional(),
    topP: z.number().optional()
}).describe('Additional LLM options');

const EmbedTextRequest = z.object({
    context: Context,
    text: z.string().nonempty(),
    title: z.string().optional()
});

const GenerateTextRequest = z.object({
    context: Context.optional(),
    options: GenerationOptions.optional(),
    text: z.string()
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
    context: Context,
    text: z.string().nonempty()
});

const FindSimilarResponse = z.array(
    z.object({
        payload: z.record(z.string(), z.unknown()),
        score: z.number()
    })
);



export const contract = c.router({
    deleteCollection: {
        body: DeleteCollectionRequest,
        method: 'POST',
        path: '/deleteCollection',
        description: 'Delete vector collection',
        responses: {
            200: SuccessResponse,
        },
        metadata: {
            openApiSecurity,
            openApiTags: ['RAG']
        },
        summary: 'Delete collection by name',
    },
    deletePoints: {
        body: DeletePointsRequest,
        method: 'POST',
        path: '/deletePoints',
        description: 'Delete points from vector collection',
        responses: {
            200: SuccessResponse,
        },
        metadata: {
            openApiSecurity,
            openApiTags: ['RAG']
        },
        summary: 'Delete points from collection by key identifier',
    },
    embedText: {
        body: EmbedTextRequest,
        method: 'POST',
        path: '/embedText',
        description: 'Embed text to vector collection',
        responses: {
            200: SuccessResponse,
        },
        metadata: {
            openApiSecurity,
            openApiTags: ['RAG']
        },
        summary: 'Embed text to vector database',
    },
    findSimilar: {
        method: 'GET',
        path: '/findSimilar',
        query: FindSimilarQuery,
        description: 'Find similiar text chunks',
        responses: {
            200: FindSimilarResponse,
        },
        metadata: {
            openApiSecurity,
            openApiTags: ['RAG']
        },
        summary: 'Generate text complection',
    },
    generateText: {
        body: GenerateTextRequest,
        method: 'POST',
        path: '/generateText',
        description: 'Generate text with LLM provider',
        responses: {
            200: GenerateTextResponse,
        },
        metadata: {
            openApiSecurity,
            openApiTags: ['RAG']
        },
        summary: 'Generate text complection',
    },
    getCollections: {
        method: 'GET',
        path: '/getCollections',
        description: 'Get vector collections',
        summary: 'Get vector collections',
        metadata: {
            openApiSecurity,
            openApiTags: ['RAG']
        },
        responses: {
            200: z.array(Collection),
        },
    },
});
