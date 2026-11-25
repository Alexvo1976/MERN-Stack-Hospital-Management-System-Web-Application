import {allowed} from './permissions-pilot.mjs';
// Future employee identities must be supplied exclusively by verified server-side authentication.
export const isAdmin=u=>allowed(u,'admin');
export function requirePermission(q,action,resource={}){
 if(!allowed(q.clinicalUser,action,resource))throw Object.assign(new Error('Acceso denegado'),{status:403});
}
export function requireAdmin(q,s,n){
 if(!isAdmin(q.clinicalUser))return s.status(403).json({error:'Acceso denegado'});n();
}
export function minimalPatient(p){
 return {_id:p._id,identity:p.identity,department:p.department,shared:{identity:p.identity,name:p.shared?.name||''}};
}
export async function scopedState(user,{Patient,Template,Record,Department,mapped}){
 if(isAdmin(user))return {patients:await Patient.find().sort({createdAt:-1}),templates:(await Template.find().select('-file').lean()).map(t=>({...t,fields:mapped(t.fields)})),departments:await Department.find(),records:await Record.find().select('-file').sort({createdAt:-1})};
 if(!user?.active||!user.department)return {patients:[],templates:[],departments:[],records:[]};
 const department=user.department;
 const patients=(await Patient.find({department}).lean()).filter(p=>allowed(user,'patient.read',p)).map(minimalPatient);
 const templates=(await Template.find({department,published:true}).select('-file').lean()).filter(t=>allowed(user,'template.read',t)).map(t=>({...t,fields:mapped(t.fields)}));
 const departments=(await Department.find({name:department}).lean()).filter(d=>allowed(user,'department.read',{department:d.name}));
 const records=(await Record.find({department,patient:{$in:patients.map(p=>p._id)}}).select('-file -values').lean()).filter(r=>allowed(user,'record.read',{department:r.department,patientDepartment:department}));
 return {patients,templates,departments,records};
}
