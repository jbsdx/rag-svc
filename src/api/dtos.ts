export interface ContextDto {
    tags: string[];
    key: string;
    type: string;
    collection: string;
    limit: number;
}

export interface FindSimilarRequestDto {
    text: string;
    context: Partial<ContextDto>;
}

export interface EmbedTextRequestDto {
    text: string;
    title: string;
    context: Partial<ContextDto>;
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
    context: Partial<ContextDto>;
    options: Partial<GenerateTextOptionsDto>;
}