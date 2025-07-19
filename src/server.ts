import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import { createServer } from 'http';
import { configDotenv } from 'dotenv';

import { appRouter } from './rpc/router';
import { createContext } from './rpc/context';
import { logger } from './logger';

export type AppRouter = typeof appRouter;

configDotenv({
    override: true,
    quiet: true
});

const PORT = +process.env.PORT || 3000;

const handler = createHTTPHandler({
    createContext: createContext,
    router: appRouter,
    basePath: '/',
});

const server = createServer(async (req, res) => {

    if (process.env.NODE_ENV !== 'prod' && req.url?.startsWith('/ui')) {
        // Dynamically import renderTrpcPanel
        const { renderTrpcPanel } = await import('trpc-ui');

        const ui = renderTrpcPanel(appRouter, {
            url: `http://localhost:${PORT}`,
            meta: {
                title: 'RAG - RPC Server',
                description: 'RPC methods for basic RAG operations',
            },
        });
        res.end(ui);
        return;
    }

    if (req.url?.startsWith('/')) {
        return handler(req, res);
    }

    res.statusCode = 404;
    res.end('Not Found');
});

server.listen(PORT, () => {
    logger.info('Server started', { service: 'server' });
});
