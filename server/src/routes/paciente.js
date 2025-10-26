// server/src/routes/pacientes.js
const express = require("express");
const router = express.Router();

const {
  createPaciente,
  getAllPacientes,
  getPacienteById,
} = require("../controllers/pacienteControllers");

router.post("/", createPaciente);

router.get("/", getAllPacientes);

router.get("/:id", getPacienteById);

module.exports = router;
