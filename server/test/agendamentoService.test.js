const test = require("node:test");
const assert = require("node:assert/strict");
const db = require("../database");
const service = require("../src/services/agendamentoService");

test("consulta por data preserva o índice da coluna", () => {
  const { sql, params } = service.buildAppointmentQuery("2026-09-01", "2026-09-30", 7, true, 50);
  assert.doesNotMatch(sql, /DATE\(ag\.data_hora\)/);
  assert.match(sql, /ag\.data_hora >= \?/);
  assert.match(sql, /ag\.data_hora < DATE_ADD\(\?, INTERVAL 1 DAY\)/);
  assert.match(sql, /at\.id IS NULL/);
  assert.deepEqual(params, [7, "2026-09-01 00:00:00", "2026-09-30 00:00:00", 50]);
});

test("converte colisão de índice em conflito de horário", async (t) => {
  const original = db.query;
  t.after(() => { db.query = original; });
  db.query = async () => { const error = new Error("duplicate"); error.code = "ER_DUP_ENTRY"; throw error; };
  await assert.rejects(
    service.create({ paciente_id: 1, profissional_id: 1, data_hora: "2026-09-20 10:00:00", tipo_consulta: "Consulta" }),
    (error) => error.statusCode === 409 && /ocupado/.test(error.message),
  );
});
