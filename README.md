# RentRoom

Plataforma web académica para publicar, buscar, reservar y gestionar productos en arriendo.

> **Estado actual: Semana 4 – análisis, visión del producto y diseño inicial.** A la fecha se ha trabajado en la definición del proyecto, requerimientos y Product Backlog, planificación Scrum, arquitectura inicial, modelo de datos, análisis del caso, definición del Squad, mapa mental, mapa de actores, Product Goal y visión del producto. Las historias de usuario del Product Backlog continúan planificadas y no se presentan como funcionalidades implementadas.

## Equipo

| Integrante | Área principal | Responsabilidades |
|---|---|---|
| Corali Rodríguez | Análisis e integración | Análisis de requerimientos, diseño funcional, integración, pruebas funcionales y documentación. |
| Lis Cabrera Soto | Back-end y datos | Back-end, base de datos, API REST, seguridad y pruebas técnicas. |

Ambas integrantes participan en la planificación, decisiones de arquitectura, revisión de avances, control de calidad y documentación del proyecto.

## Objetivo del proyecto

Desarrollar RentRoom, una plataforma web segura y funcional para la publicación, búsqueda, reserva y gestión de productos en arriendo, integrando una base de datos relacional, servicios API REST y mecanismos de control que permitan administrar de forma centralizada el proceso de arriendo.

## Tecnologías definidas

- Front-end: Angular e Ionic.
- Back-end: Node.js.
- Integración: API REST.
- Base de datos: Oracle y SQL.
- Control de versiones: Git y GitHub.
- Gestión del proyecto: Trello.
- Modelado: Draw.io / Lucidchart / StarUML.
- Metodología: Scrum adaptado a un equipo de dos integrantes.

## Estructura del repositorio

```text
RentRoom/
├── .github/                 # Configuración de GitHub
├── backend/                 # Futuro servicio Node.js y API REST
├── database/                # Modelo de datos y futuros scripts Oracle/SQL
├── docs/                    # Documentación del proyecto y Scrum
├── frontend/                # Futura aplicación Angular/Ionic
├── .editorconfig
├── .gitignore
└── README.md
```

Las carpetas de desarrollo representan la estructura planificada. En Semana 4 el proyecto continúa en las etapas de análisis, planificación y diseño inicial; las funcionalidades del sistema todavía no se declaran como implementadas.

## Metodología Scrum

El trabajo se organiza mediante Sprints de dos semanas, con una dedicación estimada de 6 horas semanales por integrante.

Ceremonias consideradas:

- **Sprint Planning:** selección y priorización de historias y tareas al inicio de cada Sprint.
- **Daily Scrum:** coordinación breve del equipo durante el desarrollo.
- **Sprint Review:** revisión del incremento y cumplimiento de criterios de aceptación.
- **Sprint Retrospective:** análisis de dificultades, logros y oportunidades de mejora.

Para la gestión del Product Backlog y seguimiento se utiliza Trello. GitHub mantiene el control de versiones y las evidencias técnicas. El seguimiento del Sprint se apoya mediante un **Burndown Chart**.

## Avance hasta Semana 4

### Semana 1
- Definición de RentRoom y problemática a resolver.
- Identificación inicial de usuarios y necesidades.
- Definición preliminar de alcance y tecnologías.

### Semana 2
- Fundamentación y objetivos del proyecto.
- Definición de metodología de trabajo.
- Elaboración del plan de trabajo y cronograma.
- Product Backlog inicial.

### Semana 3
- Consolidación de la propuesta del proyecto.
- Definición de roles y responsabilidades.
- Revisión de alcance y limitaciones.
- Relación del proyecto con las competencias de la carrera.
- Definición de tecnologías y estructura inicial del repositorio.
- Sprint Planning, Sprint Review y Sprint Retrospective del Sprint 1.
- Elaboración del Burndown Chart para seguimiento del Sprint 1.
- Diseño de arquitectura inicial.
- Elaboración del modelo de datos inicial.

### Semana 4
- Análisis del caso RentRoom y su problemática.
- Definición del Squad y responsabilidades según Scrum.
- Elaboración del mapa mental del proyecto.
- Elaboración del mapa de actores según influencia e interés.
- Definición del Product Goal.
- Definición de la visión del producto.
- Identificación de los cuatro pilares: grupo objetivo, necesidades, producto/servicio y valor entregado.
- Definición de la proyección futura de RentRoom.
- Consolidación del modelo de datos inicial con las entidades USUARIO, PRODUCTO, UNIDAD_PRODUCTO, RESERVA, ARRIENDO, GARANTIA, DEVOLUCION y DANO.

## Modelo de datos inicial

El modelo inicial considera las entidades necesarias para representar el ciclo principal de arriendo y mantener trazabilidad sobre productos, unidades, reservas, garantías, devoluciones y posibles daños.

Relaciones principales planificadas:

- USUARIO publica PRODUCTO.
- PRODUCTO tiene UNIDAD_PRODUCTO.
- USUARIO realiza RESERVA.
- UNIDAD_PRODUCTO se asocia a RESERVA.
- RESERVA puede generar ARRIENDO.
- ARRIENDO puede poseer GARANTIA.
- ARRIENDO puede finalizar con DEVOLUCION.
- DEVOLUCION puede registrar DANO.

Este modelo corresponde al **diseño inicial** y podrá ajustarse durante la implementación y validación de la base de datos.

## Product Goal

Desarrollar una plataforma web que permita publicar, buscar, reservar y gestionar productos en arriendo de forma segura, organizada y trazable, orientando el desarrollo progresivo del producto mediante los Sprints y el Product Backlog.

## Visión del producto

Facilitar el acceso al arriendo de productos mediante una plataforma confiable, segura y accesible que conecte propietarios y clientes.

La visión se organiza en cuatro pilares:

1. **Grupo objetivo:** personas que necesitan productos de uso ocasional y propietarios que desean ofrecer productos en arriendo.
2. **Necesidades:** encontrar productos disponibles, reservar de forma segura y disponer de control de garantías, entregas y devoluciones.
3. **Producto / servicio:** plataforma web para publicar, buscar, reservar y gestionar productos en arriendo de manera centralizada.
4. **Valor entregado:** proceso de arriendo organizado, seguro y trazable que reduce costos y facilita el aprovechamiento de productos.

Como proyección, RentRoom busca consolidarse como una alternativa digital confiable y ampliar progresivamente sus funcionalidades.

## Planificación general

El cronograma académico contempla nueve semanas:

| Actividad | Periodo planificado |
|---|---|
| Requerimientos y Product Backlog | S1–S2 |
| Diseño y modelo de datos | S2–S3 |
| Base de datos y autenticación | S3–S4 |
| Productos, catálogo y disponibilidad | S4–S5 |
| Reservas y arriendos | S5–S6 |
| API REST, procedimientos y triggers | S6–S7 |
| Reportes y pruebas | S7–S8 |
| Correcciones y documentación | S8–S9 |
| Entrega y presentación final | S9 |

> Las funcionalidades que todavía no han sido desarrolladas permanecen como trabajo planificado en el Product Backlog. Su presencia en el cronograma no implica que estén implementadas.

## Control de versiones

La rama `main` mantiene la versión estable del proyecto. A medida que avance la implementación se podrán utilizar ramas de trabajo para desarrollar funcionalidades y realizar correcciones de manera controlada.

No se deben almacenar credenciales, contraseñas, archivos `.env`, dependencias instaladas ni información sensible en el repositorio.

## Estado de implementación

**Semana 4:** análisis, documentación, seguimiento Scrum, visión del producto y diseño inicial completados según el avance académico.

Las historias de usuario relacionadas con registro, inicio de sesión, perfiles, publicación de productos, catálogo, disponibilidad, reservas, arriendos, garantías, reportes y API REST permanecen en el Product Backlog hasta que su implementación y validación sean realizadas.
