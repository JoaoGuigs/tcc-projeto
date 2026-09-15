const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { extractMessage, extractMetaMessages, extractMetaStatuses } = require("../src/controllers/whatsappController");
const { buildTextPayload, buildTemplatePayload } = require("../src/services/metaWhatsAppService");
const whatsappRouter = require("../src/routes/whatsapp");

test("extrai mensagem da Evolution API", () => {
  const result = extractMessage({ data: { key: { id: "abc", remoteJid: "5548999999999@s.whatsapp.net" }, message: { conversation: " paciente Ana amanhã 14h " } } });
  assert.equal(result.messageId, "abc");
  assert.equal(result.numero, "5548999999999");
  assert.equal(result.texto, "paciente Ana amanhã 14h");
});

test("gera id estável quando o provedor omite id", () => {
  const body = { data: { key: { remoteJid: "5548999999999@s.whatsapp.net" }, message: { conversation: "teste" } } };
  assert.equal(extractMessage(body).messageId, extractMessage(body).messageId);
});

test("extrai mensagens de texto e botão do webhook oficial da Meta", () => {
  const result = extractMetaMessages({
    object: "whatsapp_business_account",
    entry: [{ changes: [{ value: { messages: [
      { id: "wamid.texto", from: "5548999999999", type: "text", text: { body: "Quero marcar amanhã" } },
      { id: "wamid.botao", from: "5548999999999", type: "interactive", interactive: { button_reply: { id: "confirmar", title: "Confirmar" } } },
    ] } }] }],
  });
  assert.deepEqual(result.map(({ messageId, numero, texto }) => ({ messageId, numero, texto })), [
    { messageId: "wamid.texto", numero: "5548999999999", texto: "Quero marcar amanhã" },
    { messageId: "wamid.botao", numero: "5548999999999", texto: "Confirmar" },
  ]);
});

test("extrai confirmação de entrega do webhook da Meta", () => {
  const result = extractMetaStatuses({
    entry: [{ changes: [{ value: { statuses: [{ id: "wamid.123", status: "delivered" }] } }] }],
  });
  assert.deepEqual(result, [{ messageId: "wamid.123", status: "delivered", erro: null }]);
});

test("monta payloads aceitos pela WhatsApp Cloud API", () => {
  assert.deepEqual(buildTextPayload("+55 (48) 99999-9999", "Olá"), {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: "5548999999999",
    type: "text",
    text: { preview_url: false, body: "Olá" },
  });
  const payload = buildTemplatePayload("5548999999999", "lembrete_consulta", "pt_BR", ["Maria", "16/09", "08:00"]);
  assert.equal(payload.template.name, "lembrete_consulta");
  assert.deepEqual(payload.template.components[0].parameters, [
    { type: "text", text: "Maria" },
    { type: "text", text: "16/09" },
    { type: "text", text: "08:00" },
  ]);
});

test("valida assinatura HMAC do webhook da Meta", () => {
  const rawBody = Buffer.from('{"object":"whatsapp_business_account"}');
  const secret = "app-secret-test";
  const signature = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  assert.equal(whatsappRouter.isValidMetaSignature(rawBody, signature, secret), true);
  assert.equal(whatsappRouter.isValidMetaSignature(rawBody, "sha256=incorreta", secret), false);
});
