export const meta = {
  name: 'maqueta-en-bucle',
  description: 'Orquestador + agentes de trabajo en bucle (construir, verificar, decidir) hasta cumplir la rúbrica de la maqueta o agotar las rondas',
  phases: [
    { title: 'Línea base', detail: 'QA y crítico miden el estado de partida' },
    { title: 'Planificar', detail: 'el orquestador reparte tareas concretas' },
    { title: 'Construir', detail: 'agentes de trabajo, uno tras otro (comparten archivos)' },
    { title: 'Verificar', detail: 'QA y crítico, en paralelo y solo lectura' },
    { title: 'Cierre', detail: 'el orquestador declara terminado o lista lo que falta' }
  ]
}

const MAX = (args && args.maxRounds) || 5
const MAX_TRIES = 3 // intentos por agente y ronda hasta cerrar todas sus tareas
const REPO = 'C:\\Proyectos\\Itinerante\\.claude\\worktrees\\modest-ritchie-a471dc'

const AGENTS = {
  'paleta-skeletons': { file: '02-paleta-skeletons.md', port: 8511 },
  'navegacion-desplegables': { file: '03-navegacion-desplegables.md', port: 8512 },
  'ux-movil-feed': { file: '04-ux-movil-feed.md', port: 8513 },
  'movimiento': { file: '05-movimiento.md', port: 8514 }
}
const ORDER = ['paleta-skeletons', 'navegacion-desplegables', 'ux-movil-feed', 'movimiento']

const COMMON = `<entorno>
Repositorio: ${REPO} (trabaja siempre aquí; es un git worktree). Windows con Git Bash y PowerShell. Todas las instrucciones del proyecto están en docs/agentes/.
</entorno>
<reglas_de_seguridad>
No hagas git commit, git push, git reset --hard, ni despliegues; no toques _archive/, worker/, src/, data/ ni design-system/; no uses secretos ni instales dependencias; no relajes pruebas ni umbrales para que pasen. Levanta tu vista previa solo en el puerto que se te indica (PORT=<puerto> node tools/preview-site.mjs) y detenla al terminar (solo el proceso de ese puerto). Elimina los archivos temporales que crees fuera de .tmp-audit/.
</reglas_de_seguridad>
<arranque>
Antes de actuar: (1) lee docs/agentes/00-contexto-compartido.md, docs/agentes/rubrica.json y tu spec completa; (2) lee .tmp-audit/agentes/ (tests.json, defects.json, progress.md) si existen; (3) ejecuta git status y git log -3 para saber en qué estado está el árbol. No afirmes nada sobre código que no hayas abierto.
</arranque>`

const WORKER_SCHEMA = {
  type: 'object',
  properties: {
    agente: { type: 'string' },
    hechas: { type: 'array', items: { type: 'object', properties: { id_defecto: { type: 'string' }, que_cambio: { type: 'string' }, antes: { type: 'string' }, despues: { type: 'string' } }, required: ['id_defecto', 'que_cambio'] } },
    no_resueltas: { type: 'array', items: { type: 'object', properties: { id_defecto: { type: 'string' }, por_que: { type: 'string' } }, required: ['id_defecto', 'por_que'] } },
    archivos: { type: 'array', items: { type: 'string' } },
    comandos_verificados: { type: 'array', items: { type: 'object', properties: { comando: { type: 'string' }, resultado: { type: 'string' } }, required: ['comando', 'resultado'] } },
    autoevaluacion: { type: 'object', properties: { todas_cerradas: { type: 'boolean' }, checklist: { type: 'array', items: { type: 'object', properties: { punto: { type: 'string' }, cumple: { type: 'boolean' }, evidencia: { type: 'string' } }, required: ['punto', 'cumple', 'evidencia'] } } }, required: ['todas_cerradas', 'checklist'] },
    notas_para_humano: { type: 'array', items: { type: 'string' } },
    riesgos: { type: 'array', items: { type: 'string' } }
  },
  required: ['agente', 'hechas', 'no_resueltas', 'archivos', 'comandos_verificados', 'autoevaluacion']
}

const DEFECT = { type: 'object', properties: { id: { type: 'string' }, severidad: { type: 'string', enum: ['alta', 'media', 'baja'] }, criterio: { type: 'string' }, resumen: { type: 'string' }, evidencia: { type: 'string' }, dueño_probable: { type: 'string' } }, required: ['id', 'severidad', 'resumen', 'evidencia'] }
const QA_SCHEMA = { type: 'object', properties: { criterios: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, estado: { type: 'string', enum: ['passing', 'failing'] }, evidencia: { type: 'string' } }, required: ['id', 'estado', 'evidencia'] } }, defectos: { type: 'array', items: DEFECT }, herramientas_con_fallo_de_entorno: { type: 'array', items: { type: 'string' } }, cobertura_no_automatizada: { type: 'array', items: { type: 'string' } } }, required: ['criterios', 'defectos'] }
const CRITIC_SCHEMA = { type: 'object', properties: { puntajes: { type: 'object', additionalProperties: { type: 'object', properties: { puntaje: { type: 'number' }, evidencia: { type: 'string' } }, required: ['puntaje', 'evidencia'] } }, leyes: { type: 'array', items: { type: 'object', properties: { ley: { type: 'string' }, estado: { type: 'string' }, por_que: { type: 'string' } }, required: ['ley', 'estado'] } }, defectos: { type: 'array', items: DEFECT }, lo_que_funciona: { type: 'array', items: { type: 'string' } } }, required: ['puntajes', 'defectos'] }
const PLAN_SCHEMA = { type: 'object', properties: { terminado: { type: 'boolean' }, motivo: { type: 'string' }, ronda: { type: 'number' }, asignaciones: { type: 'array', items: { type: 'object', properties: { agente: { type: 'string', enum: ORDER }, tareas: { type: 'array', items: { type: 'object', properties: { id_defecto: { type: 'string' }, criterio: { type: 'string' }, que_hacer: { type: 'string' }, como_medir: { type: 'string' } }, required: ['id_defecto', 'que_hacer', 'como_medir'] } } }, required: ['agente', 'tareas'] } }, defectos_bloqueados: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, por_que: { type: 'string' } }, required: ['id', 'por_que'] } }, puntajes: { type: 'object', additionalProperties: { type: 'number' } }, notas: { type: 'string' }, notas_para_humano: { type: 'array', items: { type: 'string' } } }, required: ['terminado', 'motivo', 'asignaciones'] }

const verifyQA = (round) => agent(`${COMMON}
<rol>Eres el agente "qa". Tu spec: docs/agentes/06-qa.md (léela entera y síguela). Puerto de vista previa: 8521. Ronda: ${round}.</rol>
<tarea>Mide el estado actual del sitio con el arnés de tools/qa/ (incluye npm run test:browser) y las pruebas del repositorio, decide el estado de cada criterio de la rúbrica con evidencia, y reporta los defectos por causa raíz. Guarda el informe completo en .tmp-audit/agentes/ronda-${round}/qa.json y devuelve el mismo contenido como respuesta estructurada.</tarea>`,
  { label: `qa:ronda${round}`, phase: 'Verificar', schema: QA_SCHEMA })

const verifyCritic = (round) => agent(`${COMMON}
<rol>Eres el agente "critico". Tu spec: docs/agentes/07-critico-diseno.md (léela entera y síguela). Puerto de vista previa: 8522. Ronda: ${round}.</rol>
<tarea>Captura el sitio en móvil (390×844 y 360×740) y escritorio (1280×800), mira las imágenes de verdad, puntúa cada dimensión, aplica las leyes de UX y lista los defectos concretos. Guarda capturas y el informe completo en .tmp-audit/agentes/ronda-${round}/ (critico.json) y devuelve el mismo contenido como respuesta estructurada.</tarea>`,
  { label: `critico:ronda${round}`, phase: 'Verificar', schema: CRITIC_SCHEMA })

const clip = (o, n = 45000) => JSON.stringify(o).slice(0, n)

// --- Línea base ---
phase('Línea base')
let [qa, critic] = await parallel([() => verifyQA(0), () => verifyCritic(0)])
log(`línea base: ${(qa?.defectos || []).length} defectos de QA, ${(critic?.defectos || []).length} del crítico`)

const history = []
let plan = null
for (let round = 1; round <= MAX + 1; round++) {
  phase('Planificar')
  plan = await agent(`${COMMON}
<rol>Eres el agente "orquestador". Tu spec: docs/agentes/01-orquestador.md (léela entera y síguela). Puerto: 8500. Ronda: ${round} de un máximo de ${MAX}.</rol>
<informe_qa>${clip(qa)}</informe_qa>
<informe_critico>${clip(critic)}</informe_critico>
<historial_de_rondas>${clip(history, 20000)}</historial_de_rondas>
<instruccion_de_cierre>${round > MAX ? 'Este es el cierre: ya no habrá más rondas de trabajo. Decide terminado solo si se cumplen todas las condiciones; si no, devuelve terminado=false con asignaciones vacías y la lista exacta de lo que falta en notas y notas_para_humano.' : 'Si no se cumplen las condiciones de cierre, asigna tareas concretas y medibles (máximo 5 por agente).'}</instruccion_de_cierre>
Actualiza .tmp-audit/agentes/tests.json, defects.json y progress.md antes de responder. Responde con el plan estructurado.`,
    { label: `orquestador:ronda${round}`, phase: round > MAX ? 'Cierre' : 'Planificar', schema: PLAN_SCHEMA })

  if (!plan) { log('el orquestador no devolvió un plan; se detiene el bucle'); break }
  history.push({ ronda: round, terminado: plan.terminado, motivo: plan.motivo, notas: plan.notas, bloqueados: plan.defectos_bloqueados, puntajes: plan.puntajes })
  if (plan.terminado || round > MAX) break
  if (!plan.asignaciones || !plan.asignaciones.length) { log('plan sin asignaciones; se detiene el bucle'); break }

  // --- Construir: uno tras otro, en el orden fijo (comparten archivos) ---
  phase('Construir')
  const ordered = [...plan.asignaciones].sort((a, b) => ORDER.indexOf(a.agente) - ORDER.indexOf(b.agente))
  const roundResults = []
  const idOf = t => t.id_defecto || t.que_hacer
  for (const a of ordered) {
    const cfg = AGENTS[a.agente]
    if (!cfg) continue
    let pendientes = a.tareas
    const intentos = []
    for (let intento = 1; intento <= MAX_TRIES && pendientes.length; intento++) {
      const res = await agent(`${COMMON}
<rol>Eres el agente "${a.agente}". Tu spec: docs/agentes/${cfg.file} (léela entera y síguela). Puerto de vista previa: ${cfg.port}. Ronda: ${round}. Intento: ${intento} de ${MAX_TRIES}.</rol>
<round_task>${JSON.stringify(pendientes, null, 2)}</round_task>
<contexto_de_la_ronda>${plan.notas || ''}</contexto_de_la_ronda>
${intento > 1 ? `<intento_anterior>Tu intento anterior dejó tareas abiertas. Revisa por qué (no repitas el mismo enfoque): ${clip(intentos.at(-1)?.no_resueltas || [], 4000)}</intento_anterior>` : ''}
<cierre_obligatorio>
No respondas con trabajo a medias. Antes de responder, autoevalúate con esta lista y corrige lo que falle (y vuelve a medir) hasta que todo cumpla:
1. Cada tarea tiene su medición antes y después con la herramienta indicada en «como_medir», y el resultado cumple el criterio de la rúbrica.
2. npm test, npm run test:design, npm run tokens:check y npm run test:browser están en verde (si algo falla por tu cambio, arréglalo; si es un falso positivo documentado en el contexto compartido, dilo con evidencia).
3. No quedan archivos temporales, procesos ni puertos abiertos tuyos; git status solo muestra cambios que pertenecen a tus tareas.
4. DESIGN.md, AGENTS.md y los comentarios que describían lo que cambiaste reflejan lo nuevo.
5. Verificaste en navegador (capturas a 390 y 1280 px) todo cambio visible, y miraste las imágenes.
Si una tarea es realmente imposible o exige una decisión de Aldo, no la dejes en silencio: declárala en no_resueltas con lo intentado, la medición y qué decisión falta. Rellena «autoevaluacion» con cada punto y su evidencia; «todas_cerradas» solo es verdadero si cada tarea de esta lista quedó cerrada con medición.
</cierre_obligatorio>
Trabaja las tareas una por una hasta cerrarlas; actualiza .tmp-audit/agentes/defects.json y progress.md; devuelve el resultado estructurado.`,
        { label: `${a.agente}:ronda${round}.${intento}`, phase: 'Construir', schema: WORKER_SCHEMA })
      intentos.push(res || { no_resueltas: pendientes.map(t => ({ id_defecto: idOf(t), por_que: 'el agente no devolvió resultado' })), hechas: [], autoevaluacion: { todas_cerradas: false, checklist: [] } })
      const r = intentos.at(-1)
      const hechas = new Set((r.hechas || []).map(h => h.id_defecto))
      const abiertas = new Set((r.no_resueltas || []).map(h => h.id_defecto))
      pendientes = pendientes.filter(t => !hechas.has(idOf(t)) || abiertas.has(idOf(t))).filter(() => true)
      if (!pendientes.length && !(r.autoevaluacion && r.autoevaluacion.todas_cerradas)) pendientes = a.tareas.filter(t => abiertas.has(idOf(t))) // dice no estar cerrado: se revisa
      log(`${a.agente} ronda ${round} intento ${intento}: ${(r.hechas || []).length} hechas, ${pendientes.length} abiertas`)
    }
    roundResults.push({
      agente: a.agente,
      intentos: intentos.length,
      abandonadas: pendientes.map(t => ({ id_defecto: idOf(t), por_que: (intentos.at(-1)?.no_resueltas || []).find(x => x.id_defecto === idOf(t))?.por_que || 'sin cerrar tras los intentos permitidos' })),
      resultado: { hechas: intentos.flatMap(i => i.hechas || []), no_resueltas: intentos.at(-1)?.no_resueltas || [], riesgos: intentos.flatMap(i => i.riesgos || []) }
    })
  }
  history[history.length - 1].trabajo = roundResults.map(r => ({ agente: r.agente, intentos: r.intentos, hechas: (r.resultado?.hechas || []).length, abandonadas: r.abandonadas, riesgos: r.resultado?.riesgos || [] }))

  // --- Verificar: solo lectura, en paralelo ---
  phase('Verificar')
  ;[qa, critic] = await parallel([() => verifyQA(round), () => verifyCritic(round)])
  log(`ronda ${round}: ${(qa?.defectos || []).length} defectos de QA, ${(critic?.defectos || []).length} del crítico`)
}

return {
  terminado: !!(plan && plan.terminado),
  motivo: plan && plan.motivo,
  rondas: history.length,
  puntajes: plan && plan.puntajes,
  bloqueados: plan && plan.defectos_bloqueados,
  notas_para_humano: plan && plan.notas_para_humano,
  historial: history,
  ultimo_qa: { defectos: (qa?.defectos || []).length, criterios_fallando: (qa?.criterios || []).filter(c => c.estado !== 'passing').map(c => c.id) },
  ultimo_critico: { defectos: (critic?.defectos || []).length, puntajes: critic && critic.puntajes }
}
