// server/src/routes/atendimentos.js
const express = require("express");
const router = express.Router();

const {
  getAtendimentosPorPaciente,
  createAtendimento,
} = require("../controllers/atendimentoController.js");

router.get("/paciente/:pacienteId", getAtendimentosPorPaciente);

router.post("/", createAtendimento);

module.exports = router;
