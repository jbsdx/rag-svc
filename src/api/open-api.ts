import { generateOpenApi } from '@ts-rest/open-api';
import * as express from 'express';
import * as swaggerUi from 'swagger-ui-express';

import { contract, SecurityRequirementObject } from './contract';
import * as swagger from '../../open-api/swagger.json';
import pck from '../../package.json';

const hasCustomTags = (metadata: unknown): metadata is { openApiTags: string[] } => {
    return (
        !!metadata && typeof metadata === 'object' && 'openApiTags' in metadata
    );
};

const hasSecurity = (metadata: unknown): metadata is { openApiSecurity: SecurityRequirementObject[] } => {
    return (
        !!metadata && typeof metadata === 'object' && 'openApiSecurity' in metadata
    );
};

export const openApiDocument = generateOpenApi(
    contract,
    {
        info: {
            title: 'RAG Service API',
            version: pck.version,
            description: pck.description,
            contact: {
                name: 'JB'
            }
        },
        components: {
            securitySchemes: {
                ApiKey: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-api-key'
                },
            },
        },
    },
    {
        jsonQuery: false,
        setOperationId: true,
        operationMapper: (operation, appRoute) => ({
            ...operation,
            ...(hasCustomTags(appRoute.metadata)
                ? {
                    tags: appRoute.metadata.openApiTags,
                }
                : {}),
            ...(hasSecurity(appRoute.metadata)
                ? {
                    security: appRoute.metadata.openApiSecurity,
                }
                : {}),
            // You can also use the operation ID for custom logic
            description: `${operation.description || ''}`,
        }),
    }
);

export function expressSwaggerUi(_req: express.Request, res: express.Response) {
    return res.send(
        swaggerUi.generateHTML(swagger,
            {

                explorer: true,
                customSiteTitle: 'Swagger UI'
            }
        )
    );
}
