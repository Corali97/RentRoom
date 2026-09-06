# Product Backlog

Escala de estimación: puntos Fibonacci (`1, 2, 3, 5, 8`). Las prioridades y estimaciones se revisan en cada Sprint Planning.

| ID | Historia de usuario | Criterios de aceptación | Prioridad | Puntos | Plan |
|---|---|---|---|---:|---|
| HU-01 | Como integrante del equipo, quiero una arquitectura y convenciones acordadas para trabajar de forma consistente. | Se documentan componentes, flujo de datos, versiones, variables de entorno y convenciones; ambos integrantes aprueban las decisiones. | Alta | 3 | S1 |
| HU-02 | Como equipo, quiero un modelo inicial de datos para validar que el dominio soporta productos y reservas. | El DER contiene usuarios, productos, categorías y reservas; incluye claves, relaciones y restricciones principales; es revisado por ambos. | Alta | 5 | S1 |
| HU-03 | Como equipo, quiero contratos iniciales de API para coordinar front-end y back-end. | Se documentan endpoints del MVP, métodos, rutas, entradas, salidas y errores; no se requiere implementarlos; existe revisión cruzada. | Alta | 5 | S1 |
| HU-04 | Como usuario, quiero una navegación y pantallas prototipadas para comprender el flujo antes del desarrollo. | El prototipo cubre acceso, catálogo, detalle, publicación y reservas; identifica estados vacío, carga y error; recibe validación del equipo. | Alta | 5 | S1 |
| HU-05 | Como usuario, quiero registrarme e iniciar sesión para acceder a funciones personales. | Se validan campos; credenciales inválidas muestran un mensaje seguro; la sesión permite entrar y salir; contraseñas no se almacenan en texto plano. | Alta | 8 | S2 |
| HU-06 | Como propietario, quiero publicar un producto para ofrecerlo en arriendo. | Se solicitan nombre, descripción, categoría, precio y disponibilidad; se validan campos; al guardar, el producto queda asociado al propietario. | Alta | 8 | S2 |
| HU-07 | Como propietario, quiero editar o desactivar mi producto para mantener vigente la información. | Solo el propietario puede modificarlo; se validan cambios; un producto desactivado deja de aparecer en resultados públicos. | Alta | 5 | S2 |
| HU-08 | Como visitante, quiero ver el catálogo para conocer los productos disponibles. | Se listan productos activos con información resumida; existen estados de carga, vacío y error; cada elemento permite abrir el detalle. | Alta | 5 | S2 |
| HU-09 | Como visitante, quiero buscar y filtrar productos para encontrar opciones relevantes. | Se puede buscar por texto y filtrar al menos por categoría; los filtros se pueden limpiar; los resultados reflejan los criterios aplicados. | Alta | 8 | S3 |
| HU-10 | Como visitante, quiero consultar el detalle de un producto para decidir si me interesa arrendarlo. | Se muestran datos esenciales, precio, disponibilidad y propietario; los productos inexistentes o inactivos se manejan correctamente. | Alta | 5 | S3 |
| HU-11 | Como arrendatario, quiero solicitar una reserva por un rango de fechas para arrendar un producto. | La fecha final es posterior a la inicial; no se permiten fechas no disponibles; se calcula o informa el valor; la solicitud queda pendiente y vinculada a usuario y producto. | Alta | 8 | S3 |
| HU-12 | Como propietario, quiero aprobar o rechazar solicitudes para gestionar el arriendo de mis productos. | Solo el propietario decide; solo solicitudes pendientes cambian de estado; la decisión queda persistida; una aprobación evita solapamientos posteriores. | Alta | 8 | S4 |
| HU-13 | Como usuario, quiero consultar mis reservas y su estado para hacer seguimiento. | Se muestran reservas relacionadas con la cuenta y sus estados; se distingue el rol en cada operación; se contempla el estado vacío. | Media | 5 | S4 |
| HU-14 | Como propietario, quiero consultar mis publicaciones y sus solicitudes para administrarlas desde un solo lugar. | Se muestran únicamente productos propios; cada producto expone solicitudes pertinentes; se puede acceder a las acciones autorizadas. | Media | 5 | S4 |
| HU-15 | Como equipo, quiero validar calidad, seguridad y documentación para entregar un incremento confiable. | Pruebas críticas aprobadas; validación de permisos y entradas; sin secretos versionados; instrucciones de instalación y evidencia académica actualizadas. | Alta | 8 | S4 |

## Épicas sugeridas

- Fundamentos: HU-01 a HU-04.
- Identidad y publicaciones: HU-05 a HU-08.
- Descubrimiento y reservas: HU-09 a HU-11.
- Gestión y calidad: HU-12 a HU-15.

## Reglas de mantenimiento

- El Product Owner ordena el backlog según valor, riesgo y dependencias.
- Dividir una historia si no cabe razonablemente en un Sprint.
- No iniciar historias sin cumplir la Definition of Ready.
- Todo cambio de alcance debe reflejarse aquí y en el Sprint correspondiente.

