import {randomBytes} from 'node:crypto';
import {derive} from './auth-pilot.mjs';
import {requireAdmin} from './clinical-access-pilot.mjs';
// Pilot employee directory. Employee sign-in intentionally disabled until RBAC is enforced.
export async function installEmployeeDirectory(app,db){
 const users=db.collection('pilot_employees');
 await users.createIndex({username:1},{unique:true});
 const roles=['administracion','admisiones','especialista','enfermeria','laboratorio','farmacia','caja','auditoria'];
 const wrap=f=>(q,s,n)=>Promise.resolve(f(q,s)).catch(n);
 const admin=requireAdmin;
 const publicFields={_id:0,username:1,name:1,role:1,department:1,active:1,createdAt:1,updatedAt:1,credentialReady:1};
 function invalid(msg){throw Object.assign(new Error(msg),{status:400})}
 async function fields(body){
  const name=typeof body.name==='string'?body.name.trim():'';
  const department=typeof body.department==='string'?body.department.trim():'';
  if(!name||name.length>120||!roles.includes(body.role))invalid('Nombre o rol inválido');
  if(!await db.collection('departments').findOne({name:department}))invalid('Departamento inválido');
  return {name,role:body.role,department};
 }
 app.get('/api/employees',admin,wrap(async(q,s)=>s.json(await users.find({},{projection:publicFields}).sort({username:1}).toArray())));
 app.post('/api/employees',admin,wrap(async(q,s)=>{
  const username=typeof q.body.username==='string'?q.body.username.trim().toLowerCase():'';
  if(!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username)||username==='admin')invalid('Usuario inválido o reservado');
  const info=await fields(q.body);
  await users.insertOne({username,...info,active:false,credentialReady:false,createdAt:new Date(),updatedAt:new Date()});
  s.status(201).json({username,...info,active:false});
 }));
 app.put('/api/employees/:username',admin,wrap(async(q,s)=>{
  const info=await fields(q.body);
  const result=await users.updateOne({username:q.params.username},{$set:{...info,active:false,updatedAt:new Date()}});
  if(!result.matchedCount)return s.status(404).json({error:'Usuario inexistente'});
  s.json({ok:true});
 }));
 // Password preparation only. Never enables employee sign-in.
 let deriving=false;
 app.put('/api/employees/:username/password',admin,wrap(async(q,s)=>{
  const password=q.body?.password;
  if(typeof password!=='string'||password.length<16||password.length>256||/[\r\n]/.test(password))invalid('Use una contraseña de 16 a 256 caracteres');
  if(!await users.findOne({username:q.params.username},{projection:{_id:1}}))return s.status(404).json({error:'Usuario inexistente'});
  if(deriving)return s.status(429).json({error:'Intente nuevamente'});
  deriving=true;
  try{
   const salt=randomBytes(32),hash=await derive(password,salt);
   const result=await users.updateOne({username:q.params.username},{$set:{passwordSalt:salt.toString('hex'),passwordHash:hash.toString('hex'),credentialReady:true,active:false,updatedAt:new Date()},$inc:{credentialVersion:1}});
   if(!result.matchedCount)return s.status(404).json({error:'Usuario inexistente'});
   await db.collection('pilot_sessions').deleteMany({username:q.params.username});
   s.json({ok:true,active:false,credentialReady:true});
  }finally{deriving=false}
 }));
 app.put('/api/employees/:username/disable',admin,wrap(async(q,s)=>{
  const result=await users.updateOne({username:q.params.username},{$set:{active:false,updatedAt:new Date()},$inc:{credentialVersion:1}});
  if(!result.matchedCount)return s.status(404).json({error:'Usuario inexistente'});
  await db.collection('pilot_sessions').deleteMany({username:q.params.username});
  s.json({ok:true,active:false});
 }));
}
