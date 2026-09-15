// server/src/routes/agendamentos.js
const express = require("express");
const router = express.Router();

const {
  getAgendamentos,
  createAgendamento,
  getHorariosDisponiveis,
  cancelAgendamento,
} = require("../controllers/agendamentoController.js");

router.get("/", getAgendamentos);
router.get("/horarios-disponiveis", getHorariosDisponiveis);
router.post("/", createAgendamento);
router.delete("/:id", cancelAgendamento);

module.exports = router;
