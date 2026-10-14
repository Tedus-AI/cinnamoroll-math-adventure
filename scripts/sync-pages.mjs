import {cp,mkdir,writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
const root=fileURLToPath(new URL("../",import.meta.url));
await mkdir(path.join(root,"docs"),{recursive:true});
await cp(path.join(root,"public/game"),path.join(root,"docs"),{recursive:true});
await writeFile(path.join(root,"docs/.nojekyll"),"");
console.log("GitHub Pages files synchronized.");
