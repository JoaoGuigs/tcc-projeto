const config = require("../config");

async function enviarMensagem(numero, texto) {
  if (!config.EVOLUTION_API_KEY || !config.EVOLUTION_INSTANCE) throw new Error("Evolution API não configurada.");
  const url = `${config.EVOLUTION_API_URL}/message/sendText/${encodeURIComponent(config.EVOLUTION_INSTANCE)}`;
  const response = await fetch(url, {
    method: "POST", headers: { "Content-Type": "application/json", apikey: config.EVOLUTION_API_KEY },
    body: JSON.stringify({ number: numero, text: texto }), signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Evolution API retornou erro ${response.status}.`);
  return response.json();
}

module.exports = { enviarMensagem };
