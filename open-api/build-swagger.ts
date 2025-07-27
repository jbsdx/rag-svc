import { writeFile } from 'fs/promises';
import { openApiDocument } from '../src/api/open-api';

writeFile('./open-api/swagger.json', JSON.stringify(openApiDocument, null, 2))
    .then(() => {
        console.log('Generated swagger.json');
    }).catch(err => {
        console.error(err);
    });;