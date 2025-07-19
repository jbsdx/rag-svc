import { logger } from '../logger';
import { RAGService } from '../rag/service';

export class RouterService {
    ragService: RAGService;

    constructor() {
        this.ragService = new RAGService();
    }

    async findSimilar(payload: {
        text: string,
        context: Partial<{
            tags: string[],
            key: string,
            type: string,
            collection: string,
            limit: number
        }>
    }) {

        logger.info('Find similar chunks', {
            service: 'RPC',
            payload
        });

        try {
            const data = await this.ragService.findSimilar({
                text: payload.text,
                context: payload.context
            });
            return data;
        } catch (error) {
            logger.error(error);
        }
    }

    deleteCollection(name: string) {
        logger.info('Delete collection', {
            service: 'RPC',
            name
        });

        return this.ragService.deleteCollection(name);
    }

    deletePointsByKey(name: string, key: string) {
        logger.info('Delete points by key', {
            service: 'RPC',
            name,
            key
        });


        return this.ragService.deletePointsByKey(name, key);
    }

    getCollections() {
        logger.info('Get collections', {
            service: 'RPC'
        });

        return this.ragService.getCollections();
    }

    async embedText(payload: {
        text: string,
        title: string,
        context: Partial<{
            tags: string[],
            limit: number,
            type: string,
            key: string,
            collection: string
        }>
    }) {
        logger.info('Embed text', {
            service: 'RPC',
            payload
        });

        try {
            await this.ragService.embedText({
                text: payload.text,
                collection: payload.context.collection,
                payload: {
                    tags: payload.context.tags,
                    key: payload.context.key,
                    type: payload.context.type,
                    title: payload.title
                }
            });
        } catch (error) {
            logger.error(error);
        }
    }

    async generateText(payload: {
        text: string,
        context?: Partial<{
            tags: string[],
            limit: number,
            type: string,
            key: string,
            collection: string
        }>,
        options?: Partial<{
            topK: number,
            topP: number,
            minP: number,
            temperature: number,
            suffix: string,
            think: boolean,
            model: string,
            format: string,
        }>
    }): Promise<unknown> {
        logger.info('Generate text', {
            service: 'RPC',
            payload
        });

        try {
            const response = await this.ragService.generateText({
                text: payload.text,
                context: payload.context,
                options: payload.options
            });

            return response;
        } catch (error) {
            if (error.status) {
                logger.error(error.response.data);
                throw new Error(error.response.data?.error?.message);
            }

        }
    }
}
