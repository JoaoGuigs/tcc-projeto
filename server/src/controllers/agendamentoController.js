const agendamentoService = require("../services/agendamentoService");
const usuarioService = require("../services/usuarioService");

async function getProfessionalId(req) {
  const user = await usuarioService.getPublicUserById(req.user.sub);
  if (!user?.profissional_id) {
    const error = new Error("Usuário não está vinculado a um profissional.");
    error.statusCode = 403;
    throw error;
  }
  return user.profissional_id;
}

async function getAgendamentos(req, res) {
  try {
    const { pacienteId, dataInicio, dataFim, semAtendimento, limite } = req.query;
    const result = await agendamentoService.getByDateRange(dataInicio, dataFim, pacienteId,
      semAtendimento === "true" || semAtendimento === "1", limite, await getProfessionalId(req));
    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Erro interno ao buscar agendamentos." });
  }
}

async function createAgendamento(req, res) {
  try {
    const result = await agendamentoService.create({ ...req.body, profissional_id: await getProfessionalId(req) });
    res.status(201).json({ message: "Agendamento criado com sucesso.", id: result.id });
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Erro interno ao criar agendamento." });
  }
}

async function getHorariosDisponiveis(req, res) {
  try {
    const professionalId = await getProfessionalId(req);
    if (Number(req.query.profissional_id) !== Number(professionalId)) {
      return res.status(403).json({ message: "Profissional não autorizado." });
    }
    res.json(await agendamentoService.getAvailableTimesByDate(req.query.data, professionalId));
  } catch (error) {
    console.error("Erro ao buscar horários disponíveis:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Erro interno ao buscar horários disponíveis." });
  }
}

async function updateAgendamento(req, res) {
  try {
    res.json(await agendamentoService.update(req.params.id, await getProfessionalId(req), req.body));
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Erro interno ao atualizar agendamento." });
  }
}

async function cancelAgendamento(req, res) {
  try {
    res.json(await agendamentoService.cancel(req.params.id, await getProfessionalId(req)));
  } catch (error) {
    console.error("Erro ao cancelar agendamento:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Erro interno ao cancelar agendamento." });
  }
}

module.exports = { getAgendamentos, createAgendamento, getHorariosDisponiveis, updateAgendamento, cancelAgendamento };
