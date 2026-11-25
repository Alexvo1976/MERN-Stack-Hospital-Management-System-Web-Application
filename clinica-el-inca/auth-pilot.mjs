import {scrypt as rawScrypt, randomBytes, timingSafeEqual, createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {readFile} from 'node:fs/promises';
const scrypt=promisify(rawScrypt);
const opts={N:32768,r:8,p:3,maxmem:64*1024*1024};
export async function derive(password,salt){return scrypt(password,salt,64,opts)}
export async function installAuth(app,db){
 const config=JSON.parse(await readFile(process.env.LEONES_AUTH_FILE||'/etc/leones-auth.json','utf8'));
 const salt=Buffer.from(config.salt,'hex'), hash=Buffer.from(config.hash,'hex');
 if(salt.length!==32||hash.length!==64||config.username!=='admin')throw Error('Configuración de acceso inválida');
 const sessions=db.collection('pilot_sessions');
 await sessions.createIndex({expiresAt:1},{expireAfterSeconds:0});
 await sessions.deleteMany({});
 const digest=t=>createHash('sha256').update(t).digest('hex');
 const cookie='leones_session';
 const secure=process.env.LEONES_SECURE_COOKIE==='1';
 const flags={httpOnly:true,sameSite:'strict',secure,path:'/'};
 const wrap=f=>(q,s,n)=>Promise.resolve(f(q,s)).catch(n);
 const getToken=q=>{const t=(q.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(cookie+'='))?.slice(cookie.length+1);return /^[a-f0-9]{64}$/.test(t||'')?t:null};
 let attempts=[], busy=false;
 app.use('/api',(q,s,n)=>{s.set('Cache-Control','no-store'); if(!['GET','HEAD','OPTIONS'].includes(q.method)){const origin=q.get('origin');if(origin!==('http://'+q.get('host'))&&origin!==('https://'+q.get('host')))return s.status(403).json({error:'Origen no autorizado'});}n()});
 app.post('/api/auth/login',wrap(async(q,s)=>{
  if(!q.is('application/json'))return s.status(415).json({error:'Formato inválido'});
  const now=Date.now();attempts=attempts.filter(t=>now-t<600000);
  if(attempts.length>=5||busy)return s.status(429).json({error:'Espere antes de volver a intentar'});
  const {username,password}=q.body||{};
  if(typeof password!=='string'||password.length>256||typeof username!=='string')return s.status(400).json({error:'Datos inválidos'});
  attempts.push(now);busy=true;
  try{const actual=await derive(password,salt);if(!timingSafeEqual(actual,hash)||username!==config.username)return s.status(401).json({error:'Credenciales inválidas'});}finally{busy=false}
  attempts=[];const old=getToken(q);if(old)await sessions.deleteOne({_id:digest(old)});
  const token=randomBytes(32).toString('hex');
  await sessions.insertOne({_id:digest(token),expiresAt:new Date(now+900000),absolute:new Date(now+28800000)});
  s.cookie(cookie,token,flags).json({username:'admin'});
 }));
 app.use('/api',(q,s,n)=>{Promise.resolve((async()=>{
  const token=getToken(q);const now=new Date();
  if(!token)return s.status(401).json({error:'Inicie sesión'});
  const row=await sessions.findOne({_id:digest(token),expiresAt:{$gt:now},absolute:{$gt:now}});
  if(!row)return s.status(401).json({error:'Sesión expirada'});
  await sessions.updateOne({_id:row._id},{$set:{expiresAt:new Date(Math.min(Date.now()+900000,row.absolute.getTime()))}});
  q.pilotSession=row._id;
  q.clinicalUser=Object.freeze({username:'admin',active:true,bootstrapAdmin:true});
  // Express middleware must call next explicitly.
  s.locals.authenticated=true;n();
 })()).catch(n)});
 app.get('/api/auth/me',(q,s)=>s.json({username:'admin'}));
 app.post('/api/auth/logout',wrap(async(q,s)=>{await sessions.deleteOne({_id:q.pilotSession});s.clearCookie(cookie,flags).json({ok:true})}));
}
