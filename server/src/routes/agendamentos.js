// server/src/routes/agendamentos.js
const express = require("express");
const router = express.Router();

const {
  getAgendamentos,
  createAgendamento,
  getHorariosDisponiveis,
} = require("../controllers/agendamentoController.js");

router.get("/", getAgendamentos);
router.get("/horarios-disponiveis", getHorariosDisponiveis);
router.post("/", createAgendamento);

module.exports = router;
