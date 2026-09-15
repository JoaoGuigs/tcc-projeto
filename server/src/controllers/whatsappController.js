const crypto = require("node:crypto");
const config = require("../config");
const { enqueue, processEvent } = require("../services/whatsappEventService");
const chat = require("../services/whatsappChatService");

function extractEvolutionMessage(body) {
  const data = body?.data || body;
  const remoteJid = data?.key?.remoteJid || "";
  const numero = remoteJid.replace("@s.whatsapp.net", "").replace(/\D/g, "");
  const texto = data?.message?.conversation || data?.message?.extendedTextMessage?.text || "";
  const rawId = data?.key?.id;
  const messageId = rawId || crypto.createHash("sha256").update(`${remoteJid}:${texto}`).digest("hex");
  return { numero, texto: texto.trim(), messageId, remoteJid, fromMe: data?.key?.fromMe === true };
}

function extractMetaMessages(body) {
  const messages = [];
  for (const entry of body?.entry || []) {
    for (const change of entry?.changes || []) {
      for (const message of change?.value?.messages || []) {
        const texto = message?.text?.body
          || message?.button?.text
          || message?.interactive?.button_reply?.title
          || message?.interactive?.list_reply?.title
          || "";
        const numero = String(message?.from || "").replace(/\D/g, "");
        if (numero && texto.trim()) {
          messages.push({
            numero,
            texto: texto.trim(),
            messageId: message.id || crypto.createHash("sha256").update(`${numero}:${texto}`).digest("hex"),
            remoteJid: numero,
            fromMe: false,
          });
        }
      }
    }
  }
  return messages;
}

function extractMetaStatuses(body) {
  const statuses = [];
  for (const entry of body?.entry || []) {
    for (const change of entry?.changes || []) {
      for (const status of change?.value?.statuses || []) {
        if (!status?.id || !status?.status) continue;
        statuses.push({
          messageId: status.id,
          status: status.status,
          erro: status.errors?.[0]?.title || status.errors?.[0]?.message || null,
        });
      }
    }
  }
  return statuses;
}

function isMetaWebhook(body) {
  return body?.object === "whatsapp_business_account";
}

function extractMessages(body) {
  return isMetaWebhook(body) ? extractMetaMessages(body) : [extractEvolutionMessage(body)];
}

const extractMessage = extractEvolutionMessage;

async function receberMensagem(req, res, next) {
  try {
    if (isMetaWebhook(req.body)) {
      await Promise.all(extractMetaStatuses(req.body).map(({ messageId, status, erro }) => (
        chat.atualizarStatusPorMessageId(messageId, status, erro)
      )));
    }
    const messages = extractMessages(req.body);
    const authorized = config.NUMERO_AUTORIZADO.replace(/\D/g, "");
    const accepted = messages.filter((message) => (
      message.numero
      && message.texto
      && !message.fromMe
      && !message.remoteJid.includes("@g.us")
      && (!authorized || message.numero === authorized)
    ));
    if (!accepted.length) return res.status(202).json({ status: "ignored" });
    const ids = (await Promise.all(accepted.map((message) => enqueue(message)))).filter(Boolean);
    res.status(202).json({ status: ids.length ? "queued" : "duplicate", queued: ids.length });
    for (const id of ids) {
      setImmediate(() => processEvent(id).catch((error) => req.log?.error({ err: error }, "Falha no evento WhatsApp")));
    }
  } catch (error) { next(error); }
}

module.exports = {
  receberMensagem,
  extractMessage,
  extractEvolutionMessage,
  extractMetaMessages,
  extractMetaStatuses,
  extractMessages,
  isMetaWebhook,
};
