# Modelo de datos RentRoom - Semana 5

Este directorio contiene el avance del esquema relacional de RentRoom.

## Entidades iniciales
- **USUARIO:** registro, autenticación y perfil.
- **PRODUCTO:** publicaciones disponibles para arriendo.
- **RESERVA:** solicitud y control de fechas de arriendo.

El archivo `rentroom_schema.sql` incorpora claves primarias y foráneas, restricciones de integridad, un procedimiento almacenado y un trigger como evidencia inicial del trabajo con base de datos relacional.

> Nota: la autenticación de la interfaz de Semana 5 utiliza almacenamiento local únicamente como prototipo funcional. En las siguientes iteraciones debe conectarse a un backend/API y almacenar contraseñas mediante hash seguro.
