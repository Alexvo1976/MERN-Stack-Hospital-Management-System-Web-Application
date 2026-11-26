// Conservative exact matching: never confuse patient with spouse, guardian or emergency contact.
export const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const groups={name:['nombre del paciente','nombre paciente','nombres y apellidos','nombre completo','patient name','full name','name'],identity:['cedula','cedula de identidad','identificacion','numero de identificacion','documento de identidad','identity'],birth_date:['fecha de nacimiento','fecha nacimiento','date of birth','birth date','dob'],address:['direccion','domicilio','direccion del paciente','address'],email:['direccion email','otro direccion email','correo electronico','email','e mail'],phone:['celular','telefono celular','telefono','telefono del paciente','mobile','phone'],sex:['sexo','sex','genero'],city:['ciudad','ciudad estado'],zip:['zip','codigo postal']};
const lookup=new Map(Object.entries(groups).flatMap(([k,labels])=>labels.map(l=>[normalize(l),k])));
export function infer(field){return lookup.get(normalize(field.label))||lookup.get(normalize(field.widget))||''}
// Only approved demographic keys may cross department boundaries.
const approved=new Set(['identity','name','birth_date','address','email','phone','sex','city','zip']);
export const isSharedKey=k=>approved.has(k);
export function mapped(fields){return fields.map(f=>{const candidate=f.noShare?'':(f.key||infer(f));return {...f,key:isSharedKey(candidate)?candidate:'',noShare:!!f.noShare||!!candidate&&!isSharedKey(candidate)}})}
export function sharedValues(patient){const source=patient?.shared||{};const result=Object.fromEntries(Object.entries(source).filter(([k,v])=>isSharedKey(k)&&typeof v==='string'));if(typeof patient?.identity==='string')result.identity=patient.identity;return result}
export function preserveLegacyShared(patient,approvedValues){return {...(patient?.shared||{}),...sharedValues({shared:approvedValues})}}
