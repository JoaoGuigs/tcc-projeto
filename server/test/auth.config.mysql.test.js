require("dotenv").config();

const { ensureTestDatabase } = require("./helpers/testDatabase");

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const mysql = require("mysql2/promise");

const config = require("../src/config");
const app = require("../app");

let available = false;

async function resetUsers() {
  const connection = await mysql.createConnection({
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    multipleStatements: true,
  });
  try {
    await connection.query(`
      SET FOREIGN_KEY_CHECKS = 0;
      DELETE FROM whatsapp_eventos;
      DELETE FROM atendimentos;
      DELETE FROM agendamentos;
      DELETE FROM pacientes;
      DELETE FROM profissionais;
      DELETE FROM usuarios;
      DELETE FROM configuracoes_clinica;
      DELETE FROM mensagens_padrao;
      SET FOREIGN_KEY_CHECKS = 1;
    `);
  } finally {
    await connection.end();
  }
}

test.before(async () => {
  try {
    await ensureTestDatabase(config);
    await resetUsers();
    available = true;
  } catch (error) {
    available = false;
    console.warn("Auth/config MySQL indisponível:", error.code || error.message);
  }
});

test("primeiro usuário, login, me, cookie, logout e bloqueio", async (t) => {
  if (!available) t.skip("MySQL de autenticação indisponível");

  const agent = request.agent(app);

  const blocked = await agent.get("/configuracoes/clinica");
  assert.equal(blocked.status, 401);

  const create = await agent.post("/usuarios/profissionais").send({
    nome: "Primeiro Profissional",
    email: "primeiro@example.com",
    senha: "senha-forte-123",
    registro_profissional: "CREFITO-AUTH-1",
    especialidade: "Fisioterapia",
  });
  assert.equal(create.status, 201);

  const secondCreate = await agent.post("/usuarios/profissionais").send({
    nome: "Segundo Profissional",
    email: "segundo@example.com",
    senha: "senha-forte-123",
    registro_profissional: "CREFITO-AUTH-2",
    especialidade: "Pilates",
  });
  assert.equal(secondCreate.status, 401);

  const login = await agent.post("/usuarios/login").send({
    email: "Primeiro@example.com",
    senha: "senha-forte-123",
  });
  assert.equal(login.status, 200);
  assert.match(login.headers["set-cookie"]?.join(";") || "", /session=/);
  assert.equal(login.body.user.email, "primeiro@example.com");

  const me = await agent.get("/usuarios/me");
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, "primeiro@example.com");

  const clinicGet = await agent.get("/configuracoes/clinica");
  assert.equal(clinicGet.status, 200);

  const clinicPut = await agent.put("/configuracoes/clinica").send({
    nome_clinica: "Clínica Teste",
    cnpj: "00.000.000/0001-00",
    telefone: "48999990000",
    email: "contato@clinica.test",
  });
  assert.equal(clinicPut.status, 200);

  const mensagem = await agent.post("/configuracoes/mensagens").send({
    titulo: "Lembrete",
    mensagem: "Olá, lembrete de consulta.",
  });
  assert.equal(mensagem.status, 201);

  const mensagens = await agent.get("/configuracoes/mensagens");
  assert.equal(mensagens.status, 200);
  assert.equal(mensagens.body.length, 1);

  const logout = await agent.post("/usuarios/logout");
  assert.equal(logout.status, 204);

  const afterLogout = await agent.get("/usuarios/me");
  assert.equal(afterLogout.status, 401);

  const blockedAgain = await agent.get("/pacientes");
  assert.equal(blockedAgain.status, 401);
});
