# Plan Scrum — 9 semanas

La capacidad debe recalcularse al iniciar cada Sprint según disponibilidad académica. Los puntos son una estimación relativa, no horas ni compromisos rígidos.

## Sprint 1 — semanas 1 y 2

**Objetivo:** dejar una base técnica y funcional validada antes de implementar funcionalidades.

Historias candidatas: HU-01, HU-02, HU-03 y HU-04 (18 puntos).

Entregables: arquitectura inicial, modelo de datos, contrato de API, prototipo de navegación y convenciones del repositorio. No incluye implementación funcional.

## Sprint 2 — semanas 3 y 4

**Objetivo:** obtener un primer incremento que permita acceso básico, publicación y visualización del catálogo.

Historias candidatas: HU-05, HU-06, HU-07 y HU-08 (26 puntos). Si la capacidad resulta menor, HU-07 es la primera candidata para regresar al Product Backlog sin comprometer la meta central.

## Sprint 3 — semanas 5 y 6

**Objetivo:** permitir encontrar productos, consultar detalles y solicitar una reserva válida.

Historias candidatas: HU-09, HU-10 y HU-11 (21 puntos).

## Sprint 4 — semanas 7 y 8

**Objetivo:** cerrar el flujo de gestión y elevar el incremento a calidad de entrega.

Historias candidatas: HU-12, HU-13, HU-14 y HU-15 (26 puntos). HU-14 puede reducirse o volver al backlog si la capacidad obliga a priorizar el flujo de reserva y la calidad.

## Semana 9 — cierre académico

No se planifica como Sprint de funcionalidades. Se reserva para pruebas integrales finales, corrección de defectos críticos, memoria/documentación, preparación de presentación, ensayo de demostración, respaldo de evidencias y cierre del proyecto.

## Sprint Planning — plantilla

- Fecha, Sprint y participantes.
- Objetivo del Sprint en una frase.
- Disponibilidad de cada integrante y capacidad acordada.
- Historias seleccionadas y motivo de prioridad.
- Revisión de Definition of Ready y dependencias.
- Descomposición en tareas técnicas y responsables iniciales.
- Riesgos y plan de mitigación.
- Línea base del Burndown Chart.

El plan se guarda como `docs/scrum/records/sprint-N-planning.md`.

## Sprint Review — plantilla

- Fecha, participantes y objetivo evaluado.
- Historias terminadas, demostradas y aceptadas.
- Historias incompletas, sin asignar puntos parciales; vuelven al backlog.
- Evidencia de criterios de aceptación y comentarios recibidos.
- Cambios de contexto, prioridades o alcance.
- Backlog actualizado y siguiente objetivo tentativo.

El acta se guarda como `docs/scrum/records/sprint-N-review.md`.

## Sprint Retrospective — plantilla

- Qué funcionó bien.
- Qué dificultó el trabajo.
- Qué aprendimos.
- Una o dos acciones de mejora, cada una con responsable y fecha de revisión.
- Seguimiento de acciones de la retrospectiva anterior.

El acta se guarda como `docs/scrum/records/sprint-N-retrospective.md`. La retrospectiva analiza el proceso y evita convertir la sesión en evaluación personal.

## Rutina por Sprint

| Momento | Actividad | Duración orientativa |
|---|---|---:|
| Día 1 | Sprint Planning | 60–90 min |
| Cada día de trabajo | Daily Scrum | 10–15 min |
| Durante el Sprint | Refinamiento del próximo backlog | 30–45 min |
| Último día | Sprint Review | 45–60 min |
| Después de la Review | Sprint Retrospective | 30–45 min |

