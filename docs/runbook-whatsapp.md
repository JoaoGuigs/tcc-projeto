# Runbook — Webhook WhatsApp Meta

## URL pública

- Local/dev: exponha a API com túnel HTTPS (ex.: ngrok/cloudflared) e aponte a Meta para `https://SEU-DOMINIO/webhook/whatsapp`.
- Painel Meta: `WhatsApp > Configuração > Webhook > Assinar campo messages`, `hub.verify_token` = `META_WEBHOOK_VERIFY_TOKEN`.

## Envs (`server/.env`)

- `WHATSAPP_PROVIDER=meta`
- `META_WHATSAPP_TOKEN`, `META_PHONE_NUMBER_ID`, `META_WABA_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`
- `WEBHOOK_SECRET` só vale para Evolution.
- `NUMERO_AUTORIZADO`: preenchido = só esse número é processado (testes). Vazio = todos os pacientes.
- `AI_SERVICE_KEY`: igual ao do `ai-service` se configurado.

## Fluxo

1. `GET /webhook/whatsapp` valida `hub.mode=subscribe` + token (comparação em tempo constante).
2. `POST /webhook/whatsapp` valida `X-Hub-Signature-256` (HMAC SHA-256 de `rawBody`), filtra `fromMe` e grupos `@g.us`, faz `enqueue` (`INSERT IGNORE` por `message_id`) e responde `202 queued/duplicate`.
3. `processEvent(id)` via `setImmediate` + `retryPending` a cada 10s (até 3 tentativas): `parseMensagem → criar/cancelarAgendamento → enviarMensagem → registrar saída`. Falhas ficam em `whatsapp_eventos(status=falhou, ultimo_erro)`.
4. Dedupe: `message.id` real da Meta. Sem id (Evolution sem id), fallback `sha256(numero:texto:minuto)` — dedupa retry imediato sem descartar repetição legítima posterior.
5. `POST /whatsapp/enviar-template` para fora da janela de 24h; texto livre só dentro da janela iniciada pelo paciente.

## Operação

- Fila: `SELECT * FROM whatsapp_eventos WHERE status IN ('pendente','falhou') ORDER BY criado_em LIMIT 10;`
- Reprocessar: `POST /whatsapp/eventos/:id/reprocessar` (autenticado + CSRF + rate-limit 30/min).
- Conversas paginadas: `GET /whatsapp/conversas?limite=50&offset=0` (máx. 200).
- Pacientes paginados: `GET /pacientes?limite=500&offset=0` (busca por `?nome=` retorna até 10).
- Rate-limits: `/webhook/` 60/min, `/whatsapp/enviar*` 30/min, `/usuarios/login` 20/15min, `/parse/` 30/min por IP.
- CSRF: mutações via cookie exigem `x-csrf-token` = cookie `csrf`. `Bearer` é isento.
- Logout revoga `jti` em `revoked_tokens` (migration `005_p1_hardening.sql`).
