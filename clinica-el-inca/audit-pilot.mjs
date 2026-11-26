import {requireAdmin} from './clinical-access-pilot.mjs';
// Pilot audit metadata only. Never store request bodies, headers, query strings or response content.
const rules=[
 ['POST',/^\/auth\/login$/,'login'],
 ['POST',/^\/auth\/logout$/,'logout'],
 ['GET',/^\/state$/,'dashboard.read'],
 ['GET',/^\/employees$/,'employee.list'],
 ['POST',/^\/employees$/,'employee.create'],
 ['PUT',/^\/employees\/([a-z0-9][a-z0-9._-]{2,63})$/,'employee.edit'],
 ['PUT',/^\/employees\/([a-z0-9][a-z0-9._-]{2,63})\/password$/,'employee.password'],
 ['PUT',/^\/employees\/([a-z0-9][a-z0-9._-]{2,63})\/enable$/,'employee.enable'],
 ['PUT',/^\/employees\/([a-z0-9][a-z0-9._-]{2,63})\/disable$/,'employee.disable'],
 ['GET',/^\/patients\/([a-f0-9]{24})\/form\/[a-f0-9]{24}$/i,'patient.form.read'],
 ['PUT',/^\/patients\/([a-f0-9]{24})\/department$/i,'patient.refer'],
 ['POST',/^\/patients$/,'patient.create'],
 ['POST',/^\/records$/,'record.create'],
 ['POST',/^\/preview$/,'record.preview'],
 ['GET',/^\/records\/([a-f0-9]{24})\/pdf$/i,'record.pdf.read'],
 ['GET',/^\/templates\/([a-f0-9]{24})\/pdf$/i,'template.pdf.read'],
 ['POST',/^\/templates$/,'template.create'],
 ['PUT',/^\/templates\/([a-f0-9]{24})$/i,'template.publish'],
 ['POST',/^\/departments$/,'department.create'],
 ['GET',/^\/audit$/,'audit.read']
];
export function classify(method,path){for(const [verb,pattern,action] of rules){if(verb!==method)continue;const match=pattern.exec(path);if(match)return {action,...(match[1]?{target:match[1]}:{})}}return null}
export async function installAuditCapture(app,db){
 const events=db.collection('pilot_audit');
 await events.createIndex({at:-1,_id:-1});
 app.use('/api',(q,s,n)=>{
  const event=classify(q.method,q.path);
  s.once('finish',()=>{
   const status=s.statusCode;
   if(!event&&status!==401&&status!==403)return;
   const actor=q.clinicalUser?.username||q.auditLoginActor||null;
   const row={at:new Date(),action:event?.action||'access.denied',actor,status,outcome:status<400?'success':status===401||status===403?'denied':'error',...(event?.target?{target:event.target}:{})};
   events.insertOne(row).catch(()=>console.error('AUDIT_WRITE_FAILED'));
  });
  n();
 });
}
export function installAuditReader(app,db){
 app.get('/api/audit',requireAdmin,async(q,s,n)=>{
  try{s.json(await db.collection('pilot_audit').find({},{projection:{_id:0,at:1,action:1,actor:1,status:1,outcome:1,target:1}}).sort({at:-1,_id:-1}).limit(100).toArray())}catch(e){n(e)}
 });
}
