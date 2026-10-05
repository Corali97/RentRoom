# RentRoom: usuarios y productos en Oracle

Esta actualizacion conecta la aplicacion web a una API local. La API guarda usuarios,
perfiles, sesiones y productos en Oracle. Las reservas y su disponibilidad por fechas
no forman parte de esta integracion inicial.

## Preparacion

Usar Node.js 24.19 o posterior compatible con Angular 22. El Node 16 instalado en
este equipo no sirve para compilar este proyecto.

La base debe disponer de las tablas del esquema `database/rentroom_schema.sql`.
Sobre un esquema existente, ejecutar `database/migrate_s8.sql` como su propietario.
No volver a ejecutar los CREATE TABLE iniciales en una base que ya contiene tablas.
Guardar una copia de la estructura antes de la migracion. Los cambios DDL de Oracle
se confirman inmediatamente; la migracion no borra registros.

Crear una cuenta de API separada con CREATE SESSION y estos permisos sobre el esquema:

- USUARIO y PRODUCTO: SELECT, INSERT, UPDATE.
- RESERVA: SELECT.
- SESION_API: SELECT, INSERT, DELETE.

La cuenta de API no debe ser SYS ni SYSTEM ni tener permisos de creacion de tablas.
Copiar `server/.env.example` a `server/.env` y completar las credenciales localmente.
Ese archivo no debe subirse a GitHub ni incluirse en la entrega publica.

## Ejecutar

Desde la carpeta principal:

```sh
npm ci
npm --prefix server ci
npm --prefix server start
```

En otra terminal de la carpeta principal:

```sh
npm start
```

Abrir http://localhost:4200. Angular envia las rutas /api al servidor local del
puerto 3001. Para publicar en otro entorno hay que configurar un proxy equivalente
y HTTPS; activar COOKIE_SECURE=true y configurar los origenes permitidos.

## Comprobar el avance

Crear una cuenta Propietario desde Usuario, publicar un producto, recargar la pagina
y volver a iniciar sesion. El producto debe seguir disponible. Editarlo y verificar
que otro propietario no pueda modificarlo. Cerrar sesion debe invalidar su acceso.

Los datos antiguos guardados en el navegador no se importan automaticamente:
incluyen contrasenas en texto plano y carecen de identificadores de Oracle.
Las cuentas de evidencia sin rol o con formatos de clave anteriores requieren
revision; no se les asigna un rol ni se modifica su contrasena automaticamente.

La imagen del producto sigue siendo una URL; esto no implementa carga de fotografias,
detalle del producto ni calendario de disponibilidad. El estado de las HU debe
revisarse con sus criterios completos antes de marcarlas terminadas.

Referencia del controlador: https://node-oracledb.readthedocs.io/en/latest/user_guide/connection_handling.html
