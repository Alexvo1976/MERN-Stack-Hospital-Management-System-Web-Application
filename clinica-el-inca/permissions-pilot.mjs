// Explicit deny-by-default policy for the next employee authentication phase.
// Only the separately authenticated bootstrap administrator has unrestricted access.
export function allowed(user,action,resource={}){
 if(!user||user.active!==true)return false;
 if(user.bootstrapAdmin===true&&user.username==='admin')return true;
 const department=user.department;
 if(typeof department!=='string'||!department)return false;
 const clinicalRoles=new Set(['especialista','enfermeria','laboratorio','farmacia','caja']);
 switch(action){
 case 'department.read': return resource.department===department;
 case 'template.read': return resource.department===department&&resource.published===true;
 case 'patient.read': return resource.department===department&&(clinicalRoles.has(user.role)||user.role==='admisiones');
 case 'patient.create': return user.role==='admisiones'&&department==='Admisiones';
 case 'patient.refer': return user.role==='admisiones'&&department==='Admisiones'&&resource.department==='Admisiones';
 case 'record.read':
 case 'record.create':
 case 'record.preview':
  return clinicalRoles.has(user.role)&&resource.department===department&&resource.patientDepartment===department;
 default:return false;
 }
}
