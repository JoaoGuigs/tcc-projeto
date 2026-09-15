const config = require("../config");
const evolution = require("./evolutionApiService");
const meta = require("./metaWhatsAppService");

function provider() {
  if (config.WHATSAPP_PROVIDER === "meta") return meta;
  if (config.WHATSAPP_PROVIDER === "evolution") return evolution;
  return null;
}

async function enviarMensagem(numero, texto) {
  const active = provider();
  if (!active) throw new Error("Integração com WhatsApp está desativada.");
  return active.enviarMensagem(numero, texto);
}

async function enviarTemplate(numero, nomeTemplate, idioma, parametros) {
  if (config.WHATSAPP_PROVIDER !== "meta") {
    throw new Error("Templates oficiais exigem o provedor Meta WhatsApp Cloud API.");
  }
  return meta.enviarTemplate(numero, nomeTemplate, idioma, parametros);
}

async function obterStatus() {
  const active = provider();
  if (!active) {
    return { configurado: false, provedor: "disabled", provedor_nome: "Desativado", identificador: null, conexao: "nao_configurado" };
  }
  return active.obterStatus();
}

function obterMessageId(result) {
  return result?.messages?.[0]?.id || result?.key?.id || null;
}

module.exports = { enviarMensagem, enviarTemplate, obterStatus, obterMessageId };
