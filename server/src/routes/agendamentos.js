// server/src/routes/agendamentos.js
const express = require("express");
const router = express.Router();
const validate = require("../middleware/validate");
const schemas = require("../schemas");

const {
  getAgendamentos,
  createAgendamento,
  getHorariosDisponiveis,
  getHorariosDaAgenda,
  cancelAgendamento,
  updateAgendamento,
} = require("../controllers/agendamentoController.js");

router.get("/", validate(schemas.appointmentQuery, "query"), getAgendamentos);
router.get("/horarios-disponiveis", validate(schemas.availableTimesQuery, "query"), getHorariosDisponiveis);
router.get("/horarios-da-agenda", getHorariosDaAgenda);
router.post("/", validate(schemas.appointment), createAgendamento);
router.patch("/:id", validate(schemas.idParams, "params"), validate(schemas.appointmentUpdate), updateAgendamento);
router.delete("/:id", validate(schemas.idParams, "params"), cancelAgendamento);

module.exports = router;
