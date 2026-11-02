# Equipo de agentes para la maqueta

Sistema de agentes con un orquestador que reparte el trabajo, repite el ciclo «construir → verificar → decidir» y solo termina cuando la rúbrica está cumplida. Las instrucciones siguen la guía oficial de Anthropic («Prompting best practices», secciones de claridad, XML, agentes, estado, subagentes, exceso de ingeniería y verificación).

## Piezas

| Archivo | Rol |
|---|---|
| `00-contexto-compartido.md` | Proyecto, reglas de verdad, sistema de diseño, herramientas, hallazgos de partida, seguridad, protocolo de estado y estilo de trabajo. Lo leen todos. |
| `rubrica.json` | Criterios medibles de «buena maqueta» (P, S, M, D, U, V, R, T) con umbral, herramienta y dueño. |
| `01-orquestador.md` | Lee estado y defectos, asigna tareas concretas, detecta estancamiento y declara terminado. |
| `02-paleta-skeletons.md` | Color, superficies, portadas y estados de carga. |
| `03-navegacion-desplegables.md` | Menú, acordeones, Explorar, ficha, Mi lista: foco, atrás, bloqueo de scroll. |
| `04-ux-movil-feed.md` | Estructura, encabezado tipo perfil, Cartelera como publicaciones, Novedades, copy. |
| `05-movimiento.md` | Transiciones, animaciones y rendimiento. |
| `06-qa.md` | Verificador de solo lectura: corre el arnés y reporta defectos con evidencia. |
| `07-critico-diseno.md` | Crítico de solo lectura: capturas, puntajes por dimensión y leyes de UX. |
| `flujo-maqueta.workflow.js` | Guion del Workflow que ejecuta el bucle (referencia; se lanza con la herramienta Workflow). |

## Bucle

```
Ronda 0: QA + crítico (en paralelo) → orquestador planifica
Ronda n: agentes de trabajo UNO TRAS OTRO (comparten archivos) →
         QA + crítico (en paralelo, solo lectura) → orquestador decide
Fin: terminado (rúbrica completa, sin defectos altos o medios, crítico ≥ 4/5, npm test en verde)
     o límite de rondas con la lista exacta de lo que falta
```

- Orden de los agentes de trabajo: paleta-skeletons → navegacion-desplegables → ux-movil-feed → movimiento.
- Estado en `.tmp-audit/agentes/` (ignorado por git): `tests.json`, `defects.json`, `progress.md`.
- Un defecto que lleva 2 intentos cambia de enfoque; con 3 queda `bloqueado` para decisión humana.

## Reglas

- Los agentes **no hacen commit, push ni despliegue**. Los commits los hace la persona.
- No se tocan `_archive/`, `worker/`, `src/`, `data/` ni `design-system/`.
- Las pruebas y los umbrales no se relajan para que pasen.
- Puertos de vista previa: orquestador 8500, paleta 8511, desplegables 8512, ux 8513, movimiento 8514, QA 8521, crítico 8522.
