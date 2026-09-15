// server/src/services/whatsappBookingService.js
//
// Responsabilidade: usar os dados extraídos pela IA para criar ou cancelar
// agendamentos, reutilizando os services existentes do projeto.

const pacienteService = require("./pacienteService.js");
const agendamentoService = require("./agendamentoService.js");

/**
 * @typedef {Object} ResultadoBooking
 * @property {boolean} sucesso
 * @property {string} mensagemResposta - Texto a ser enviado de volta no WhatsApp.
 */

/**
 * Cria um agendamento a partir dos dados extraídos pela IA.
 * @param {{ paciente: string|null, data: string|null, hora: string|null }} dados
 * @returns {Promise<ResultadoBooking>}
 */
async function criarAgendamento(dados) {
  const { paciente, data, hora } = dados;

  if (!paciente || !data || !hora) {
    return {
      sucesso: false,
      mensagemResposta:
        "Não entendi completamente. Tente: *paciente Nome dia_da_semana hora*.\nEx: paciente João segunda 14h",
    };
  }

  const pacientes = await pacienteService.getAll(paciente);

  if (pacientes.length === 0) {
    return {
      sucesso: false,
      mensagemResposta: `Não encontrei nenhum paciente com o nome "${paciente}". Cadastre-o primeiro no sistema.`,
    };
  }

  if (pacientes.length > 1) {
    const nomes = pacientes.map((p, i) => `${i + 1}) ${p.nome_completo}`).join("\n");
    return {
      sucesso: false,
      mensagemResposta: `Encontrei mais de um paciente com esse nome:\n${nomes}\n\nSeja mais específico no nome.`,
    };
  }

  const pacienteEncontrado = pacientes[0];
  const dataHoraISO = `${data}T${hora}:00`;

  try {
    await agendamentoService.create({
      paciente_id: pacienteEncontrado.id,
      profissional_id: 1,
      data_hora: dataHoraISO,
      tipo_consulta: "Consulta Padrão",
      observacoes: "Agendado via WhatsApp",
      status: "Agendado",
    });

    const [ano, mes, dia] = data.split("-");
    const dataFormatada = `${dia}/${mes}/${ano}`;

    return {
      sucesso: true,
      mensagemResposta: `✅ Agendamento salvo!\n*Paciente:* ${pacienteEncontrado.nome_completo}\n*Data:* ${dataFormatada}\n*Hora:* ${hora}`,
    };
  } catch (erro) {
    if (erro.message.includes("Horário já está ocupado")) {
      const horariosDisponiveis = await agendamentoService.getAvailableTimesByDate(data, 1);
      const horarios = horariosDisponiveis.slice(0, 5).join(", ");
      return {
        sucesso: false,
        mensagemResposta: `❌ Horário ${hora} já está ocupado.\nHorários disponíveis para essa data: ${horarios || "nenhum disponível"}.`,
      };
    }
    throw erro;
  }
}

/**
 * Cancela um agendamento a partir dos dados extraídos pela IA.
 * @param {{ paciente: string|null, data: string|null, hora: string|null }} dados
 * @returns {Promise<ResultadoBooking>}
 */
async function cancelarAgendamento(dados) {
  const { paciente, data, hora } = dados;

  if (!paciente || !data || !hora) {
    return {
      sucesso: false,
      mensagemResposta:
        "Para cancelar, informe: *cancela Nome dia_da_semana hora*.\nEx: cancela João segunda 14h",
    };
  }

  const pacientes = await pacienteService.getAll(paciente);

  if (pacientes.length === 0) {
    return {
      sucesso: false,
      mensagemResposta: `Não encontrei nenhum paciente com o nome "${paciente}".`,
    };
  }

  if (pacientes.length > 1) {
    return {
      sucesso: false,
      mensagemResposta: `Encontrei mais de um paciente com esse nome. Seja mais específico.`,
    };
  }

  const pacienteEncontrado = pacientes[0];
  const dataHoraISO = `${data}T${hora}:00`;

  const [agendamentos] = await require("../../database.js").query(
    `SELECT id FROM agendamentos
     WHERE paciente_id = ? AND data_hora = ? AND status != 'Cancelado'`,
    [pacienteEncontrado.id, dataHoraISO]
  );

  if (agendamentos.length === 0) {
    return {
      sucesso: false,
      mensagemResposta: `Não encontrei agendamento ativo para ${pacienteEncontrado.nome_completo} nesse horário.`,
    };
  }

  await agendamentoService.cancel(agendamentos[0].id);

  return {
    sucesso: true,
    mensagemResposta: `✅ Agendamento de ${pacienteEncontrado.nome_completo} cancelado com sucesso.`,
  };
}

module.exports = { criarAgendamento, cancelarAgendamento };
