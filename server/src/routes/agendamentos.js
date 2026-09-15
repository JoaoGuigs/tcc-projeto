// server/src/routes/agendamentos.js
const express = require("express");
const router = express.Router();
const validate = require("../middleware/validate");
const schemas = require("../schemas");

const {
  getAgendamentos,
  createAgendamento,
  getHorariosDisponiveis,
  cancelAgendamento,
} = require("../controllers/agendamentoController.js");

router.get("/", validate(schemas.appointmentQuery, "query"), getAgendamentos);
router.get("/horarios-disponiveis", validate(schemas.availableTimesQuery, "query"), getHorariosDisponiveis);
router.post("/", validate(schemas.appointment), createAgendamento);
router.delete("/:id", validate(schemas.idParams, "params"), cancelAgendamento);

module.exports = router;
