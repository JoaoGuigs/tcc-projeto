const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../app");

test("protege dados clínicos sem sessão", async () => {
  const response = await request(app).get("/pacientes");
  assert.equal(response.status, 401);
});

test("valida login antes de consultar o banco", async () => {
  const response = await request(app).post("/usuarios/login").send({ email: "invalido", senha: "123" });
  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Dados inválidos.");
});

test("responde 404 em rota desconhecida", async () => {
  const response = await request(app).get("/nao-existe");
  assert.equal(response.status, 404);
});
