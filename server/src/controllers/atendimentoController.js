// server/src/controllers/atendimentoController.js
const atendimentoService = require('../services/atendimentoService.js');

/**
 * Controller para buscar o histórico de atendimentos de um paciente.
 */
const getAtendimentosPorPaciente = async (req, res) => {
    try {
        // Pega o 'pacienteId' que vem na URL (ex: /atendimentos/paciente/456)
        const pacienteId = req.params.pacienteId;

        if (!pacienteId) {
             return res.status(400).json({ message: 'ID do paciente é obrigatório.' });
        }

        const atendimentos = await atendimentoService.getByPacienteId(pacienteId);

        res.status(200).json(atendimentos); // Retorna a lista de atendimentos encontrada

    } catch (error) {
        console.error("Erro no controller ao buscar atendimentos por paciente:", error);
        res.status(500).json({ message: "Erro interno ao buscar atendimentos." });
    }
};

/**
 * Controller para criar um novo atendimento (usaremos depois).
 */
const createAtendimento = async (req, res) => {
    try {
        const novoAtendimento = await atendimentoService.create(req.body);
        res.status(201).json({ message: 'Atendimento registrado com sucesso', id: novoAtendimento.id });
    } catch (error) {
        console.error("Erro no controller ao criar atendimento:", error);
        res.status(500).json({ error: error.message || 'Erro interno ao criar atendimento' });
    }
};

module.exports = {
    getAtendimentosPorPaciente,
    createAtendimento, // Já exportamos para o futuro
};