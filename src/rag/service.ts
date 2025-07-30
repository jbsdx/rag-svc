import { QdrantClient } from '@qdrant/js-client-rest';
import axios from 'axios';
import { v4 } from 'uuid';

import { Splitter } from './chunk';
import { logger } from '../logger';
import { EmbedTextRequestDto, FindSimilarRequestDto, GenerateTextRequestDto } from '../api/dtos';

export class RAGService {
    client: QdrantClient;
    modelName = 'ollama/llama3.1:8b';
    embeddingModel = 'ollama3';

    constructor() {
        this.initDatabase();
    }

    private get llmProxyUrl() {
        return process.env.LLM_PROXY_URL ?? 'http://localhost:4000';
    }

    private get llmProxyApiKey() {
        return process.env.LITELLM_API_KEY;
    }

    private get dbUrl() {
        return process.env.VECTOR_DB_URL ?? 'http://localhost:6333';
    }

    private get llmProxyClient() {
        return axios.create({
            baseURL: this.llmProxyUrl,
            headers: {
                Authorization: `Bearer ${this.llmProxyApiKey}`
            }
        });
    }

    /**
     * Init vector database client
     */
    initDatabase() {
        this.client = new QdrantClient({
            url: this.dbUrl
        });
        logger.info('Connected to vector database');
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
        const response = await this.llmProxyClient.post('/embeddings', {
            'input': text,
            'model': this.modelName
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
        // load existing vector collections
        const collections = await this.getCollections();
        const { context, text, title } = payload;
        const collectionName = `${context.collection}`;

        // check if collection name already exists
        let createCollection = !collections.some(x => x.name === collectionName);

        const splitter = new Splitter({
            maxLength: 1024,
            minLength: 200,
            overlap: 0,
            removeExtraSpaces: true,
            splitter: 'paragraph'
        });
        const chunks = splitter.split(text);

        logger.info('Created text chunks', {
            service: 'RAG',
            splitter: {
                size: chunks.length
            }
        });

        for (const chunk of chunks) {
            let chunkData = chunk;

            if (title) {
                // add title to each chunk
                chunkData = `Title: ${title}\n\n${chunkData}`;
            }

            // generate vectors from llm provider
            const data: number[] = await this.generateEmbeddings(chunkData);

            if (createCollection) {
                // create collection name on first chunk
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
                        tags: context.tags ?? [],
                        key: context.key,
                        type: context.type,
                        title: title
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

        if (payload.context?.keys?.length > 0) {
            filter.must.push({
                key: 'key',
                match: {
                    any: payload.context.keys
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
        const { text, context } = payload;
        let prompt = '';

        if (payload.context) {
            const result = await this.findSimilar({
                text,
                context
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

        logger.info('Using payload', {
            service: 'RAG',
            payload: {
                model: _payload.model
            }
        });

        // Send payload to llm completion endpoint
        const response = await this.llmProxyClient.post('/completions', _payload);

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
