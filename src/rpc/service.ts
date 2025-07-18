import { RAGService } from '../rag/service';

export class RouterService {
    ragService: RAGService;

    constructor() {
        this.ragService = new RAGService();
    }

    async findSimilar(config: {
        text: string,
        context: Partial<{
            tags: string[],
            key: string,
            type: string,
            collection: string,
            limit: number
        }>
    }) {
        try {
            const data = await this.ragService.findSimilar({
                text: config.text,
                context: config.context
            });
            return data;
        } catch (error) {
            console.log(error);
        }
    }

    deleteCollection(name: string) {
        return this.ragService.deleteCollection(name);
    }

    deletePointsByKey(name: string, key: string) {
        return this.ragService.deletePointsByKey(name, key);
    }

    getCollections() {
        return this.ragService.getCollections();
    }

    async embedText(config: {
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
        try {
            await this.ragService.embedText({
                text: config.text,
                collection: config.context.collection,
                payload: {
                    tags: config.context.tags,
                    key: config.context.key,
                    type: config.context.type,
                    title: config.title
                }
            });
        } catch (error) {
            console.log(error);
        }
    }

    async generateText(config: {
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
        try {
            const response = await this.ragService.generateText({
                text: config.text,
                context: config.context,
                options: config.options
            });

            return response;
        } catch (error) {
            if (error.status) {
                console.log(error.response.data);
                throw new Error(error.response.data?.error?.message);
            }

        }
    }
}
