// server/src/services/evolutionApiService.js
//
// Responsabilidade: enviar mensagens de volta ao WhatsApp via Evolution API.

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || "";

/**
 * Envia uma mensagem de texto para um número do WhatsApp via Evolution API.
 * @param {string} numero - Número do destinatário (somente dígitos, com DDI. Ex: 5548912345678)
 * @param {string} texto  - Mensagem a ser enviada.
 */
async function enviarMensagem(numero, texto) {
  const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`;

  const resposta = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_API_KEY,
    },
    body: JSON.stringify({
      number: numero,
      text: texto,
    }),
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    console.error(`[Evolution API] Erro ao enviar mensagem: ${resposta.status} - ${erro}`);
  }
}

module.exports = { enviarMensagem };
