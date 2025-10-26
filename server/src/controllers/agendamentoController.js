// server/src/controllers/agendamentoController.js
const agendamentoService = require('../services/agendamentoService.js');

// Função para BUSCAR agendamentos
const getAgendamentos = async (req, res) => {
    try {
        // No futuro, podemos pegar dataInicio e dataFim de req.query
        const agendamentos = await agendamentoService.getByDateRange();
        res.status(200).json(agendamentos);
    } catch (error) {
        console.error("Erro no controller ao buscar agendamentos:", error);
        res.status(500).json({ error: 'Erro interno ao buscar agendamentos' });
    }
};

// Função para CRIAR um novo agendamento
const createAgendamento = async (req, res) => {
    try {
        // req.body contém os dados enviados pelo frontend
        // Ex: { paciente_id: 1, profissional_id: 1, data_hora: '...', tipo_consulta: '...' }
        const novoAgendamento = await agendamentoService.create(req.body);
        res.status(201).json({ message: 'Agendamento criado com sucesso', id: novoAgendamento.id });
    } catch (error) {
        console.error("Erro no controller ao criar agendamento:", error);
        // Retorna a mensagem de erro específica do service, se houver
        res.status(500).json({ error: error.message || 'Erro interno ao criar agendamento' });
    }
};

// Exporta as funções para serem usadas pelas rotas
module.exports = {
    getAgendamentos,
    createAgendamento,
};