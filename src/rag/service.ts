import { QdrantClient } from '@qdrant/js-client-rest';
import axios from 'axios';
import { v4 } from 'uuid';

import { Splitter } from './chunk';
import { logger } from '../logger';
import { EmbedTextRequestDto, FindSimilarRequestDto, GenerateTextRequestDto } from 'src/api/dtos';

export class RAGService {
    client: QdrantClient;
    modelName = 'ollama/llama3.1:8b';
    embeddingModel = 'ollama3';

    constructor() {
        this.initDatabase();
    }

    get llmProxyUrl() {
        return process.env.LLM_PROXY_URL ?? 'http://localhost:4000';
    }

    get dbUrl() {
        return process.env.VECTOR_DB_URL ?? 'http://localhost:6333';
    }

    /**
     * Init vector database client
     */
    initDatabase() {
        this.client = new QdrantClient({
            url: this.dbUrl
        });
        logger.info('Connecting to Qdrant database');
    }

    /**
     * Returns all embedding collections
     */
    async getCollections() {
        return (await (this.client.getCollections())).collections;
    }

    /**
     * Create new collection
     */
    async createCollection(name: string, size: number) {
        return this.client.createCollection(name, {
            vectors: {
                size,
                distance: 'Cosine'
            }
        });
    }

    /**
     * Generate vector embeddings from input text
     */
    async generateEmbeddings(text: string): Promise<number[]> {
        const url = `${this.llmProxyUrl}/embeddings`;
        const apiKey = process.env.LITELLM_API_KEY;

        const response = await axios.post(url, {
            'input': text,
            'model': this.modelName
        }, {
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });

        return response.data.data[0].embedding;
    }

    /**
     * Deletes collection
     */
    deleteCollection(name: string) {
        return this.client.deleteCollection(name);
    }

    /**
     * Delete points by key identifier
     */
    async deletePointsByKey(collection: string, key: string) {
        await this.client.delete(collection, {
            filter: {
                must: [
                    {
                        key: 'key',
                        match: {
                            value: key
                        }
                    }
                ]
            }
        });
        return true;
    }

    /**
     * Embed text and save resulting vectors to the database
     */
    async embedText(payload: EmbedTextRequestDto) {
        const collections = await this.getCollections();

        const collectionName = `${payload.context.collection}`;

        let createCollection = !collections.some(x => x.name === collectionName);

        const splitter = new Splitter({
            maxLength: 1024,
            minLength: 200,
            overlap: 0,
            removeExtraSpaces: true,
            splitter: 'paragraph'
        });
        const chunks = splitter.split(payload.text);

        logger.info('Created text chunks', {
            service: 'RAG',
            splitter: {
                size: chunks.length
            }
        });

        for (const chunk of chunks) {
            let chunkData = chunk;

            if (payload.title) {
                // add title to each chunk
                chunkData = `Title: ${payload.title}\n\n${chunkData}`;
            }

            // generate vectors from llm provider
            const data: number[] = await this.generateEmbeddings(chunkData);

            if (createCollection) {
                await this.createCollection(collectionName, data.length);
                createCollection = false;
            }

            // save vectors with payload to vector database
            await this.client.upsert(collectionName, {
                points: [{
                    id: v4(),
                    vector: data,
                    payload: {
                        timestamp: new Date().toISOString(),
                        source: chunkData,
                        tags: payload.context.tags ?? [],
                        key: payload.context.key,
                        type: payload.context.type,
                        title: payload.title
                    }
                }]
            });
        }
    }

    /**
     * Find similiar text with vector similarity search
     */
    async findSimilar(payload: FindSimilarRequestDto) {
        const data: number[] = await this.generateEmbeddings(payload.text);
        if (data.length === 0) {
            logger.warn('Received empty embedding data', {
                service: 'RAG'
            });
            return [];
        }
        const filter = { must: [] };

        if (payload.context?.tags?.length > 0) {
            filter.must.push({
                key: 'tags',
                match: {
                    any: payload.context.tags
                }
            });
        }

        if (payload.context?.type) {
            filter.must.push({
                key: 'type',
                match: {
                    value: payload.context.type
                }
            });
        }

        if (payload.context?.key) {
            filter.must.push({
                key: 'key',
                match: {
                    value: payload.context.key
                }
            });
        }
        return await this.client.search(payload.context.collection, {
            vector: data,
            limit: payload.context?.limit ?? 20,
            filter
        });
    }

    /**
     * Generates response from LLM provider
     */
    async generateText(payload: GenerateTextRequestDto): Promise<unknown> {
        const url = `${this.llmProxyUrl}/completions`;
        const apiKey = process.env.LITELLM_API_KEY;

        let prompt = '';

        if (payload.context) {
            const result = await this.findSimilar({
                text: payload.text,
                context: payload.context
            });

            if (result.length > 0) {
                prompt += 'Use this additional context for your response:\n\n------\n\n';
            }

            for (const entry of result) {
                prompt += `${entry.payload['source']}\n\n------\n\n`;
            }
            prompt += 'User input:\n\n';
        }

        prompt += payload.text;

        const _payload = {
            prompt,
            model: payload.options?.model ?? this.modelName,
            suffix: payload.options?.suffix ?? undefined,
            think: payload.options?.think ?? false,
            stream: false,
            options: {
                keep_alive: '5m',
                temperature: payload.options?.temperature ?? 0.8,
                seed: 0,
                /**
                 * Reduces the probability of generating nonsense. 
                 * A higher value (e.g. 100) will give more diverse answers, 
                 * while a lower value (e.g. 10) will be more conservative.
                 */
                top_k: payload.options?.topK ?? 40,
                /**
                 * Works together with top-k. 
                 * A higher value (e.g., 0.95) will lead to more diverse text, 
                 * while a lower value (e.g., 0.5) 
                 * will generate more focused and conservative text. (Default: 0.9)
                 */
                top_p: payload.options?.topP ?? 0.9,
                min_p: payload.options?.minP ?? 0
            }
        };

        if (payload.options?.['format']) {
            // JSON schema expected
            _payload['format'] = JSON.parse(payload.options.format);
        }

        logger.info('Using generation payload', {
            service: 'RAG',
            payload: _payload
        });

        const response = await axios.post(url, _payload, {
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });

        return response.data;
    }

    /**
     * Update document payload
     */
    async updateDocumentPayload(collection: string, fileKey: string, metadata: { [key: string]: unknown }, key: string) {
        logger.info('Updating chunk payload', {
            collection,
            fileKey
        });

        return this.client.setPayload(collection, {
            payload: metadata,
            key,
            filter: {
                must: [
                    {
                        key: 'key',
                        match: {
                            value: fileKey
                        }
                    }
                ]
            }
        });
    }
}
