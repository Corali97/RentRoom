# Modelo de datos RentRoom

Este directorio contiene el avance del esquema relacional de RentRoom.

En la entrega de Semana 7 se incluye el esquema desarrollado hasta Semana 6 como antecedente. Las nuevas funcionalidades del Sprint II utilizan almacenamiento local; todavía no están integradas con esta base de datos.

## Entidades iniciales
- **USUARIO:** registro, autenticación y perfil.
- **PRODUCTO:** publicaciones disponibles para arriendo.
- **RESERVA:** solicitud y control de fechas de arriendo.

El archivo `rentroom_schema.sql` incorpora claves primarias y foráneas, restricciones de integridad, un procedimiento almacenado y un trigger como evidencia inicial del trabajo con base de datos relacional.

> Nota: la autenticación de la interfaz de Semana 5 utiliza almacenamiento local únicamente como prototipo funcional. En las siguientes iteraciones debe conectarse a un backend/API y almacenar contraseñas mediante hash seguro.
