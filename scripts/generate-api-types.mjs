import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import openapiTS, { astToString, COMMENT_HEADER } from 'openapi-typescript';

const swaggerUrl = process.env.SWAGGER_URL ?? 'http://localhost:3000/docs-json';
const output = resolve('src/api/types/api.d.ts');
const schema = await openapiTS(new URL(swaggerUrl));

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${COMMENT_HEADER}${astToString(schema)}`, 'utf8');
console.log(`Tipos OpenAPI gerados de ${swaggerUrl} em ${output}`);
