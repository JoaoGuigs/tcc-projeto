// server/src/routes/atendimentos.js
const express = require("express");
const router = express.Router();
const validate = require("../middleware/validate");
const schemas = require("../schemas");

const {
  getAtendimentosPorPaciente,
  createAtendimento,
} = require("../controllers/atendimentoController.js");

router.get("/paciente/:pacienteId", validate(schemas.patientIdParams, "params"), getAtendimentosPorPaciente);

router.post("/", validate(schemas.attendance), createAtendimento);

module.exports = router;
