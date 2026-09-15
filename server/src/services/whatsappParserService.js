const config = require("../config");

async function parseMensagem(mensagem) {
  let response;
  try {
    response = await fetch(`${config.AI_SERVICE_URL}/parse/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem }), signal: AbortSignal.timeout(8_000),
    });
  } catch (cause) { throw new Error("AI Service indisponível.", { cause }); }
  if (!response.ok) throw new Error(`AI Service retornou erro ${response.status}.`);
  return response.json();
}

module.exports = { parseMensagem };
