const pacienteService = require("../services/pacienteService");

const createPaciente = async (req, res) => {
  try {
    const { nome_completo, celular } = req.body;
    if (!nome_completo) {
      return res.status(400).json({ message: "O nome completo é obrigatório" });
    }
    // Requer nome completo (pelo menos 2 palavras)
    if (nome_completo.trim().length < 5 || !nome_completo.trim().includes(' ')) {
      return res.status(400).json({ message: "Informe o nome completo (nome e sobrenome)." });
    }
    if (!celular || String(celular).trim() === '') {
      return res.status(400).json({ message: "O celular é obrigatório." });
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
    const nomeQuery = req.query.nome; // 1. Pega o parâmetro 'nome' da URL (?nome=...)
    // Evitar buscas muito curtas: exige pelo menos 4 caracteres
    if (nomeQuery && nomeQuery.trim().length < 4) {
        return res.status(200).json([]);
    }
    const pacientes = await pacienteService.getAll(nomeQuery); // 2. Passa para o service
    res.status(200).json(pacientes);
  } catch (error) {
    console.error("erro no controller ao buscar todos Pacientes", error);
    res.status(500).json({ message: "Erro interno ao buscar pacientes" });
  }
};
const getPacienteById = async (req, res) => {
  try {
    // Pega o 'id' que vem na URL (ex: /pacientes/123)
    const pacienteId = req.params.id;

    const paciente = await pacienteService.getById(pacienteId);

    if (paciente) {
      res.status(200).json(paciente); // Retorna o paciente encontrado
    } else {
      res.status(404).json({ message: "Paciente não encontrado." }); // Retorna 404 se não achar
    }
  } catch (error) {
    console.error("Erro no controller ao buscar paciente por ID:", error);
    res.status(500).json({ message: "Erro interno ao buscar paciente." });
  }
};

module.exports = {
  createPaciente,
  getAllPacientes,
  getPacienteById,
};
