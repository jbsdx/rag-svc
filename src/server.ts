import express from 'express';
import bodyParser from 'body-parser';
import { createExpressEndpoints } from '@ts-rest/express';
import { configDotenv } from 'dotenv';

import { logger } from './logger';
import { contract } from './api/contract';
import { authenticateRequest } from './api/auth';
import { router } from './api/router';

configDotenv({
    override: true,
    quiet: true
});

const port = +process.env.PORT || 3000;
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(authenticateRequest);

createExpressEndpoints(contract, router, app, {
    logInitialization: true
});

app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
});
