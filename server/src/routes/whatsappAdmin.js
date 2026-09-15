const express = require("express");
const db = require("../../database");
const config = require("../config");
const validate = require("../middleware/validate");
const schemas = require("../schemas");
const { enviarMensagem } = require("../services/evolutionApiService");
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
  const configurado = Boolean(config.EVOLUTION_API_KEY && config.EVOLUTION_INSTANCE);
  const status = {
    configurado,
    instancia: config.EVOLUTION_INSTANCE || null,
    numero_autorizado: config.NUMERO_AUTORIZADO || null,
    conexao: configurado ? "unknown" : "nao_configurado",
  };
  if (!configurado) return res.json(status);
  try {
    const response = await fetch(
      `${config.EVOLUTION_API_URL}/instance/connectionState/${encodeURIComponent(config.EVOLUTION_INSTANCE)}`,
      { headers: { apikey: config.EVOLUTION_API_KEY }, signal: AbortSignal.timeout(4_000) },
    );
    const data = await response.json().catch(() => ({}));
    status.conexao = data?.instance?.state || data?.state || (response.ok ? "unknown" : "indisponivel");
  } catch {
    status.conexao = "indisponivel";
  }
  return res.json(status);
});

router.post("/enviar", validate(schemas.whatsappSend), async (req, res) => {
  const { numero, texto } = req.body;
  try {
    await enviarMensagem(numero, texto);
  } catch (error) {
    if (/não configurada/i.test(error.message)) return res.status(400).json({ message: error.message });
    return res.status(502).json({ message: `Falha ao enviar mensagem: ${error.message}` });
  }
  try {
    await chat.registrar({ numero, direcao: "saida", texto, status: "enviada" });
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
