import * as trpcNext from '@trpc/server/adapters/next';

export async function createContext({ req }: trpcNext.CreateNextContextOptions) {
    // Create context based on the request object
    // Will be available as `ctx` in all resolvers
    async function validateApiKey() {
        return req.headers['x-api-key'] === process.env.RPC_API_KEY;
    }
    const isAuthorized = await validateApiKey();
    return {
        isAuthorized,
    };
}
export type Context = Awaited<ReturnType<typeof createContext>>;
