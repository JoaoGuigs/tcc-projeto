const crypto = require("node:crypto");
const config = require("../config");
const { enqueue, processEvent } = require("../services/whatsappEventService");

function extractMessage(body) {
  const data = body?.data || body;
  const remoteJid = data?.key?.remoteJid || "";
  const numero = remoteJid.replace("@s.whatsapp.net", "").replace(/\D/g, "");
  const texto = data?.message?.conversation || data?.message?.extendedTextMessage?.text || "";
  const rawId = data?.key?.id;
  const messageId = rawId || crypto.createHash("sha256").update(`${remoteJid}:${texto}`).digest("hex");
  return { numero, texto: texto.trim(), messageId, remoteJid, fromMe: data?.key?.fromMe === true };
}

async function receberMensagem(req, res, next) {
  try {
    const message = extractMessage(req.body);
    if (!message.numero || !message.texto || message.fromMe || message.remoteJid.includes("@g.us")) {
      return res.status(202).json({ status: "ignored" });
    }
    const authorized = config.NUMERO_AUTORIZADO.replace(/\D/g, "");
    if (!authorized || message.numero !== authorized) return res.status(202).json({ status: "ignored" });
    const id = await enqueue(message);
    res.status(202).json({ status: id ? "queued" : "duplicate" });
    if (id) setImmediate(() => processEvent(id).catch((error) => req.log?.error({ err: error }, "Falha no evento WhatsApp")));
  } catch (error) { next(error); }
}

module.exports = { receberMensagem, extractMessage };
