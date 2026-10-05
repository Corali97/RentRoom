import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { startServer } from '../server.mjs';

// Solo para desarrollo local: crea tres cuentas de prueba.
const suffix=Date.now().toString();
const password='Prueba-'+randomBytes(16).toString('hex');
let instance;
let base;
const checks=[];
async function boot(){
 instance=await startServer({port:0,host:'127.0.0.1',env:process.env});
 base=`http://127.0.0.1:${instance.server.address().port}/api`;
}
async function request(path,{method='GET',body,cookie,origin='http://localhost:4200'}={}){
 const response=await fetch(base+path,{method,headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0],headers:response.headers};
}
function status(result,expected,label){assert.equal(result.status,expected,`${label}: ${JSON.stringify(result.body)}`);checks.push(label);}
async function account(name,role){
 const email=`prueba.s8.${name}.${suffix}@example.invalid`;
 const r=await request('/auth/register',{method:'POST',body:{fullName:`Prueba S8 ${name}`,email,password,role}});
 status(r,201,`registro ${role} ${name}`);assert.ok(r.cookie);assert.equal(r.body.user.role,role);return {email,cookie:r.cookie,id:r.body.user.id};
}
try{
 await boot();
 status(await request('/health'),200,'conexion Oracle');
 const owner=await account('propietario','PROPIETARIO');
 const other=await account('otro','PROPIETARIO');
 const client=await account('cliente','CLIENTE');
 status(await request('/auth/register',{method:'POST',body:{fullName:'Duplicado',email:owner.email.toUpperCase(),password,role:'CLIENTE'}}),409,'rechazo correo duplicado normalizado');
 status(await request('/auth/register',{method:'POST',body:{fullName:'Rol invalido',email:`admin.${suffix}@example.invalid`,password,role:'ADMIN'}}),400,'rechazo rol no permitido');
 const form={name:`Prueba Oracle ${suffix}`,description:'Producto de verificacion S8',category:'Pruebas',purchaseValue:25000,rentalValue:1500,guarantee:5000,imageUrl:''};
 status(await request('/products',{method:'POST',body:form}),401,'publicacion anonima rechazada');
 status(await request('/products',{method:'POST',body:form,cookie:client.cookie}),403,'cliente no puede publicar');
 status(await request('/products',{method:'POST',body:form,cookie:owner.cookie,origin:'http://malicious.invalid'}),403,'origen no autorizado rechazado');
 status(await request('/products',{method:'POST',body:{...form,rentalValue:-1},cookie:owner.cookie}),400,'importe negativo rechazado');
 const created=await request('/products',{method:'POST',body:{...form,ownerEmail:other.email},cookie:owner.cookie});
 status(created,201,'producto guardado en Oracle');
 const id=created.body.product.id;
 assert.equal(created.body.product.ownerEmail,owner.email);
 status(await request(`/products/${id}`,{method:'PUT',body:{...form,name:'Intrusion'},cookie:other.cookie}),404,'otro propietario no puede editar');
 status(await request(`/products/${id}`,{method:'DELETE',cookie:other.cookie}),404,'otro propietario no puede eliminar');
 status(await request('/auth/profile',{method:'PATCH',body:{fullName:'Propietario verificado S8'},cookie:owner.cookie}),200,'perfil actualizado');
 const edited=await request(`/products/${id}`,{method:'PUT',body:{...form,name:`Producto persistente ${suffix}`,status:'DISPONIBLE'},cookie:owner.cookie});
 status(edited,200,'producto actualizado por su propietario');
 const publicList=await request('/products');
 assert.equal(publicList.body.products.find(p=>p.id===id).ownerEmail,'');checks.push('correo del propietario protegido en catalogo publico');
 await instance.close();
 await boot();
 const me=await request('/auth/me',{cookie:owner.cookie});status(me,200,'sesion persiste al reiniciar API');
 assert.equal(me.body.user.fullName,'Propietario verificado S8');checks.push('perfil persiste en Oracle');
 const list=await request('/products',{cookie:owner.cookie});
 assert.equal(list.body.products.find(p=>p.id===id).name,`Producto persistente ${suffix}`);checks.push('producto persiste al reiniciar API');
 status(await request('/auth/logout',{method:'POST',cookie:owner.cookie}),200,'cierre de sesion');
 status(await request('/auth/me',{cookie:owner.cookie}),401,'sesion revocada rechazada');
 status(await request('/auth/login',{method:'POST',body:{email:owner.email,password:'incorrecta'}}),401,'clave incorrecta rechazada');
 const login=await request('/auth/login',{method:'POST',body:{email:owner.email,password}});status(login,200,'nuevo inicio de sesion');
 status(await request(`/products/${id}`,{method:'DELETE',cookie:login.cookie}),200,'retiro del producto por su propietario');
 const after=await request('/products');assert.ok(!after.body.products.some(p=>p.id===id));checks.push('producto retirado no aparece en catalogo');
 await fs.writeFile('integration-result.json',JSON.stringify({timestamp:new Date().toISOString(),passed:checks.length,checks,testEmails:[owner.email,other.email,client.email],productId:id},null,2));
 console.log(JSON.stringify({passed:checks.length,checks},null,2));
}finally{await instance?.close();}
