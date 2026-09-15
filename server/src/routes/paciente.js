// server/src/routes/pacientes.js
const express = require("express");
const router = express.Router();
const validate = require("../middleware/validate");
const schemas = require("../schemas");

const {
  createPaciente,
  getAllPacientes,
  getPacienteById,
} = require("../controllers/pacienteControllers");

router.post("/", validate(schemas.patient), createPaciente);

router.get("/", validate(schemas.patientQuery, "query"), getAllPacientes);

router.get("/:id", validate(schemas.idParams, "params"), getPacienteById);

module.exports = router;
