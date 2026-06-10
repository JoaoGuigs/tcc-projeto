// server/src/services/whatsappParserService.js
//
// Responsabilidade: delegar o parsing de linguagem natural ao microserviço Python
// (ai-service). Retorna um objeto estruturado com intencao, paciente, data e hora.

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * @typedef {Object} AgendamentoExtraido
 * @property {"agendar"|"cancelar"|"desconhecido"} intencao
 * @property {string|null} paciente
 * @property {string|null} data  - formato YYYY-MM-DD
 * @property {string|null} hora  - formato HH:MM
 */

/**
 * Envia o texto para o microserviço Python e retorna os dados extraídos pela IA.
 * @param {string} mensagem - Texto livre enviado pelo WhatsApp.
 * @returns {Promise<AgendamentoExtraido>}
 */
async function parseMensagem(mensagem) {
  const resposta = await fetch(`${AI_SERVICE_URL}/parse/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mensagem }),
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(`AI Service retornou erro ${resposta.status}: ${erro}`);
  }

  return resposta.json();
}

module.exports = { parseMensagem };
