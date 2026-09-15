import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { appointmentStatus, getDashboardSummary } from "./dashboard.js";

describe("dashboard", () => {
  const appointments = [
    { id: 1, status: "Agendado" },
    { id: 2, status: "Cancelado" },
    { id: 3, status: "Confirmado", atendimento_id: 10 },
  ];

  it("não contabiliza consultas canceladas", () => {
    assert.deepEqual(getDashboardSummary(appointments), {
      total: 2,
      completed: 1,
      confirmed: 1,
      pending: [{ id: 1, status: "Agendado" }],
    });
  });

  it("define o estado de uma consulta concluída", () => {
    assert.deepEqual(appointmentStatus({ status: "Agendado", atendimento_id: 5 }), { label: "Concluído", tone: "success" });
  });

  it("mantém consulta agendada como aguardando confirmação", () => {
    assert.deepEqual(appointmentStatus({ status: "Agendado" }), { label: "Agendado", tone: "warning" });
  });
});
