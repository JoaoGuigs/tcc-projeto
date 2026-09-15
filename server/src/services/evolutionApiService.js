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

async function obterStatus() {
  const configurado = Boolean(config.EVOLUTION_API_KEY && config.EVOLUTION_INSTANCE);
  const status = {
    configurado,
    provedor: "evolution",
    provedor_nome: "Evolution API",
    identificador: config.EVOLUTION_INSTANCE || null,
    conexao: configurado ? "unknown" : "nao_configurado",
  };
  if (!configurado) return status;
  try {
    const response = await fetch(
      `${config.EVOLUTION_API_URL}/instance/connectionState/${encodeURIComponent(config.EVOLUTION_INSTANCE)}`,
      { headers: { apikey: config.EVOLUTION_API_KEY }, signal: AbortSignal.timeout(4_000) },
    );
    const data = await response.json().catch(() => ({}));
    return { ...status, conexao: data?.instance?.state || data?.state || (response.ok ? "unknown" : "indisponivel") };
  } catch {
    return { ...status, conexao: "indisponivel" };
  }
}

module.exports = { enviarMensagem, obterStatus };
