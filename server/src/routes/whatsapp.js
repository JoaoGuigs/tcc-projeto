const crypto = require("node:crypto");
const express = require("express");
const config = require("../config");
const { receberMensagem } = require("../controllers/whatsappController");

const router = express.Router();

function verifySecret(req, res, next) {
  if (!config.WEBHOOK_SECRET) return next();
  const received = Buffer.from(req.get("x-webhook-secret") || "");
  const expected = Buffer.from(config.WEBHOOK_SECRET);
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return res.status(401).json({ message: "Webhook não autorizado." });
  }
  return next();
}

router.post("/whatsapp", verifySecret, receberMensagem);
module.exports = router;
