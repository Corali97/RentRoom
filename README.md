# RentRoom

Plataforma web académica para publicar, buscar, reservar y gestionar productos en arriendo.

> Estado actual: preparación del entorno, definición del producto y planificación Scrum. Este repositorio aún no contiene funcionalidades implementadas.

## Equipo

| Integrante | Rol principal | Responsabilidades |
|---|---|---|
| Integrante 1 — completar nombre | Product Owner / Front-end | Priorizar el backlog, validar criterios y liderar Angular/Ionic. |
| Integrante 2 — completar nombre | Scrum Master / Back-end y datos | Facilitar Scrum y liderar Node.js, API REST y Oracle/SQL. |

Ambos integrantes participan en análisis, desarrollo, revisión, pruebas y documentación. Los roles técnicos pueden rotar para compartir conocimiento.

## Tecnologías previstas

- Front-end: Angular e Ionic.
- Back-end: Node.js y API REST.
- Base de datos: Oracle y SQL.
- Control de versiones: Git y GitHub.
- Metodología: Scrum, con Sprints de dos semanas.

Las versiones, dependencias y herramientas de scaffolding se decidirán durante el Sprint 1 y se documentarán antes de generar código de aplicación.

## Estructura del repositorio

```text
RentRoom/
├── .github/                 # Plantillas para issues y pull requests
├── backend/                 # Futuro servicio Node.js y API REST
├── database/                # Diseño, scripts y documentación Oracle/SQL
│   ├── diagrams/
│   ├── migrations/
│   ├── scripts/
│   └── seeds/
├── docs/                    # Producto, arquitectura y gestión Scrum
│   ├── architecture/
│   ├── product/
│   └── scrum/
├── frontend/                # Futura aplicación Angular/Ionic
├── .editorconfig
├── .gitignore
└── README.md
```

Cada módulo tendrá su propio README cuando sea inicializado. No se deben guardar credenciales, archivos `.env`, dependencias instaladas ni artefactos compilados.

## Forma de trabajo

Se usa una variante simple de GitHub Flow adecuada para dos integrantes:

- `main`: versión estable y demostrable; protegida y sin commits directos.
- `develop`: integración del trabajo aprobado para el Sprint.
- `feature/<id>-<descripcion>`: una historia o tarea, creada desde `develop`.
- `fix/<id>-<descripcion>`: corrección no urgente, creada desde `develop`.
- `docs/<descripcion>`: documentación y planificación.
- `hotfix/<descripcion>`: solo para una corrección urgente de `main`.

Flujo: actualizar `develop` → crear rama corta → commits pequeños → abrir Pull Request hacia `develop` → revisión del otro integrante → ejecutar verificaciones → fusionar. Al cerrar un Sprint estable, se abre un Pull Request de `develop` a `main` y se etiqueta como `v0.<sprint>.0`.

Convención sugerida de commits: `tipo(alcance): descripción`, por ejemplo `docs(backlog): agregar criterios de HU-01`. Tipos: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`.

## Scrum y cronograma

El proyecto se organiza en cuatro Sprints de dos semanas y una semana final de cierre:

| Periodo | Objetivo |
|---|---|
| Sprint 1 — semanas 1 y 2 | Alinear alcance, arquitectura, UX, modelo de datos y contratos de API. |
| Sprint 2 — semanas 3 y 4 | Construir el primer incremento de acceso y publicación de productos. |
| Sprint 3 — semanas 5 y 6 | Incorporar búsqueda, detalle y solicitud de reserva. |
| Sprint 4 — semanas 7 y 8 | Completar gestión, calidad, seguridad y preparación de entrega. |
| Semana 9 | Validación integral, memoria, presentación y cierre académico. |

La fuente de verdad del alcance es el [Product Backlog](docs/product/product-backlog.md). El detalle de ceremonias y entregables está en el [plan de Sprints](docs/scrum/sprint-plan.md), y el seguimiento diario se registra en el [Burndown Chart](docs/scrum/burndown.md).

## Ceremonias

- Sprint Planning: al inicio del Sprint; define objetivo, capacidad, historias y tareas.
- Daily Scrum: 10–15 minutos; coordinación breve entre ambos integrantes.
- Sprint Review: al final; demostración del incremento y actualización del backlog.
- Sprint Retrospective: después de la Review; acciones concretas de mejora.

## Definition of Ready

Una historia puede entrar a un Sprint cuando tiene valor claro, criterios de aceptación verificables, dependencias identificadas, estimación acordada y tamaño abordable dentro del Sprint.

## Definition of Done

Una historia está terminada cuando cumple sus criterios, fue revisada mediante Pull Request, cuenta con pruebas acordes al riesgo, no expone secretos, actualiza la documentación necesaria y está integrada en `develop`. Para publicar en `main`, el incremento además debe ser demostrable.

## Inicio rápido (solo organización)

1. Completar nombres y roles del equipo en este archivo.
2. Crear el repositorio vacío `RentRoom` en GitHub, sin añadir README ni `.gitignore` remotos.
3. Conectar este repositorio local: `git remote add origin <URL_DEL_REPOSITORIO>`.
4. Publicar: `git push -u origin main` y luego `git push -u origin develop`.
5. Proteger `main` y `develop`, exigiendo Pull Request y una aprobación.
6. Crear los hitos `Sprint 1` a `Sprint 4` y trasladar las historias del backlog a GitHub Issues.

## Documentación

- [Visión y alcance](docs/product/vision-and-scope.md)
- [Product Backlog](docs/product/product-backlog.md)
- [Plan de Sprints y ceremonias](docs/scrum/sprint-plan.md)
- [Plantilla de Burndown Chart](docs/scrum/burndown.md)
- [Decisiones de arquitectura](docs/architecture/README.md)

