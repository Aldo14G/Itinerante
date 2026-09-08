# Auditoría de patrones RAG para Iti IA

Fecha: 27 de agosto de 2026  
Fuente auditada: [`awesome-llm-apps`](https://github.com/Shubhamsaboo/awesome-llm-apps)  
Snapshot revisado: commit [`11a4bc330e4b0b1509577db4581c5cfbcf6ea6a0`](https://github.com/Shubhamsaboo/awesome-llm-apps/tree/11a4bc330e4b0b1509577db4581c5cfbcf6ea6a0)

## Decisión

No incorporar LangChain, LangGraph, Qdrant, Mem0 ni un segundo pipeline RAG. La arquitectura actual de Genkit y Data Connect ya cubre herramientas tipadas, recuperación híbrida y validación de resultados. Añadir otro framework duplicaría responsabilidades y haría más difícil diagnosticar fallos sin mejorar hoy la calidad del catálogo.

El patrón más útil es [`agentic_typed_rag_pydanticai`](https://github.com/Shubhamsaboo/awesome-llm-apps/tree/11a4bc330e4b0b1509577db4581c5cfbcf6ea6a0/rag_tutorials/agentic_typed_rag_pydanticai). Se adopta como referencia conceptual, no como dependencia ni como código copiado.

## Matriz de selección

| Referencia | Valor para Iti IA | Decisión |
| --- | --- | --- |
| [`agentic_typed_rag_pydanticai`](https://github.com/Shubhamsaboo/awesome-llm-apps/tree/11a4bc330e4b0b1509577db4581c5cfbcf6ea6a0/rag_tutorials/agentic_typed_rag_pydanticai) | Herramienta de recuperación tipada, preflight determinista, evidencia verificable y rechazo cuando no hay sustento | Adoptar sus principios dentro de Genkit |
| [`rag_failure_diagnostics_clinic`](https://github.com/Shubhamsaboo/awesome-llm-apps/tree/11a4bc330e4b0b1509577db4581c5cfbcf6ea6a0/rag_tutorials/rag_failure_diagnostics_clinic) | Taxonomía práctica para separar fallos de recuperación, generación, configuración y proveedor | Adoptar como vocabulario operativo |
| [`hybrid_search_rag`](https://github.com/Shubhamsaboo/awesome-llm-apps/tree/11a4bc330e4b0b1509577db4581c5cfbcf6ea6a0/rag_tutorials/hybrid_search_rag) | Búsqueda híbrida y reranking | No integrar: exige Postgres/RAGLite, embeddings, Cohere y otro proveedor; Data Connect ya resuelve la recuperación actual |
| [`corrective_rag`](https://github.com/Shubhamsaboo/awesome-llm-apps/tree/11a4bc330e4b0b1509577db4581c5cfbcf6ea6a0/rag_tutorials/corrective_rag) | Reintento y búsqueda web correctiva | No integrar: LangGraph, Qdrant y búsqueda web debilitarían la regla de responder sólo con el catálogo autorizado |
| [`gemini_agentic_rag`](https://github.com/Shubhamsaboo/awesome-llm-apps/tree/11a4bc330e4b0b1509577db4581c5cfbcf6ea6a0/rag_tutorials/gemini_agentic_rag) | Reformulación de consulta | Conservar sólo la idea; su implementación añade Qdrant y búsqueda externa innecesarias |
| [`llm_app_personalized_memory`](https://github.com/Shubhamsaboo/awesome-llm-apps/tree/11a4bc330e4b0b1509577db4581c5cfbcf6ea6a0/advanced_llm_apps/llm_app_personalized_memory) | Memoria persistente por usuario | No integrar: no es necesaria para una consulta anónima y aumenta superficie de privacidad |

## Correspondencia con la implementación actual

- `searchCatalogTool` y `getBookDetailsTool` establecen contratos de entrada y salida tipados.
- El prompt exige recuperar antes de recomendar y rechazar resultados no sustentados.
- `validateItiIaMessages` verifica que título, autor, categoría, portada y metadatos provengan exactamente de los resultados recuperados.
- Las pruebas deterministas ejercitan la validación sin depender del proveedor.
- `data/iti-ia.eval.json` y `npm run rag:test` mantienen un conjunto fijo de consultas para detectar regresiones.
- La interfaz identifica explícitamente los registros de demostración y no los presenta como inventario o disponibilidad real.

Esto sigue las capacidades nativas de [tool calling de Genkit](https://genkit.dev/docs/tool-calling/) y deja abierta la evaluación formal con las [herramientas de evaluación de Genkit](https://genkit.dev/docs/evaluation/).

## Incidente observado y corrección aplicada

La búsqueda local no estaba fallando por falta de LangChain. Había dos causas concretas:

1. Un artefacto `.next` obsoleto apuntaba a un chunk inexistente y producía HTTP 500 al arrancar el backend.
2. El proveedor devolvía `503 UNAVAILABLE` por alta demanda para `gemini-3.7-flash`.
3. Después de las pruebas funcionales, Google confirmó un `429 RESOURCE_EXHAUSTED`: la clave está usando la cuota gratuita del modelo, con un límite diario de 20 solicitudes para `gemini-3.7-flash`. Los [créditos de Google Flow](https://support.google.com/flow/answer/16526234) pertenecen a Flow; la [cuota y facturación de Gemini API](https://ai.google.dev/gemini-api/docs/billing) se administran por separado en el proyecto de API.

Se reconstruyó el backend y se añadió un fallback acotado: Iti IA reintenta una vez el modelo primario y, únicamente ante indisponibilidad o límite temporal (`503` o `429`), usa `gemini-3.6-flash` con las mismas herramientas, reglas de grounding y validación. No se relaja ninguna comprobación de catálogo. Si la cuota completa del proyecto está agotada, la interfaz lo informa sin fabricar una respuesta.

## Siguientes mejoras, en orden

1. Incorporar a cada recomendación un fragmento exacto de evidencia y validarlo contra el resultado recuperado.
2. Ampliar `data/iti-ia.eval.json` con consultas sin resultado, ambiguas, de seguimiento y con proveedor temporalmente no disponible.
3. Medir precisión de recuperación, grounding y rechazo antes de considerar reranking u otra dependencia.
4. Conectar el catálogo real cuando sus datos y portadas estén autorizados. Hasta entonces, conservar la colección actual como fixture de prueba claramente rotulado.

## Criterio para reconsiderar LangChain o LangGraph

Sólo reevaluar otro orquestador si aparece un flujo multiagente persistente que Genkit no pueda expresar de forma mantenible y existe una prueba que demuestre la carencia. La cantidad de ejemplos disponibles en otro framework no constituye por sí sola una necesidad de arquitectura.
