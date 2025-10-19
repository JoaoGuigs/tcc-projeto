const pacienteService = require("../services/pacienteService");

const createPaciente = async (req, res) => {
  try {
    const { nome_completo } = req.body;
    if (!nome_completo) {
      return res.status(400).json({ Message: "O nome completo é obrigatorio" });
    }
    const novoPaciente = await pacienteService.create(req.body);
    res
      .status(201)
      .json({ message: "Paciente cadastrado", id: novoPaciente.id });
  } catch (err) {
    console.error("Erro no controoler ao cadastrar paciente", err);
    res.status(500).json({ message: "Erro interno ao cadastrar paciente" });
  }
};

const getAllPacientes = async (req, res) => {
  try {
    const allPacientes = await pacienteService.getAll();
    res.status(200).json(allPacientes);
  } catch (error) {
    console.error("erro no controller ao buscar todos Pacientes", error);
    res.status(500).json({ message: "Erro interno ao buscar pacientes" });
  }
};
module.exports = {
    createPaciente, getAllPacientes

}