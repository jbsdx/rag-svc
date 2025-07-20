import { initServer } from '@ts-rest/express';
import { contract } from './contract';
import { RouterService } from './service';

const s = initServer();

const service = new RouterService();

export const router = s.router(contract, {
    getCollections: async () => {
        const response = await service.getCollections();
        return {
            status: 200,
            body: response,
        };
    },
    deleteCollection: async ({ body: { collection } }) => {
        const response = await service.deleteCollection(collection);
        return {
            status: 200,
            body: response,
        };
    },
    deletePoints: async ({ body: { collection, key } }) => {
        const response = await service.deletePointsByKey(collection, key);
        return {
            status: 200,
            body: response,
        };
    },
    findSimilar: async ({ query: { context, text } }) => {
        const response = await service.findSimilar({
            context,
            text
        });
        return {
            status: 200,
            body: response.map(x => {
                return {
                    score: x.score,
                    payload: x.payload
                };
            }),
        };
    },
    generateText: async ({ body: { context, options, text } }) => {
        const response = await service.generateText({
            context,
            options,
            text
        });
        return {
            status: 200,
            body: response,
        };
    },
    embedText: async ({ body: { context, text, title } }) => {
        await service.embedText({
            context,
            text,
            title
        });
        return {
            status: 200,
            body: true,
        };
    },
});
