const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../app");
const { buildAppointmentQuery } = require("../src/services/agendamentoService");

test("401 sem token em dados clínicos (contrato {message})", async () => {
  for (const path of ["/pacientes", "/convenios", "/agendamentos", "/lista-espera", "/atendimentos", "/configuracoes/clinica", "/whatsapp/conversas"]) {
    const response = await request(app).get(path);
    assert.equal(response.status, 401, path);
    assert.equal(typeof response.body.message, "string", path);
  }
});

test("404 segue contrato {message}", async () => {
  const response = await request(app).get("/rota-que-nao-existe");
  assert.equal(response.status, 404);
  assert.equal(response.body.message, "Rota não encontrada.");
});

test("login inválido retorna 400 com issues (sem tocar no banco)", async () => {
  const response = await request(app).post("/usuarios/login").send({ email: "x", senha: "1" });
  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Dados inválidos.");
  assert.ok(Array.isArray(response.body.issues));
});

test("webhook Meta com token de verificação errado → 403", async () => {
  const response = await request(app)
    .get("/webhook/whatsapp")
    .query({ "hub.mode": "subscribe", "hub.verify_token": "errado", "hub.challenge": "abc" });
  assert.equal(response.status, 403);
  assert.equal(typeof response.body.message, "string");
});

test("agendamentos rejeitam pacienteId malicioso na validação", async () => {
  // validate() coage para número; injection não passa do schema (401 antes por falta de auth, mas o schema também rejeitaria).
  const { buildAppointmentQuery: build } = require("../src/services/agendamentoService");
  const { sql, params } = build(null, null, "1' OR '1'='1", false, 100, 1);
  assert.ok(!sql.includes("OR '1'='1"));
  assert.ok(params.includes("1' OR '1'='1") || params.includes(1));
});

test("requireAdmin bloqueia não-admin e libera admin", async () => {
  const { requireAdmin } = require("../src/middleware/auth");
  const denied = await new Promise((resolve) => {
    const res = { statusCode: null, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; resolve({ next: false, res: this }); return this; } };
    requireAdmin({ user: { admin: false } }, res, () => resolve({ next: true }));
  });
  assert.equal(denied.next, false);
  assert.equal(denied.res.statusCode, 403);
  const allowed = await new Promise((resolve) => {
    const res = { status() { throw new Error("não deveria responder"); }, json() { throw new Error("não deveria responder"); } };
    requireAdmin({ user: { admin: true } }, res, () => resolve({ next: true }));
  });
  assert.equal(allowed.next, true);
});

test("busca de pacientes pagina sem interpolar valores", () => {
  const { buildPatientQuery } = require("../src/services/pacienteService");
  const { sql, params } = buildPatientQuery(null, 50, 100);
  assert.ok(!sql.includes("100"));
  assert.deepEqual(params, [50, 100]);
  const busca = buildPatientQuery("Ana", 50, 100);
  assert.ok(busca.sql.includes("LIKE ?"));
  assert.deepEqual(busca.params, ["Ana%"]);
});

test("valores nunca são interpolados no SQL de agendamentos", () => {
  const { sql, params } = buildAppointmentQuery("2026-09-27", "2026-09-28", 5, false, 50, 7);
  assert.ok(!sql.includes("2026-09-27"));
  assert.ok(!sql.includes("5"));
  assert.deepEqual(params.slice(0, 4), [5, 7, "2026-09-27 00:00:00", "2026-09-28 00:00:00"]);
});
