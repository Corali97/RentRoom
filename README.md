# RentRoom

Plataforma web académica para publicar, buscar, reservar y gestionar productos en arriendo.

> **Estado actual: Semana 3 – planificación y diseño inicial.** A la fecha se ha trabajado en la definición del proyecto, levantamiento inicial de requerimientos, Product Backlog, planificación Scrum, definición de tecnologías, estructura del repositorio y diseño inicial. Las funcionalidades del sistema serán implementadas progresivamente durante las siguientes semanas según el cronograma establecido.

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
- Modelado: Draw.io / StarUML.
- Metodología: Scrum adaptado a un equipo de dos integrantes.

## Estructura inicial del repositorio

```text
RentRoom/
├── .github/                 # Configuración de GitHub
├── backend/                 # Futuro servicio Node.js y API REST
├── database/                # Diseño y futuros scripts Oracle/SQL
├── docs/                    # Documentación del proyecto y Scrum
├── frontend/                # Futura aplicación Angular/Ionic
├── .editorconfig
├── .gitignore
└── README.md
```

Las carpetas de desarrollo representan la estructura planificada. En Semana 3 el proyecto se encuentra todavía en etapa de planificación y diseño inicial, por lo que no se presentan como funcionalidades terminadas.

## Metodología Scrum

El trabajo se organiza mediante Sprints de dos semanas, con una dedicación estimada de 6 horas semanales por integrante.

Ceremonias consideradas:

- **Sprint Planning:** selección y priorización de historias y tareas al inicio de cada Sprint.
- **Daily Scrum:** coordinación breve del equipo durante el desarrollo.
- **Sprint Review:** revisión del incremento y cumplimiento de criterios de aceptación.
- **Sprint Retrospective:** análisis de dificultades, logros y oportunidades de mejora.

Para la gestión del Product Backlog y seguimiento se utilizará Trello. GitHub permitirá mantener el control de versiones y evidencias técnicas. El avance de los Sprints se apoyará con un **Burndown Chart**.

## Avance hasta Semana 3

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
- Incorporación de Sprint Planning, Sprint Review, Sprint Retrospective y Burndown Chart al seguimiento metodológico.
- Inicio del diseño y modelo de datos según el cronograma.

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

> Las actividades posteriores a la Semana 3 corresponden únicamente a **planificación futura** y no indican funcionalidades ya implementadas.

## Control de versiones

La rama `main` mantiene la versión estable del proyecto. A medida que comience la implementación se utilizarán ramas de trabajo para desarrollar funcionalidades y realizar correcciones de manera controlada.

No se deben almacenar credenciales, contraseñas, archivos `.env`, dependencias instaladas ni información sensible en el repositorio.

## Estado de implementación

**Semana 3:** planificación, documentación y diseño inicial en curso.

Actualmente no se declaran como terminadas las funcionalidades de autenticación, productos, catálogo, reservas, arriendos, garantías, reportes ni API REST. Estas serán desarrolladas progresivamente de acuerdo con el cronograma del proyecto.
