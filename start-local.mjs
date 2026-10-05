import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Usa Node.js 24.19 o posterior compatible.');
await access(new URL('server/.env', import.meta.url)).catch(() => { throw new Error('Falta server/.env con la conexion Oracle. Revisa INTEGRACION_ORACLE.md.'); });
const children=[];
function run(args,cwd){
 const child=spawn(process.execPath,args,{cwd,stdio:'inherit',env:process.env});
 children.push(child);
 child.on('error',()=>stop(1));
 child.on('exit',code=>stop(code??0));
 return child;
}
let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;for(const child of children)child.kill();process.exitCode=code;}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
run(['--env-file=.env','server.mjs'],fileURLToPath(new URL('server/',import.meta.url)));
run(['node_modules/@angular/cli/bin/ng.js','serve','--host','127.0.0.1','--port','4200'],root);
console.log('RentRoom: abre http://127.0.0.1:4200 cuando finalice la compilacion.');
