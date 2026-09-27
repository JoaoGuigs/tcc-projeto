// server/src/services/whatsappBookingService.js
//
// Responsabilidade: usar os dados extraídos pela IA para criar ou cancelar
// agendamentos, reutilizando os services existentes do projeto.

const pacienteService = require("./pacienteService.js");
const agendamentoService = require("./agendamentoService.js");
const config = require("../config.js");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function validarDadosAgendamento({ paciente, data, hora }) {
  if (!paciente || !data || !hora) return false;
  if (!DATE_RE.test(data) || !TIME_RE.test(hora)) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataObj = new Date(`${data}T00:00:00`);
  if (Number.isNaN(dataObj.getTime()) || dataObj < hoje) return false;
  if (!agendamentoService.getPossibleTimes().includes(hora)) return false;
  return true;
}

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

  if (!validarDadosAgendamento(dados)) {
    return {
      sucesso: false,
      mensagemResposta:
        "Não entendi completamente ou a data/hora é inválida. Tente: *paciente Nome dia_da_semana hora*.\nEx: paciente João segunda 14h",
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
      profissional_id: config.WHATSAPP_PROFESSIONAL_ID,
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
      const horariosDisponiveis = await agendamentoService.getAvailableTimesByDate(data, config.WHATSAPP_PROFESSIONAL_ID);
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

  if (!validarDadosAgendamento(dados)) {
    return {
      sucesso: false,
      mensagemResposta:
        "Para cancelar, informe: *cancela Nome dia_da_semana hora* com data/hora válidas.\nEx: cancela João segunda 14h",
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
     WHERE paciente_id = ? AND data_hora = ? AND profissional_id = ? AND status != 'Cancelado'`,
    [pacienteEncontrado.id, dataHoraISO, config.WHATSAPP_PROFESSIONAL_ID]
  );

  if (agendamentos.length === 0) {
    return {
      sucesso: false,
      mensagemResposta: `Não encontrei agendamento ativo para ${pacienteEncontrado.nome_completo} nesse horário.`,
    };
  }

  await agendamentoService.cancel(agendamentos[0].id, config.WHATSAPP_PROFESSIONAL_ID);

  return {
    sucesso: true,
    mensagemResposta: `✅ Agendamento de ${pacienteEncontrado.nome_completo} cancelado com sucesso.`,
  };
}

module.exports = { criarAgendamento, cancelarAgendamento };
