import { QdrantClient } from '@qdrant/js-client-rest';
import axios from 'axios';
import { v4 } from 'uuid';

import { Splitter } from './chunk';

export class RAGService {
    client: QdrantClient;
    modelName = 'ollama/llama3.1:8b';
    embeddingModel = 'ollama3';

    get llmProxyUrl() {
        return process.env.LLM_PROXY_URL ?? 'http://localhost:4000';
    }

    get dbUrl() {
        return process.env.VECTOR_DB_URL ?? 'http://localhost:6333';
    }

    constructor() {
        this.initDatabase();
    }

    /**
     * Init vector database client
     */
    initDatabase() {
        this.client = new QdrantClient({
            url: this.dbUrl
        });
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
    deletePointsByKey(collection: string, key: string) {
        return this.client.delete(collection, {
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
    }

    /**
     * Embed text and save resulting vectors to the database
     */
    async embedText(config: {
        text: string,
        collection: string,
        payload: { [key: string]: unknown }
    }) {
        const collections = await this.getCollections();

        const collectionName = `${config.collection}`;

        let createCollection = !collections.some(x => x.name === collectionName);

        const splitter = new Splitter({
            maxLength: 1024,
            minLength: 200,
            overlap: 0,
            removeExtraSpaces: true,
            splitter: 'paragraph'
        });
        const chunks = splitter.split(config.text);

        console.log(chunks);

        for (const chunk of chunks) {
            let chunkData = chunk;

            if (config.payload.title) {
                // add title to each chunk
                chunkData = `Title: ${config.payload.title}\n\n${chunkData}`;
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
                        ...config.payload
                    }
                }]
            });
        }
    }

    /**
     * Find similiar text with vector similarity search
     */
    async findSimilar(config: {
        text: string,
        context: Partial<{
            tags?: string[],
            collection: string,
            type?: string,
            key?: string,
            limit?: number
        }>
    }) {
        const data: number[] = await this.generateEmbeddings(config.text);
        if (data.length === 0) {
            console.warn('Received empty embedding data');
            return [];
        }
        const filter = { must: [] };

        if (config.context?.tags?.length > 0) {
            filter.must.push({
                key: 'tags',
                match: {
                    any: config.context.tags
                }
            });
        }

        if (config.context?.type) {
            filter.must.push({
                key: 'type',
                match: {
                    value: config.context.type
                }
            });
        }

        if (config.context?.key) {
            filter.must.push({
                key: 'key',
                match: {
                    value: config.context.key
                }
            });
        }
        return await this.client.search(config.context.collection, {
            vector: data,
            limit: config.context?.limit ?? 20,
            filter
        });
    }

    /**
     * Generates response from LLM provider
     */
    async generateText(config: {
        text: string,
        context?: Partial<{
            tags: string[],
            collection: string,
            limit: number
        }>,
        options?: Partial<{
            topK: number,
            topP: number,
            minP: number,
            temperature: number,
            suffix: string,
            think: boolean,
            model: string,
            format: string
        }>
    }): Promise<unknown> {
        const url = `${this.llmProxyUrl}/completions`;
        const apiKey = process.env.LITELLM_API_KEY;

        let prompt = '';

        if (config.context) {
            const result = await this.findSimilar({
                text: config.text,
                context: config.context
            });

            if (result.length > 0) {
                prompt += 'Use this additional context for your response:\n\n------\n\n';
            }

            for (const entry of result) {
                prompt += `${entry.payload['source']}\n\n------\n\n`;
            }
            prompt += 'User input:\n\n';
        }

        prompt += config.text;

        console.log('Using prompt', prompt);

        const payload = {
            prompt,
            model: config.options?.model ?? this.modelName,
            suffix: config.options?.suffix ?? undefined,
            think: config.options?.think ?? false,
            stream: false,
            options: {
                keep_alive: '5m',
                temperature: config.options?.temperature ?? 0.8,
                seed: 0,
                /**
                 * Reduces the probability of generating nonsense. 
                 * A higher value (e.g. 100) will give more diverse answers, 
                 * while a lower value (e.g. 10) will be more conservative.
                 */
                top_k: config.options?.topK ?? 40,
                /**
                 * Works together with top-k. 
                 * A higher value (e.g., 0.95) will lead to more diverse text, 
                 * while a lower value (e.g., 0.5) 
                 * will generate more focused and conservative text. (Default: 0.9)
                 */
                top_p: config.options?.topP ?? 0.9,
                min_p: config.options?.minP ?? 0
            }
        };

        if (config.options?.format) {
            /** Example: {
                "type": "object",
                "properties": {
                    "description": {
                        "type": "string",
                        "description": "The detailed event description"
                    },
                     "title": {
                        "type": "string",
                        "description": "The title of the story"
                    },
                    "happyEnding": {
                        "type": "boolean",
                        "description": "Does the story include a happy ending?"
                    }
                },
                "required": [
                    "description",
                    "title",
                    "happyEnding"
                ]
            } */
            payload['format'] = JSON.parse(config.options.format);
        }

        console.log('payload', payload);

        const response = await axios.post(url, payload, {
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
