// server/src/controllers/agendamentoController.js
const agendamentoService = require('../services/agendamentoService.js');

// Função para BUSCAR agendamentos
const getAgendamentos = async (req, res) => {
    try {
        const { pacienteId, dataInicio, dataFim, semAtendimento } = req.query;
        const onlyPending = semAtendimento === 'true' || semAtendimento === '1';
        
        // Validar data inicial se fornecida
        if (dataInicio && !dataInicio.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return res.status(400).json({ 
                error: 'Data inicial deve estar no formato YYYY-MM-DD' 
            });
        }

        // Validar data final se fornecida
        if (dataFim && !dataFim.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return res.status(400).json({ 
                error: 'Data final deve estar no formato YYYY-MM-DD' 
            });
        }

        const agendamentos = await agendamentoService.getByDateRange(
            dataInicio, 
            dataFim, 
            pacienteId,
            onlyPending
        );
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

// Função para buscar horários disponíveis
const getHorariosDisponiveis = async (req, res) => {
    try {
        const { data, profissional_id } = req.query;
        if (!data || !profissional_id) {
            return res.status(400).json({ error: 'Data e profissional_id são obrigatórios' });
        }

        const horariosDisponiveis = await agendamentoService.getAvailableTimesByDate(data, profissional_id);
        res.status(200).json(horariosDisponiveis);
    } catch (error) {
        console.error("Erro ao buscar horários disponíveis:", error);
        res.status(500).json({ error: 'Erro interno ao buscar horários disponíveis' });
    }
};

// Exporta as funções para serem usadas pelas rotas
module.exports = {
    getAgendamentos,
    createAgendamento,
    getHorariosDisponiveis
};