const test = require("node:test");
const assert = require("node:assert/strict");
const schemas = require("../src/schemas");

test("normaliza email no login", () => {
  const result = schemas.login.parse({ email: "  DRA@EXEMPLO.COM ", senha: "12345678" });
  assert.equal(result.email, "dra@exemplo.com");
});

test("rejeita intervalo de agenda invertido", () => {
  const result = schemas.appointmentQuery.safeParse({ dataInicio: "2026-09-20", dataFim: "2026-09-10" });
  assert.equal(result.success, false);
});

test("rejeita atendimento vazio", () => {
  const result = schemas.attendance.safeParse({ agendamento_id: 1, evolucao_clinica: "", procedimentos_realizados: "" });
  assert.equal(result.success, false);
});

test("valida envio de template oficial do WhatsApp", () => {
  const result = schemas.whatsappTemplateSend.parse({
    numero: "5548999999999",
    nome_template: "lembrete_consulta",
    parametros: ["Maria", "16/09", "08:00"],
  });
  assert.equal(result.idioma, "pt_BR");
  assert.equal(result.parametros.length, 3);
  assert.equal(schemas.whatsappTemplateSend.safeParse({ ...result, nome_template: "Nome Inválido" }).success, false);
});
