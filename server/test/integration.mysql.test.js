require("dotenv").config();

const { ensureTestDatabase } = require("./helpers/testDatabase");

const test = require("node:test");
const assert = require("node:assert/strict");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const config = require("../src/config");
const agendamentoService = require("../src/services/agendamentoService");
const atendimentoService = require("../src/services/atendimentoService");
const pacienteService = require("../src/services/pacienteService");
const usuarioService = require("../src/services/usuarioService");
const whatsappEventService = require("../src/services/whatsappEventService");
const waitlistService = require("../src/services/waitlistService");

let available = false;
let seed = null;

async function withAdmin(fn) {
  const connection = await mysql.createConnection({
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    multipleStatements: true,
  });
  try {
    return await fn(connection);
  } finally {
    await connection.end();
  }
}

function requireDb(t) {
  if (!available) t.skip("MySQL de integração indisponível");
}

test.before(async () => {
  try {
    await ensureTestDatabase(config);
    await withAdmin(async (connection) => {
      await connection.query("SELECT 1");
      await connection.query(`
        SET FOREIGN_KEY_CHECKS = 0;
        DELETE FROM whatsapp_eventos;
        DELETE FROM lista_espera;
        DELETE FROM atendimentos;
        DELETE FROM agendamentos;
        DELETE FROM pacientes;
        DELETE FROM profissionais;
        DELETE FROM usuarios;
        DELETE FROM convenios;
        SET FOREIGN_KEY_CHECKS = 1;
      `);
      const senhaHash = await bcrypt.hash("senha-forte-123", 12);
      const [user] = await connection.query(
        "INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)",
        ["Dr Teste", "dr.teste@example.com", senhaHash],
      );
      const [profissional] = await connection.query(
        "INSERT INTO profissionais (usuario_id, registro_profissional, especialidade) VALUES (?, ?, ?)",
        [user.insertId, "CREFITO-TEST-1", "Fisioterapia"],
      );
      const [pacienteA] = await connection.query(
        "INSERT INTO pacientes (nome_completo, celular) VALUES (?, ?)",
        ["Ana Silva", "48999990001"],
      );
      const [pacienteB] = await connection.query(
        "INSERT INTO pacientes (nome_completo, celular) VALUES (?, ?)",
        ["Bruno Souza", "48999990002"],
      );
      seed = {
        usuarioId: user.insertId,
        profissionalId: profissional.insertId,
        pacienteA: pacienteA.insertId,
        pacienteB: pacienteB.insertId,
      };
      available = true;
    });
  } catch (error) {
    available = false;
    console.warn("Integração MySQL indisponível:", error.code || error.message);
  }
});

test("dois agendamentos simultâneos no mesmo horário", async (t) => {
  requireDb(t);
  const slot = "2030-01-10 10:00:00";
  const results = await Promise.allSettled([
    agendamentoService.create({
      paciente_id: seed.pacienteA,
      profissional_id: seed.profissionalId,
      data_hora: slot,
      tipo_consulta: "Consulta",
    }),
    agendamentoService.create({
      paciente_id: seed.pacienteB,
      profissional_id: seed.profissionalId,
      data_hora: slot,
      tipo_consulta: "Consulta",
    }),
  ]);
  const fulfilled = results.filter((item) => item.status === "fulfilled");
  const rejected = results.filter((item) => item.status === "rejected");
  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0].reason.statusCode, 409);
});

test("cancelamento libera horário para novo agendamento", async (t) => {
  requireDb(t);
  const slot = "2030-01-11 11:00:00";
  const first = await agendamentoService.create({
    paciente_id: seed.pacienteA,
    profissional_id: seed.profissionalId,
    data_hora: slot,
    tipo_consulta: "Consulta",
  });
  await agendamentoService.cancel(first.id);
  const second = await agendamentoService.create({
    paciente_id: seed.pacienteB,
    profissional_id: seed.profissionalId,
    data_hora: slot,
    tipo_consulta: "Consulta",
  });
  assert.ok(second.id);
});

test("remarcação e atualização de status respeitam o profissional", async (t) => {
  requireDb(t);
  const created = await agendamentoService.create({
    paciente_id: seed.pacienteA,
    profissional_id: seed.profissionalId,
    data_hora: "2030-02-01 09:00:00",
    tipo_consulta: "Retorno",
  });
  await agendamentoService.update(created.id, seed.profissionalId, {
    data_hora: "2030-02-01 10:00:00",
    status: "Confirmado",
  });
  const rows = await agendamentoService.getByDateRange("2030-02-01", "2030-02-01", null, false, 100, seed.profissionalId);
  const updated = rows.find((item) => Number(item.id) === Number(created.id));
  assert.equal(updated.status, "Confirmado");
  assert.match(String(updated.data_hora), /10:00:00/);
  await assert.rejects(() => agendamentoService.update(created.id, seed.profissionalId + 999, { status: "Chegou" }), (error) => error.statusCode === 404);
});

test("lista de espera é isolada por profissional e atualiza o fluxo", async (t) => {
  requireDb(t);
  const created = await waitlistService.create(seed.profissionalId, {
    paciente_id: seed.pacienteB,
    data_preferida: "2030-02-02",
    periodo: "Tarde",
    observacoes: "Aceita encaixe",
  });
  assert.ok(created.id);
  let rows = await waitlistService.getAll(seed.profissionalId);
  assert.equal(rows.some((item) => Number(item.id) === Number(created.id)), true);
  await waitlistService.updateStatus(created.id, seed.profissionalId, "Agendado");
  rows = await waitlistService.getAll(seed.profissionalId);
  assert.equal(rows.find((item) => Number(item.id) === Number(created.id)).status, "Agendado");
});

test("criação atômica de prontuário", async (t) => {
  requireDb(t);
  const created = await agendamentoService.create({
    paciente_id: seed.pacienteA,
    profissional_id: seed.profissionalId,
    data_hora: "2030-01-12 09:00:00",
    tipo_consulta: "Avaliação",
  });
  const prontuario = await atendimentoService.create({
    agendamento_id: created.id,
    evolucao_clinica: "Paciente evoluiu bem.",
    procedimentos_realizados: null,
  });
  assert.ok(prontuario.id);
  await assert.rejects(
    () => atendimentoService.create({
      agendamento_id: created.id,
      evolucao_clinica: "Duplicado",
      procedimentos_realizados: null,
    }),
    (error) => error.statusCode === 409,
  );
  await withAdmin(async (connection) => {
    const [rows] = await connection.query("SELECT status FROM agendamentos WHERE id = ?", [created.id]);
    assert.equal(rows[0].status, "Concluído");
  });
});

test("celular e email duplicados", async (t) => {
  requireDb(t);
  await assert.rejects(
    () => pacienteService.create({ nome_completo: "Outra Pessoa", celular: "48999990001" }),
    (error) => error.statusCode === 409,
  );
  await assert.rejects(
    () => usuarioService.createProfissional({
      nome: "Outro Profissional",
      email: "dr.teste@example.com",
      senha: "senha-forte-123",
      registro_profissional: "CREFITO-TEST-2",
      especialidade: "Ortopedia",
    }),
    (error) => error.code === "ER_DUP_ENTRY",
  );
});

test("idempotência de mensagem WhatsApp", async (t) => {
  requireDb(t);
  const payload = { messageId: "msg-integration-1", numero: "5548999990000", texto: "paciente Ana amanhã 14h" };
  const first = await whatsappEventService.enqueue(payload);
  const second = await whatsappEventService.enqueue(payload);
  assert.ok(first);
  assert.equal(second, null);
  await withAdmin(async (connection) => {
    const [rows] = await connection.query("SELECT COUNT(*) AS total FROM whatsapp_eventos WHERE message_id = ?", [payload.messageId]);
    assert.equal(Number(rows[0].total), 1);
  });
});
