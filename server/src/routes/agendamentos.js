// server/src/routes/agendamentos.js
const express = require("express");
const router = express.Router();

const {
  getAgendamentos,
  createAgendamento,
} = require("../controllers/agendamentoController.js");

router.get("/", getAgendamentos);

router.post("/", createAgendamento);

module.exports = router;
