const express = require("express");
const db = require("../../database");
const config = require("../config");
const validate = require("../middleware/validate");
const schemas = require("../schemas");
const { enviarMensagem, enviarTemplate, obterStatus, obterMessageId } = require("../services/whatsappProviderService");
const { processEvent } = require("../services/whatsappEventService");
const chat = require("../services/whatsappChatService");

const router = express.Router();

router.get("/conversas", async (req, res, next) => {
  try {
    res.json(await chat.listarConversas());
  } catch (error) { next(error); }
});

router.get("/conversas/:numero", validate(schemas.whatsappNumeroParams, "params"), async (req, res, next) => {
  try {
    const conversa = await chat.obterConversa(req.params.numero);
    if (!conversa) return res.status(404).json({ message: "Conversa não encontrada." });
    return res.json(conversa);
  } catch (error) { return next(error); }
});

router.post("/conversas/:numero/lidas", validate(schemas.whatsappNumeroParams, "params"), async (req, res, next) => {
  try {
    const marcadas = await chat.marcarLidas(req.params.numero);
    res.json({ message: "Conversa marcada como lida.", mensagens: marcadas });
  } catch (error) { next(error); }
});

router.get("/eventos", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, numero, texto, status, tentativas, ultimo_erro, criado_em, atualizado_em
       FROM whatsapp_eventos ORDER BY criado_em DESC LIMIT 50`,
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.get("/status", async (req, res) => {
  return res.json({ ...(await obterStatus()), numero_autorizado: config.NUMERO_AUTORIZADO || null });
});

router.post("/enviar-template", validate(schemas.whatsappTemplateSend), async (req, res) => {
  const { numero, nome_template, idioma, parametros } = req.body;
  try {
    const providerResult = await enviarTemplate(numero, nome_template, idioma, parametros);
    await chat.registrar({
      numero,
      direcao: "saida",
      texto: `[Template: ${nome_template}]${parametros.length ? ` ${parametros.join(" · ")}` : ""}`,
      status: "enviada",
      messageId: obterMessageId(providerResult),
    });
    return res.json({ message: "Template enviado." });
  } catch (error) {
    if (/não configurada|exigem o provedor|desativada/i.test(error.message)) return res.status(400).json({ message: error.message });
    return res.status(502).json({ message: `Falha ao enviar template: ${error.message}` });
  }
});

router.post("/enviar", validate(schemas.whatsappSend), async (req, res) => {
  const { numero, texto } = req.body;
  try {
    const providerResult = await enviarMensagem(numero, texto);
    req.whatsappMessageId = obterMessageId(providerResult);
  } catch (error) {
    if (/não configurada/i.test(error.message)) return res.status(400).json({ message: error.message });
    return res.status(502).json({ message: `Falha ao enviar mensagem: ${error.message}` });
  }
  try {
    await chat.registrar({ numero, direcao: "saida", texto, status: "enviada", messageId: req.whatsappMessageId });
  } catch (error) {
    req.log?.error({ err: error }, "Falha ao registrar mensagem enviada");
  }
  return res.json({ message: "Mensagem enviada." });
});

router.post("/eventos/:id/reprocessar", validate(schemas.idParams, "params"), async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    try {
      await processEvent(id);
    } catch (error) {
      return res.status(502).json({ message: error.message || "Falha ao reprocessar o evento." });
    }
    const [rows] = await db.query("SELECT status FROM whatsapp_eventos WHERE id = ?", [id]);
    if (!rows[0]) return res.status(404).json({ message: "Evento não encontrado." });
    if (rows[0].status !== "concluido") {
      return res.status(409).json({ message: "Evento não pôde ser reprocessado: limite de tentativas atingido." });
    }
    return res.json({ message: "Evento reprocessado com sucesso." });
  } catch (error) { return next(error); }
});

module.exports = router;
