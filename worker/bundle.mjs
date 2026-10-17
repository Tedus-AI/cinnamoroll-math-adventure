import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
export const workerRoot=fileURLToPath(new URL('./',import.meta.url));
export const bundlePath=fileURLToPath(new URL('./.build/worker.js',import.meta.url));
await build({entryPoints:[workerRoot+'index.js'],bundle:true,format:'esm',platform:'browser',outfile:bundlePath});
