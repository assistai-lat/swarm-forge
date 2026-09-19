# Starter Kit: 05-Data-AI-Pipeline (Malla de Datos e Inteligencia Artificial)

> **Ideal para:** Sistemas de extracción masiva de datos (scrapers), colas asíncronas de trabajo intensivo, agentes RAG, bases de datos vectoriales y procesamiento LLM.

---

## Estructura de Superficies

```text
mi-pipeline/
├── api-gateway/         # NestJS o FastAPI (Ingesta y consultas)
├── worker-queues/       # BullMQ, Celery o RabbitMQ (Workers de segundo plano)
└── ai-engine/           # Python (LangChain/LlamaIndex, embeddings, scraping)
```

## Configuración de Equipo Swarm

- **`worker_gateway`:** API de ingesta y endpoints de consulta. Write-Lock: `api-gateway/**`.
- **`worker_queues`:** Manejo de colas, reintentos y dead-letter queues. Write-Lock: `worker-queues/**`.
- **`worker_ai`:** Scripts de scraping, generación con LLMs y chunking de embeddings. Write-Lock: `ai-engine/**`.
- **`challenger_queue_resilience`:** Prueba la caída de Redis, jobs corruptos y límites de cuota de API LLM.
- **`challenger_prompt_eval`:** Evalúa regresiones en la calidad y precisión de los prompts del motor de IA.
