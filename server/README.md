# API de RentRoom con Oracle

Requiere Node.js 22 o posterior y las migraciones de la carpeta `database` aplicadas por el administrador. La API utiliza el controlador Oracle Thin; no necesita Oracle Instant Client.

1. Ejecutar `npm ci` en esta carpeta.
2. Copiar `.env.example` a `.env` y configurar la contraseña del usuario de ejecución de Oracle. Mantener `.env` fuera de Git.
3. Ejecutar `npm start`. El servicio escucha por defecto en `127.0.0.1:3001`.
4. Abrir la aplicación con el proxy de desarrollo que dirige `/api` a este servicio.

Las cuentas nuevas guardan un hash scrypt con sal individual. Los usuarios anteriores con contraseñas de otro formato o sin rol válido no pueden iniciar sesión; sus datos no se convierten ni se modifican automáticamente. Una cuenta local anterior en el navegador tampoco se migra a Oracle.

Las sesiones duran ocho horas. El navegador recibe una cookie `HttpOnly` y `SameSite=Strict`; Oracle conserva únicamente el hash del token. Al cerrar sesión se revoca ese token. Para un despliegue HTTPS se debe configurar `COOKIE_SECURE=true` y los orígenes exactos de la aplicación en `ALLOWED_ORIGINS`. El servidor no habilita CORS; el cliente accede por su propio origen mediante el proxy.

Todos los cambios requieren un encabezado `Origin` incluido en `ALLOWED_ORIGINS`. Solo los propietarios pueden crear, editar o retirar sus propios productos. La retirada es lógica (`INACTIVO`) y conserva el historial. Un producto reservado o con reservas pendientes/confirmadas no puede modificarse ni retirarse. El catálogo público muestra solo productos disponibles y no revela los correos de otros propietarios.

## Rutas

| Método | Ruta | Resultado |
|---|---|---|
| GET | `/api/health` | Comprueba la conexión real a Oracle. |
| POST | `/api/auth/register` | Crea cuenta y sesión. |
| POST | `/api/auth/login` | Inicia sesión. |
| GET | `/api/auth/me` | Recupera la sesión. |
| PATCH | `/api/auth/profile` | Modifica el nombre del usuario actual. |
| POST | `/api/auth/logout` | Revoca la sesión. |
| GET | `/api/products` | Lista productos disponibles. |
| POST | `/api/products` | Publica un producto propio. |
| PUT | `/api/products/:id` | Modifica un producto propio. |
| DELETE | `/api/products/:id` | Retira un producto propio. |
| GET | `/api/sample-reservations` | Lista las reservas vigentes de la cuenta Cliente autenticada. |
| POST | `/api/sample-reservations` | Reserva una prenda de muestra por fechas en Oracle; bloquea fechas superpuestas. |

`npm test` ejecuta pruebas de validación, contraseñas, cookies, protección de origen, límite de solicitudes y errores. Las pruebas no se conectan a Oracle; la verificación integral con la base real se realiza por separado.

Las reservas de las dos prendas de muestra se guardan en `RESERVA_MUESTRA`; solo cuentas Cliente autenticadas pueden reservarlas. El precio diario y la garantía se registran como valores históricos en cada reserva. Las reservas de las publicaciones de propietario en `PRODUCTO`, devoluciones y daños quedan fuera de este flujo. Ejecutar `database/migrate_sample_reservations.sql` y otorgar a la cuenta de API los permisos descritos en `INTEGRACION_ORACLE.md`. Los valores de compra históricos desconocidos se devuelven como `null` y deben completarse al editar el producto.
