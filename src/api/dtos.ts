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

export interface GetCollectionResponseDto {
    name: string;
}

export type SuccessResponseDto = boolean;

export interface FindSimilarRequestDto {
    text: string;
    context: Partial<QueryContextDto>;
}

export interface FindSimilarResponseDto {
    payload: Record<string, unknown>;
    score: number;
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

export interface GenerateTextResponseDto {
    choices: {
        text: string
    }[];
    usage: {
        completionTokens: number
    };
}
