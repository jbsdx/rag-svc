import { logger } from '../logger';
import { RAGService } from '../rag/service';
import { EmbedTextRequestDto, FindSimilarRequestDto, GenerateTextRequestDto } from './dtos';

export class RouterService {
    ragService: RAGService;

    constructor() {
        this.ragService = new RAGService();
    }

    async findSimilar(payload: FindSimilarRequestDto) {
        logger.info('Find similar chunks', {
            service: 'router',
            payload
        });
        const { text, context } = payload;

        try {
            const data = await this.ragService.findSimilar({
                text,
                context
            });
            return data;
        } catch (error) {
            logger.error(error);
        }
    }

    deleteCollection(name: string) {
        logger.info('Delete collection', {
            service: 'router',
            name
        });

        return this.ragService.deleteCollection(name);
    }

    deletePointsByKey(name: string, key: string) {
        logger.info('Delete points by key', {
            service: 'router',
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

    async embedText(payload: EmbedTextRequestDto) {
        logger.info('Embed text', {
            service: 'router',
            payload
        });
        const { text, title, context } = payload;

        try {
            await this.ragService.embedText({
                text,
                title,
                context
            });
        } catch (error) {
            logger.error(error);
        }
    }

    async generateText(payload: GenerateTextRequestDto): Promise<unknown> {
        logger.info('Generate text', {
            service: 'router',
            payload
        });
        const { text, options, context } = payload;

        try {
            const response = await this.ragService.generateText({
                text,
                context,
                options
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
