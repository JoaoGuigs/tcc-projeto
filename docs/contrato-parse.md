# Contrato `POST /parse/`

Microserviço: `ai-service` (FastAPI). Usado pelo `server` via `whatsappParserService.js`.

## Requisição

`POST /parse/` — `Content-Type: application/json`

```json
{ "mensagem": "paciente João segunda 14h" }
```

- `mensagem`: 1–500 caracteres (validado por `ParseRequest`).
- Header opcional `x-api-key`: exigido apenas se `AI_SERVICE_KEY` estiver configurado no `ai-service`. O `server` envia `AI_SERVICE_KEY` do seu `.env`.

## Resposta `200`

`AgendamentoExtraido`:

```json
{ "intencao": "agendar", "paciente": "João da Silva", "data": "2026-09-15", "hora": "14:00", "erro": null }
```

- `intencao`: `agendar | cancelar | desconhecido`
- `data`: `YYYY-MM-DD` ou `null`
- `hora`: `HH:MM` ou `null`
- `erro`: texto quando o fallback Groq falha (ex.: sem `GROQ_API_KEY`, timeout, resposta inválida). Nesses casos `intencao` volta `desconhecido` em vez de `500`.

## Erros

- `400`: `mensagem` vazia.
- `401`: `x-api-key` inválida (só quando `AI_SERVICE_KEY` configurado).
- `422`: `mensagem` > 500 caracteres.
- `429`: mais de 30 requisições/min por IP (`app/middleware/rate_limit.py`).

## Pipeline

1. `parse_local()` (regex, fuso `America/Sao_Paulo`, sem custo) — exige intenção + data + hora + nome.
2. Se `None`, fallback Groq (`GROQ_MODEL`, default `openai/gpt-oss-20b`, `temperature=0`, `max_tokens=150`, `json_schema` strict).

## Exemplos

```sh
curl -s http://localhost:8000/health
# {"status":"ok"}

curl -s http://localhost:8000/parse/ -H 'Content-Type: application/json' \
  -d '{"mensagem":"cancela Maria Souza segunda 09:30"}'
```

## Envs

| Var | Onde | Default | Notas |
|---|---|---|---|
| `GROQ_API_KEY` | ai-service | vazio | Sem ela, fallback retorna `desconhecido+erro`. |
| `GROQ_MODEL` | ai-service | `openai/gpt-oss-20b` |  |
| `AI_SERVICE_KEY` | ai + server | vazio | Auth interna `x-api-key`. Configure igual nos dois. |
| `AI_SERVICE_URL` | server | `http://localhost:8000` | No Compose: `http://ai:8000`. |
| `TZ` | compose | `America/Sao_Paulo` | Alinha logs e `ZoneInfo`. |
