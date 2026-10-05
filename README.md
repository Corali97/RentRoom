# RentRoom — Integración Oracle para Semana 8

Integración local verificada de usuarios y productos con Oracle mediante una API. Compilación correcta, 25 pruebas de frontend y 6 de API aprobadas, más 25 comprobaciones completas contra Oracle. Migración aplicada en XEPDB1 / RENTROOM_S5_EVIDENCE el 5 de octubre de 2026; verificada también su repetición sin duplicar objetos.

Consulta [INTEGRACION_ORACLE.md](INTEGRACION_ORACLE.md) para configurar y ejecutar. Los datos y credenciales no se incluyen en este paquete.

## Antecedente de Semana 7 (estado anterior a esta actualización)

# RentRoom — Semana 7 · Sprint II

Proyecto APT, Grupo 10. Estado documentado al 28/09/2026.

El avance de Semana 7 incorpora las funcionalidades principales de publicación, edición, eliminación y catálogo de productos. HU-04, HU-05 y HU-06 permanecen **En proceso** porque aún tienen criterios de aceptación pendientes.

## Avance implementado

- Registro, inicio de sesión y perfil Cliente/Propietario como base de iteraciones anteriores.
- Publicación de productos y validación de nombre, categoría y arriendo positivo.
- Edición y eliminación de productos propios desde el catálogo.
- Catálogo de productos DISPONIBLE y navegación hacia Inicio y Usuario.
- Conservación de productos inactivos al crear, editar o eliminar publicaciones.

## Verificación realizada

- Build de producción correcto y 21 pruebas automatizadas aprobadas en 6 archivos.
- Pruebas en navegador de registro, sesión, publicación, edición, eliminación, restricciones por propietario y navegación.
- Correcciones integradas mediante la [solicitud de cambios #2](https://github.com/Corali97/RentRoom/pull/2).

Estas verificaciones no equivalen a la aprobación completa de las historias.

## Criterios pendientes

| Historia | Pendientes identificados |
| --- | --- |
| HU-04 | Completar y comprobar fotografías y selección de disponibilidad. Actualmente se admite una URL y el estado inicial es DISPONIBLE. |
| HU-05 | Solicitar confirmación antes de eliminar. |
| HU-06 | Comprobar fotografías, incorporar acceso al detalle y validar disponibilidad de unidades para arriendo. |

## Ejecución local

Verificado con Node 24.19.0.

```sh
npm install
npm run build
npm test -- --watch=false
npm start
```

## Persistencia y base de datos

La aplicación probada utiliza localStorage del navegador. No está conectada al esquema Oracle de `database/` ni a una API de autenticación. El esquema SQL conserva el encabezado de Semana 6 porque corresponde a ese avance previo; no se presenta como una nueva implementación de Semana 7.

La instalación reportó 18 vulnerabilidades en dependencias y la compilación advierte sobre navegadores antiguos en Browserslist. No se ha validado la aplicación en dispositivo móvil.
