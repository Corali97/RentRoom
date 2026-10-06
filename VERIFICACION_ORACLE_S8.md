# RentRoom: integración local con Oracle

Verificación realizada el 5 de octubre de 2026 sobre una copia del repositorio
Corali97/RentRoom, basada en el commit ebaed32.

## Resultado

La aplicación guarda y recupera usuarios y productos mediante una API conectada a
Oracle XE, servicio XEPDB1, esquema RENTROOM_S5_EVIDENCE. Registro, inicio de sesión,
actualización del nombre del perfil, publicación, edición y retirada de productos
funcionan contra la base real. Los datos se conservan al reiniciar la API.

Se agregó el rol del usuario, el valor de compra y la URL de imagen del producto,
además de una tabla de sesiones. La cuenta RENTROOM_API_S8 tiene permisos limitados
para las operaciones de la API. Las tablas de SYSTEM no se modificaron.

Las contraseñas se guardan con scrypt y una sal individual. Las sesiones usan una
cookie HttpOnly; la base conserva únicamente el hash del token de sesión. La API
comprueba el rol y el propietario de cada producto. Retirar un producto lo marca
INACTIVO, conservando sus referencias históricas.

## Verificación

- Compilación de la aplicación: correcta.
- Pruebas automatizadas de frontend: 25 aprobadas.
- Pruebas automatizadas de API: 6 aprobadas.
- Comprobaciones integrales contra Oracle: 25 aprobadas.
- Repetición de la migración: correcta, sin duplicar objetos.
- Aplicación local: HTTP 200; la comprobación de Oracle responde correctamente
  pasando por el proxy de la aplicación.

La prueba integral verificó persistencia tras reiniciar la API, correo duplicado,
roles inválidos, importes negativos, publicación anónima, edición y eliminación
por otro propietario, privacidad del correo en catálogo, cierre de sesión y
rechazo de contraseñas incorrectas.

Quedaron tres cuentas identificadas como pruebas y un producto de prueba INACTIVO;
sus contraseñas aleatorias no se incluyen en los archivos de entrega. Antes de
las pruebas, las tablas USUARIO, PRODUCTO y RESERVA del esquema estaban vacías.
El catálogo público queda vacío hasta publicar un producto propio.

## Uso en este equipo

Mientras estén ejecutándose los servicios, abrir http://127.0.0.1:4200/usuario.
Registrar una cuenta nueva con perfil Propietario y una contraseña de al menos
ocho caracteres; después ir a Catálogo para publicar.

El comando `npm run start:local` permite iniciar ambos servicios después de configurar
las dependencias y la conexión. Si ya están abiertos, usar directamente el enlace.
La configuración privada de Oracle se conserva en server/.env de la copia local;
está excluida de Git y del ZIP. Consultar INTEGRACION_ORACLE.md dentro del ZIP para
la instalación en otro equipo.

## Alcance pendiente

Esto no cierra todas las historias de usuario: todavía falta implementar o validar
la disponibilidad por fechas y unidades, las reservas, garantías, devoluciones,
daños, historial y detalle del producto. Las fotografías siguen siendo URLs, no
archivos subidos. El perfil actual modifica el nombre, no el correo ni el teléfono.

La interfaz compila y está cubierta por pruebas de componentes; no se realizó una
inspección visual manual completa del navegador en esta sesión. La configuración
es para uso local, no un despliegue público. Las pruebas realizadas no equivalen
al cierre de todas las historias de usuario.
