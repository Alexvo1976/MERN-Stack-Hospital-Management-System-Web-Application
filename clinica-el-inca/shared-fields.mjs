// Conservative exact matching: never confuse patient with spouse, guardian or emergency contact.
export const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const groups={name:['nombre del paciente','nombre paciente','nombres y apellidos','nombre completo','patient name','full name','name'],identity:['cedula','cedula de identidad','identificacion','numero de identificacion','documento de identidad','identity'],birth_date:['fecha de nacimiento','fecha nacimiento','date of birth','birth date','dob'],address:['direccion','domicilio','direccion del paciente','address'],email:['direccion email','otro direccion email','correo electronico','email','e mail'],phone:['celular','telefono celular','telefono','telefono del paciente','mobile','phone'],sex:['sexo','sex','genero'],city:['ciudad','ciudad estado'],zip:['zip','codigo postal']};
const lookup=new Map(Object.entries(groups).flatMap(([k,labels])=>labels.map(l=>[normalize(l),k])));
export function infer(field){return lookup.get(normalize(field.label))||lookup.get(normalize(field.widget))||''}
export function mapped(fields){return fields.map(f=>({...f,key:f.key||(!f.noShare?infer(f):'')}))}
export function sharedValues(patient){return {...(patient?.shared||{}),...(patient?.identity?{identity:patient.identity}:{})}}
