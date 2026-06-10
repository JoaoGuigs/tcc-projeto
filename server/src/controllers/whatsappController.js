// server/src/controllers/whatsappController.js
//
// Responsabilidade: receber o webhook da Evolution API, validar o remetente,
// acionar o parser de IA e salvar/cancelar o agendamento no banco.

const { parseMensagem } = require("../services/whatsappParserService.js");
const { criarAgendamento, cancelarAgendamento } = require("../services/whatsappBookingService.js");
const { enviarMensagem } = require("../services/evolutionApiService.js");

const NUMERO_AUTORIZADO = process.env.NUMERO_AUTORIZADO || "";

/**
 * Extrai o número do remetente e o texto da mensagem do payload da Evolution API.
 * A estrutura pode variar conforme a versão da Evolution API.
 */
function extrairDadosMensagem(body) {
  // Estrutura padrão da Evolution API v2
  const data = body?.data || body;
  const numero = data?.key?.remoteJid?.replace("@s.whatsapp.net", "") || null;
  const texto = data?.message?.conversation || data?.message?.extendedTextMessage?.text || null;
  return { numero, texto };
}

/**
 * Handler principal do webhook.
 * Retorna 200 imediatamente (WhatsApp exige resposta rápida) e processa em background.
 */
async function receberMensagem(req, res) {
  // Responde imediatamente para não deixar a Evolution API em timeout
  res.status(200).json({ status: "received" });

  try {
    const { numero, texto } = extrairDadosMensagem(req.body);

    if (!numero || !texto) return;

    // Ignora mensagens de grupos (contêm @g.us) e do próprio bot
    if (req.body?.data?.key?.remoteJid?.includes("@g.us")) return;
    if (req.body?.data?.key?.fromMe === true) return;

    const numeroNormalizado = numero.replace(/\D/g, "");
    const autorizado = NUMERO_AUTORIZADO.replace(/\D/g, "");

    if (numeroNormalizado !== autorizado) {
      console.log(`[WhatsApp] Mensagem ignorada de número não autorizado: ${numeroNormalizado}`);
      return;
    }

    console.log(`[WhatsApp] Mensagem recebida: "${texto}"`);

    let mensagemResposta;

    try {
      const dadosExtraidos = await parseMensagem(texto);
      console.log("[WhatsApp] Dados extraídos pela IA:", dadosExtraidos);

      if (dadosExtraidos.intencao === "agendar") {
        const resultado = await criarAgendamento(dadosExtraidos);
        mensagemResposta = resultado.mensagemResposta;
      } else if (dadosExtraidos.intencao === "cancelar") {
        const resultado = await cancelarAgendamento(dadosExtraidos);
        mensagemResposta = resultado.mensagemResposta;
      } else {
        mensagemResposta =
          "Não entendi o comando. Use:\n" +
          "• *paciente Nome dia hora* para agendar\n" +
          "• *cancela Nome dia hora* para cancelar\n\n" +
          "Ex: paciente João segunda 14h";
      }
    } catch (erroProcessamento) {
      console.error("[WhatsApp] Erro ao processar mensagem:", erroProcessamento);

      if (erroProcessamento.message?.includes("AI Service")) {
        mensagemResposta = "⚠️ O serviço de IA está indisponível. Tente novamente em alguns instantes.";
      } else {
        mensagemResposta = "⚠️ Ocorreu um erro ao processar o agendamento. Verifique o sistema.";
      }
    }

    await enviarMensagem(numeroNormalizado, mensagemResposta);
  } catch (erro) {
    console.error("[WhatsApp] Erro inesperado no webhook:", erro);
  }
}

module.exports = { receberMensagem };
