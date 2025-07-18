import { z } from 'zod';

import { protectedProcedure, router } from './trpc';
import { RouterService } from './service';
import { CollectionNameDto, ContextDto, GenerationOptionsDto } from './types';

const service = new RouterService();

export const appRouter = router({
    deleteCollection: protectedProcedure
        .input(z.object({
            collection: CollectionNameDto
        }))
        .output(z.boolean())
        .mutation(async (opts) => {
            return service.deleteCollection(opts.input.collection);
        }),
    deletePointsByKey: protectedProcedure
        .input(z.object({
            collection: CollectionNameDto,
            key: z.string()
        }))
        .mutation(async (opts) => {
            return service.deletePointsByKey(opts.input.collection, opts.input.key);
        }),
    embedText: protectedProcedure
        .input(z.object({
            text: z.string().nonempty(),
            title: z.string().optional(),
            context: ContextDto
        }).required())
        .mutation(async (opts) => {
            const input = opts.input;

            return service.embedText({
                text: input.text,
                title: input.title,
                context: input.context
            });
        }),
    generateText: protectedProcedure
        .input(z.object({
            text: z.string(),
            context: ContextDto.optional(),
            options: GenerationOptionsDto.optional()
        }))
        .mutation(async (opts) => {
            const input = opts.input;

            return service.generateText({
                text: input.text,
                context: input.context,
                options: input.options
            });
        }),

    getCollections: protectedProcedure
        .query(() => {
            return service.getCollections();
        }),
    findSimilar: protectedProcedure
        .input(
            z.object({
                text: z.string().nonempty(),
                context: ContextDto
            })
        )
        .query(async (opts) => {
            const input = opts.input;

            return service.findSimilar({
                text: input.text,
                context: input.context
            });
        }),
});

export type AppRouter = typeof appRouter;
