import { Request, Response, NextFunction } from 'express';

import { logger } from '../logger';

export async function authenticateRequest(req: Request, res: Response, next: NextFunction) {
    // validates the key from the http header
    async function validateApiKey() {
        return req.headers['x-api-key'] === process.env.RPC_API_KEY;
    }

    const isAuthorized = await validateApiKey();

    if (!isAuthorized) {
        logger.warn('Unauthorized rpc request');
        res.sendStatus(401);
        next('Unauthorized');
    }
    next();
}
