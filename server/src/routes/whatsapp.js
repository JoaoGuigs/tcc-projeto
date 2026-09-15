const crypto = require("node:crypto");
const express = require("express");
const config = require("../config");
const { receberMensagem, isMetaWebhook } = require("../controllers/whatsappController");

const router = express.Router();

function safeEqual(receivedValue, expectedValue) {
  const received = Buffer.from(receivedValue || "");
  const expected = Buffer.from(expectedValue || "");
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

function verifyEvolutionSecret(req, res, next) {
  if (!config.WEBHOOK_SECRET) return next();
  if (!safeEqual(req.get("x-webhook-secret"), config.WEBHOOK_SECRET)) {
    return res.status(401).json({ message: "Webhook não autorizado." });
  }
  return next();
}

function verifyMetaSignature(req, res, next) {
  if (!config.META_APP_SECRET) return next();
  if (!isValidMetaSignature(req.rawBody, req.get("x-hub-signature-256"), config.META_APP_SECRET)) {
    return res.status(401).json({ message: "Assinatura do webhook da Meta inválida." });
  }
  return next();
}

function isValidMetaSignature(rawBody, signature, appSecret) {
  if (!appSecret || !signature) return false;
  const expected = `sha256=${crypto.createHmac("sha256", appSecret).update(rawBody || Buffer.alloc(0)).digest("hex")}`;
  return safeEqual(signature, expected);
}

function verifyMetaChallenge(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && config.META_WEBHOOK_VERIFY_TOKEN && safeEqual(token, config.META_WEBHOOK_VERIFY_TOKEN)) {
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ message: "Falha ao verificar webhook da Meta." });
}

function activeProviderOnly(req, res, next) {
  const payloadProvider = isMetaWebhook(req.body) ? "meta" : "evolution";
  if (config.WHATSAPP_PROVIDER !== payloadProvider) return res.status(202).json({ status: "ignored" });
  return next();
}

router.get("/whatsapp", verifyMetaChallenge);
router.post("/whatsapp", activeProviderOnly, (req, res, next) => {
  if (isMetaWebhook(req.body)) return verifyMetaSignature(req, res, next);
  return verifyEvolutionSecret(req, res, next);
}, receberMensagem);

module.exports = router;
module.exports.safeEqual = safeEqual;
module.exports.isValidMetaSignature = isValidMetaSignature;
