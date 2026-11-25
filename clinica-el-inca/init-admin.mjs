import {randomBytes} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {derive} from './auth-pilot.mjs';
// Read password from stdin, never command arguments or environment.
let input='';for await(const chunk of process.stdin){input+=chunk;if(input.length>2048)throw Error('Entrada demasiado larga')}
const password=input.replace(/\r?\n$/,'');
if(password.length<16||password.length>256||/[\r\n]/.test(password))throw Error('Use una contraseña de 16 a 256 caracteres');
const salt=randomBytes(32),hash=await derive(password,salt);
const target=process.env.LEONES_AUTH_FILE||'/etc/leones-auth.json';
await writeFile(target,JSON.stringify({username:'admin',salt:salt.toString('hex'),hash:hash.toString('hex')})+'\n',{mode:0o600,flag:'wx'});
console.log('Configuración creada. No se almacenó la contraseña en texto plano.');
