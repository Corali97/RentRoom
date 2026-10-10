# Modelo de datos RentRoom

Este directorio contiene el avance del esquema relacional de RentRoom.

En Semana 8, usuarios y productos se conectan a Oracle mediante la API de `server/`. El esquema inicial se conserva como antecedente; `migrate_s8.sql` agrega los campos y las sesiones que necesita la API sin borrar datos.
`migrate_sample_reservations.sql` agrega las dos prendas de muestra y reservas con rango de fechas, vinculadas a cuentas Cliente; las reservas quedan guardadas en Oracle.

## Entidades iniciales
- **USUARIO:** registro, autenticación y perfil.
- **PRODUCTO:** publicaciones disponibles para arriendo.
- **RESERVA:** solicitud y control de fechas de arriendo.
- **PRENDA_MUESTRA / RESERVA_MUESTRA:** catálogo pequeño de demostración y reservas persistentes por fecha, con tarifa y garantía guardadas como valores históricos.
- **SESION_API:** sesiones de acceso con token almacenado como hash y vencimiento.

El archivo `rentroom_schema.sql` incorpora claves primarias y foráneas, restricciones de integridad, un procedimiento almacenado y un trigger como evidencia inicial del trabajo con base de datos relacional.

La migración está limitada al esquema local `RENTROOM_S5_EVIDENCE` en `XEPDB1`. No ejecutar nuevamente el script inicial si sus tablas ya existen. Las contraseñas nuevas usan scrypt; los datos antiguos de localStorage no se importan. Ver [instrucciones de integración](../INTEGRACION_ORACLE.md) y [verificación](../VERIFICACION_ORACLE_S8.md).
