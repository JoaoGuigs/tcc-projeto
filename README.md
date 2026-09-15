# PhysioClinic

Sistema de gestão para clínica de fisioterapia, com agenda, pacientes, prontuários e integração com WhatsApp.

## Componentes

- `client`: React 19, Vite, MUI e TanStack Query.
- `server`: Node.js 24, Express 5 e MySQL.
- `ai-service`: FastAPI com parser local e fallback pela Groq.

## Desenvolvimento local

Requisitos: Node.js 24 LTS, Python 3.13 e MySQL 8.4.

1. Copie `server/.env.example` para `server/.env` e `ai-service/.env.example` para `ai-service/.env`.
2. Instale JavaScript com `npm install` na raiz.
3. Suba o MySQL de desenvolvimento (porta host `3310`) ou aponte `DB_*` no `.env` para o seu servidor.
4. Crie o banco e execute `npm run db:migrate --workspace server`.
5. Inicie a API com `npm run dev:server` e o cliente com `npm run dev:client`.
6. No serviço de IA, instale `pip install -r requirements.txt` e execute `uvicorn app.main:app --reload` dentro de `ai-service`.

O primeiro cadastro de profissional é permitido quando a tabela `usuarios` está vazia. Depois disso, uma sessão autenticada é obrigatória.

## Docker

Configure os segredos em um arquivo `.env` na raiz e execute:

```sh
docker compose up --build
```

A aplicação fica disponível em `http://localhost:3000`. A API e o MySQL não precisam ser publicados para uso pelo frontend. O MySQL do Compose usa a porta host `3310` apenas para desenvolvimento/local.

## Verificação

```sh
npm run verify
```

Esse comando executa testes do servidor e cliente, verificação de tipos, lint e build. Para a IA:

```sh
cd ai-service
pytest
```

Os testes de integração MySQL do servidor rodam automaticamente quando o banco configurado em `server/.env` estiver acessível.

## Banco de dados

As migrations ficam em `server/migrations`. A restrição `uq_agendamentos_slot_ativo` impede duas consultas ativas para o mesmo profissional e horário. Antes de aplicar em um banco antigo, o migrador verifica duplicidades de email, celular, horários ativos, prontuários e `message_id` e aborta com detalhes se encontrar conflito.

## WhatsApp

O provedor padrão é a API oficial do WhatsApp da Meta. A Evolution API continua disponível como alternativa, selecionada por `WHATSAPP_PROVIDER=evolution`, mas não é usada quando o valor é `meta`.

Para configurar a Meta:

1. Crie o aplicativo no painel Meta for Developers e adicione o produto WhatsApp.
2. Preencha `META_WHATSAPP_TOKEN`, `META_PHONE_NUMBER_ID`, `META_WABA_ID` e `META_APP_SECRET` no `server/.env`.
3. Crie um valor secreto para `META_WEBHOOK_VERIFY_TOKEN`.
4. No painel da Meta, use a URL pública HTTPS `https://seu-dominio/webhook/whatsapp`, informe o mesmo token de verificação e assine o campo `messages`.
5. Defina `NUMERO_AUTORIZADO` durante os testes. Quando estiver pronto para atender pacientes, deixe-o vazio.

O webhook valida o desafio `GET` e a assinatura `X-Hub-Signature-256` das notificações `POST`. As mensagens são persistidas, deduplicadas e repetidas até três vezes em caso de falha. `POST /whatsapp/enviar-template` envia templates aprovados pela Meta com parâmetros de texto no corpo.

Mensagens de texto livres só podem ser enviadas dentro da janela de atendimento iniciada pelo paciente. Fora dela, use um template aprovado pela Meta, como confirmação ou lembrete de consulta.
