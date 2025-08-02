import express from 'express';
import * as swaggerUi from 'swagger-ui-express';
import bodyParser from 'body-parser';
import { createExpressEndpoints } from '@ts-rest/express';
import { configDotenv } from 'dotenv';

import { logger } from './logger';
import { contract } from './api/contract';
import { authenticateRequest } from './api/auth';
import { router } from './api/router';
import { expressSwaggerUi, openApiDocument } from './api/open-api';

configDotenv({
    override: true,
    quiet: true
});

const swaggerUiPath = process.env.SWAGGER_UI_PATH ?? '/swagger-ui';
const port = +process.env.PORT || 3000;
const app = express();

app.disable('x-powered-by');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// serve swagger json file
app.get('/swagger', (req, res) => {
    res.send(openApiDocument);
});

// serve swagger ui dashboard
app.use(swaggerUiPath, swaggerUi.serve, expressSwaggerUi);

// enable x-api-key authentication
app.use('/api', authenticateRequest);

createExpressEndpoints(contract, router, app, {
    logInitialization: true
});

app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
});
