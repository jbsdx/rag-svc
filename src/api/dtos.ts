export interface EmbedContextDto {
    tags: string[];
    key: string;
    type: string;
    collection: string;
}

export interface QueryContextDto {
    tags: string[];
    keys: string[];
    type: string;
    collection: string;
    limit: number;
}

export interface FindSimilarRequestDto {
    text: string;
    context: Partial<QueryContextDto>;
}

export interface EmbedTextRequestDto {
    text: string;
    title: string;
    context: Partial<EmbedContextDto>;
}

export interface GenerateTextOptionsDto {
    topK: number;
    topP: number;
    minP: number;
    temperature: number;
    suffix: string;
    think: boolean;
    model: string;
    format: string;
}

export interface GenerateTextRequestDto {
    text: string;
    context: Partial<QueryContextDto>;
    options: Partial<GenerateTextOptionsDto>;
}