// Pilot employee directory. Employee sign-in intentionally disabled until RBAC is enforced.
export async function installEmployeeDirectory(app,db){
 const users=db.collection('pilot_employees');
 await users.createIndex({username:1},{unique:true});
 const roles=['administracion','admisiones','especialista','enfermeria','laboratorio','farmacia','caja','auditoria'];
 const wrap=f=>(q,s,n)=>Promise.resolve(f(q,s)).catch(n);
 const admin=(q,s,n)=>s.locals.authenticated===true&&q.pilotSession?n():s.status(403).json({error:'Acceso denegado'});
 const publicFields={_id:0,username:1,name:1,role:1,department:1,active:1,createdAt:1,updatedAt:1};
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
  await users.insertOne({username,...info,active:false,createdAt:new Date(),updatedAt:new Date()});
  s.status(201).json({username,...info,active:false});
 }));
 app.put('/api/employees/:username',admin,wrap(async(q,s)=>{
  const info=await fields(q.body);
  const result=await users.updateOne({username:q.params.username},{$set:{...info,active:false,updatedAt:new Date()}});
  if(!result.matchedCount)return s.status(404).json({error:'Usuario inexistente'});
  s.json({ok:true});
 }));
}
