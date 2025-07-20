import { Request, Response, NextFunction } from 'express';

import { logger } from '../logger';

export async function authenticateRequest(req: Request, _res: Response, next: NextFunction) {
    // Create context based on the request object
    // Will be available as `ctx` in all resolvers

    async function validateApiKey() {
        return req.headers['x-api-key'] === process.env.RPC_API_KEY;
    }
    const isAuthorized = await validateApiKey();

    if (!isAuthorized) {
        logger.warn('Unauthorized rpc request');
        next('Unauthorized');
    }
    next();
}
