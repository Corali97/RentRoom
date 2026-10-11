# Modelo de datos RentRoom

Este directorio contiene el avance del esquema relacional de RentRoom.

En Semana 8, usuarios y productos se conectan a Oracle mediante la API de `server/`. El esquema inicial se conserva como antecedente; `migrate_s8.sql` agrega los campos y las sesiones que necesita la API sin borrar datos.
`migrate_sample_reservations.sql` agrega las dos prendas de muestra y reservas con rango de fechas, vinculadas a cuentas Cliente; las reservas quedan guardadas en Oracle.

`procedures_triggers.sql` (ejecutar después) crea la tabla `AUDITORIA_RESERVA`, la función `FN_TOTAL_RESERVA_MUESTRA`, los procedimientos `SP_CREAR_RESERVA_MUESTRA` y `SP_CANCELAR_RESERVA_MUESTRA`, y los triggers `TRG_RESERVA_MUESTRA_VALIDAR` (fechas y estados) y `TRG_RESERVA_MUESTRA_AUDITORIA` (bitácora). `test_procedures_triggers.sql` los prueba y deshace los cambios con ROLLBACK. En SQL Developer o SQL*Plus: `@procedures_triggers.sql` y luego `@test_procedures_triggers.sql`.

La API demo SQLite incluye triggers equivalentes (validación, superposición y auditoría), probados en `server/test/demo-triggers.test.mjs`; SQLite no soporta procedimientos almacenados.

## Entidades iniciales
- **USUARIO:** registro, autenticación y perfil.
- **PRODUCTO:** publicaciones disponibles para arriendo.
- **RESERVA:** solicitud y control de fechas de arriendo.
- **PRENDA_MUESTRA / RESERVA_MUESTRA:** catálogo pequeño de demostración y reservas persistentes por fecha, con tarifa y garantía guardadas como valores históricos.
- **SESION_API:** sesiones de acceso con token almacenado como hash y vencimiento.

El archivo `rentroom_schema.sql` incorpora claves primarias y foráneas, restricciones de integridad, un procedimiento almacenado y un trigger como evidencia inicial del trabajo con base de datos relacional.

La migración está limitada al esquema local `RENTROOM_S5_EVIDENCE` en `XEPDB1`. No ejecutar nuevamente el script inicial si sus tablas ya existen. Las contraseñas nuevas usan scrypt; los datos antiguos de localStorage no se importan. Ver [instrucciones de integración](../INTEGRACION_ORACLE.md) y [verificación](../VERIFICACION_ORACLE_S8.md).
