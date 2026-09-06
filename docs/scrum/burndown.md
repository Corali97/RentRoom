# Burndown Chart

El gráfico se actualiza por día de trabajo con puntos restantes, no con porcentaje subjetivo de avance. Una historia conserva todos sus puntos hasta cumplir la Definition of Done; las tareas pueden usarse como apoyo diario, pero no sustituyen la aceptación de la historia.

## Procedimiento

1. En Sprint Planning, registrar el total comprometido como `restante_real` del día 0.
2. Calcular la línea ideal desde el total hasta cero durante los diez días hábiles del Sprint.
3. Al cierre de cada día, restar solo puntos de historias terminadas.
4. Registrar bloqueos o cambios de alcance en `notas`.
5. Revisar la tendencia en la Daily Scrum y analizarla en Review/Retrospective.

Usar una copia de [burndown-template.csv](burndown-template.csv) por Sprint. En GitHub Projects también puede replicarse con campos de puntos y estado.

## Lectura del gráfico

- Real sobre ideal: posible atraso, historias demasiado grandes o bloqueos.
- Real bajo ideal: avance adelantado o estimación conservadora.
- Línea plana prolongada: falta de historias terminadas; conviene dividir trabajo o resolver bloqueos.
- Aumento: se incorporó alcance; debe quedar explícitamente acordado y documentado.

