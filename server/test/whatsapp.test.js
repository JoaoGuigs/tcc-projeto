const test = require("node:test");
const assert = require("node:assert/strict");
const { extractMessage } = require("../src/controllers/whatsappController");

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
