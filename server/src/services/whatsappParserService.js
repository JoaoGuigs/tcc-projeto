const config = require("../config");

async function parseMensagem(mensagem) {
  let response;
  try {
    const headers = { "Content-Type": "application/json" };
    if (process.env.AI_SERVICE_KEY) headers["x-api-key"] = process.env.AI_SERVICE_KEY;
    response = await fetch(`${config.AI_SERVICE_URL}/parse/`, {
      method: "POST", headers,
      body: JSON.stringify({ mensagem }), signal: AbortSignal.timeout(8_000),
    });
  } catch (cause) { throw new Error("AI Service indisponível.", { cause }); }
  if (!response.ok) throw new Error(`AI Service retornou erro ${response.status}.`);
  const parsed = await response.json();
  if (!parsed || typeof parsed.intencao !== "string") {
    throw new Error("AI Service retornou resposta inválida.");
  }
  return parsed;
}

module.exports = { parseMensagem };
