import { initTRPC, TRPCError } from '@trpc/server';

import type { Context } from './context';

const t = initTRPC.context<Context>().create();

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(
    async function isAuthed(opts) {
        const { ctx } = opts;

        if (!ctx?.isAuthorized) {
            throw new TRPCError({ code: 'UNAUTHORIZED' });
        }

        return opts.next({
            ctx: {
                isAuthorized: true
            },
        });
    },
);