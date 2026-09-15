const config = require("../config");

function assertConfigured() {
  if (!config.META_WHATSAPP_TOKEN || !config.META_PHONE_NUMBER_ID) {
    throw new Error("WhatsApp Cloud API da Meta não configurada.");
  }
}

function endpoint(path = "messages") {
  return `https://graph.facebook.com/${config.META_GRAPH_API_VERSION}/${encodeURIComponent(config.META_PHONE_NUMBER_ID)}/${path}`;
}

async function request(url, options = {}) {
  assertConfigured();
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.META_WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    signal: AbortSignal.timeout(8_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Meta WhatsApp retornou erro: ${detail}`);
  }
  return data;
}

async function enviarMensagem(numero, texto) {
  return request(endpoint(), {
    method: "POST",
    body: JSON.stringify(buildTextPayload(numero, texto)),
  });
}

function buildTextPayload(numero, texto) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: String(numero).replace(/\D/g, ""),
    type: "text",
    text: { preview_url: false, body: texto },
  };
}

function buildTemplatePayload(numero, nomeTemplate, idioma = "pt_BR", parametros = []) {
  const template = { name: nomeTemplate, language: { code: idioma } };
  if (parametros.length) {
    template.components = [{
      type: "body",
      parameters: parametros.map((text) => ({ type: "text", text: String(text) })),
    }];
  }
  return {
    messaging_product: "whatsapp",
    to: String(numero).replace(/\D/g, ""),
    type: "template",
    template,
  };
}

async function enviarTemplate(numero, nomeTemplate, idioma = "pt_BR", parametros = []) {
  return request(endpoint(), {
    method: "POST",
    body: JSON.stringify(buildTemplatePayload(numero, nomeTemplate, idioma, parametros)),
  });
}

async function obterStatus() {
  const configurado = Boolean(config.META_WHATSAPP_TOKEN && config.META_PHONE_NUMBER_ID);
  const status = {
    configurado,
    provedor: "meta",
    provedor_nome: "Meta WhatsApp Cloud API",
    identificador: config.META_PHONE_NUMBER_ID || null,
    waba_id: config.META_WABA_ID || null,
    conexao: configurado ? "unknown" : "nao_configurado",
  };
  if (!configurado) return status;
  try {
    const data = await request(
      `https://graph.facebook.com/${config.META_GRAPH_API_VERSION}/${encodeURIComponent(config.META_PHONE_NUMBER_ID)}?fields=display_phone_number,verified_name`,
      { method: "GET" },
    );
    return { ...status, conexao: "open", numero: data.display_phone_number || null, nome_verificado: data.verified_name || null };
  } catch {
    return { ...status, conexao: "indisponivel" };
  }
}

module.exports = { enviarMensagem, enviarTemplate, obterStatus, buildTextPayload, buildTemplatePayload };
