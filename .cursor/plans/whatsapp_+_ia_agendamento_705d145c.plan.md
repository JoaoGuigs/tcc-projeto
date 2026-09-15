---
name: WhatsApp + IA Agendamento
overview: Adicionar um webhook no Express que recebe mensagens do WhatsApp via Evolution API, usa Groq (LLaMA) para extrair nome/data/hora em JSON, e salva o agendamento reutilizando os services que já existem.
todos:
  - id: install-groq
    content: Instalar dependencia groq-sdk no server/
    status: completed
  - id: create-env
    content: Criar server/.env com as variaveis GROQ_API_KEY, EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE, NUMERO_AUTORIZADO e adicionar dotenv ao server/index.js
    status: completed
  - id: parser-service
    content: Criar server/src/services/whatsappParserService.js com prompt + data atual e chamada ao Groq
    status: completed
  - id: controller
    content: Criar server/src/controllers/whatsappController.js orquestrando validacao, IA, busca de paciente e criacao de agendamento
    status: completed
  - id: route
    content: Criar server/src/routes/whatsapp.js e registrar em server/index.js
    status: completed
  - id: envio-confirmacao
    content: Implementar envio de mensagem de volta pelo WhatsApp via Evolution API no controller
    status: completed
  - id: todo-1781131545205-sgkejng33
    content: faça em python se possivel oq for da parte da IA ou algo que faça sentido usar .
    status: completed
  - id: todo-1781131601791-0uqsodufn
    content: fazer boa arquitetura de pastas e codigo
    status: completed
isProject: false
---

# Plano: Agendamento via WhatsApp + IA

## Fluxo geral

```mermaid
sequenceDiagram
    participant Celular as Celular da Dona Cris
    participant EvoAPI as Evolution API
    participant Webhook as POST /webhook/whatsapp
    participant Groq as Groq API (LLaMA)
    participant Services as Services existentes
    participant DB as MySQL

    Celular->>EvoAPI: "paciente rogerio segunda 14h"
    EvoAPI->>Webhook: POST com corpo JSON da mensagem
    Webhook->>Webhook: valida numero autorizado
    Webhook->>Groq: prompt com data atual + texto
    Groq-->>Webhook: JSON com paciente, data, hora
    Webhook->>Services: pacienteService.getAll("rogerio")
    Services-->>Webhook: [{ id: 5, nome: "Rogério Silva" }]
    Webhook->>Services: agendamentoService.create(...)
    Services->>DB: INSERT INTO agendamentos
    Webhook->>EvoAPI: envia confirmacao pelo WPP
    EvoAPI->>Celular: "Agendamento de Rogério salvo para segunda 15/06 às 14h"
```

## Arquivos novos (apenas no server/)

- `server/src/routes/whatsapp.js` — registra `POST /webhook/whatsapp`
- `server/src/controllers/whatsappController.js` — recebe e orquestra o fluxo
- `server/src/services/whatsappParserService.js` — chama Groq e retorna JSON estruturado

## Arquivo modificado

- [`server/index.js`](server/index.js) — adicionar o import e `app.use("/webhook", whatsappRoutes)`
- [`server/package.json`](server/package.json) — adicionar dependência `groq-sdk`

## Detalhes de cada parte

### 1. Dependência

```
npm install groq-sdk --prefix server
```

Groq é gratuito, suporta LLaMA 3.1 8B, e tem API compatível com OpenAI SDK.

### 2. `whatsappParserService.js`

Monta um prompt que inclui a data/hora atual do sistema (essencial para resolver "segunda-feira"). Envia para Groq e pede resposta em JSON com:
- `intencao`: `"agendar"` | `"cancelar"` | `"desconhecido"`
- `paciente`: string com o nome
- `data`: formato `YYYY-MM-DD`
- `hora`: formato `HH:MM`

Se qualquer campo estiver faltando, retorna `null` naquele campo.

### 3. `whatsappController.js`

Orquestra o fluxo:
1. Lê o número do remetente e valida contra `NUMERO_AUTORIZADO` (variável de ambiente)
2. Chama `whatsappParserService` com o texto
3. Chama `pacienteService.getAll(nome)` para buscar o paciente
4. Trata ambiguidade: se 0 ou 2+ resultados, responde pedindo correção
5. Monta `data_hora` como `YYYY-MM-DDTHH:MM:00`
6. Chama `agendamentoService.create(...)` com `profissional_id: 1` (mesmo padrão atual do frontend)
7. Chama a Evolution API para enviar a mensagem de resposta

### 4. Variáveis de ambiente

Será necessário criar um `.env` na pasta `server/` com:

```
GROQ_API_KEY=sua_chave_aqui
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua_chave_aqui
EVOLUTION_INSTANCE=nome_da_instancia
NUMERO_AUTORIZADO=5548999999999
```

O `server/index.js` precisará carregar `dotenv` para ler essas variáveis.

### 5. Casos de resposta no WhatsApp

| Situação | Mensagem enviada de volta |
|----------|--------------------------|
| Sucesso | "Agendamento de Rogério Silva salvo para segunda, 15/06 às 14h." |
| Paciente não encontrado | "Não encontrei nenhum paciente com o nome 'Rogerio'. Cadastre primeiro no sistema." |
| Mais de 1 paciente | "Encontrei mais de um paciente com esse nome. Seja mais específico." |
| Horário ocupado | "Este horário já está ocupado. Horários disponíveis: 13h, 15h, 16h." |
| Informação faltando | "Não entendi. Tente: *paciente Nome dia_da_semana hora*. Ex: paciente João segunda 14h" |
| Número não autorizado | (ignora silenciosamente) |

## Pré-requisito: Evolution API rodando

Antes de testar o webhook, é necessário:
1. Ter Docker instalado
2. Subir a Evolution API com `docker-compose`
3. Escanear o QR Code no WhatsApp da Dona Cris
4. Expor a porta 3001 com ngrok (`ngrok http 3001`) para que a Evolution API consiga chamar o webhook

Essa parte não é código — é configuração de infraestrutura, e posso documentar o passo a passo junto.
