// server/src/routes/whatsapp.js

const express = require("express");
const router = express.Router();

const { receberMensagem } = require("../controllers/whatsappController.js");

// A Evolution API envia um POST para este endpoint quando chega uma mensagem
router.post("/whatsapp", receberMensagem);

module.exports = router;
