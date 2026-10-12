# RentRoom · Semana 9 · Reservas y seguimiento

Esta rama incorpora código para solicitud de reservas, consulta de fechas ocupadas, confirmación, entrega, devolución, daños, estado de garantía e historial. **No es evidencia de funcionamiento contra la base Oracle real hasta ejecutar las migraciones y pruebas de integración.** El sistema no efectúa pagos ni transferencias bancarias.

## 1. Instalación

1. Respaldar el esquema y los datos Oracle antes de aplicar cambios.
2. Confirmar que el esquema de Semana 8 ya contiene USUARIO, PRODUCTO, RESERVA y SESION_API.
3. Conectado como **propietario del esquema** (no como cuenta limitada de la API), ejecutar en este orden:
   - `database/migrate_s9_reservas.sql`
   - `database/migrate_s9_seguimiento.sql`
4. La segunda migración crea dos tablas nuevas y solo debe ejecutarse una vez en un esquema nuevo. No borra registros existentes; no repetir `CREATE TABLE`.
5. Revisar el resultado de `USER_OBJECTS`: los procedimientos deben figurar `VALID`.
6. Dar a la cuenta limitada de API:
   - SELECT, INSERT, UPDATE sobre RESERVA y SEGUIMIENTO_ARRIENDO;
   - SELECT e INSERT sobre HISTORIAL_ARRIENDO;
   - EXECUTE sobre SP_CREAR_RESERVA, SP_CANCELAR_RESERVA, SP_CONFIRMAR_RESERVA y SP_GESTIONAR_ARRIENDO;
   - mantener permisos existentes sobre USUARIO, PRODUCTO y SESION_API.
   Si las tablas están en otro esquema, conceder privilegios directos. No ejecutar la aplicación con SYS o SYSTEM.

En el computador con Node 24.19+:
```bash
npm ci
npm --prefix server ci
npm run test:api
npm test -- --watch=false
npm run build
```

Configurar `server/.env` localmente a partir de `server/.env.example` y **no subirlo**.
Abrir dos terminales:
```bash
npm --prefix server start
npm start
```
Abrir http://localhost:4200 y seleccionar **Disponibilidad y reservas** desde Catálogo.

## 2. Validación funcional pendiente en Oracle

- Registrarse como Propietario y como Cliente.
- Publicar un producto y reservar días futuros con el Cliente.
- Intentar reservar las mismas fechas con otro Cliente: debe indicar conflicto.
- Comprobar que el propietario puede confirmar pero no reservar como cliente.
- Registrar entrega, devolución, daños y garantía; comprobar el historial desde la cuenta autorizada.
- Verificar que un Cliente no puede cancelar una reserva después de registrar la entrega.
- Comprobar persistencia reiniciando API y refrescando el navegador.

## 3. Límites

- La garantía corresponde a un **estado informativo**; no hay pasarela de pago.
- La fotografía de producto continúa siendo una URL.
- No hay evidencia de ejecución contra Oracle del computador de la estudiante; no marcar automáticamente HU08-HU15 como terminadas.
- Las pruebas automatizadas sin Oracle comprueban validación y rutas; no sustituyen una prueba real de concurrencia.
