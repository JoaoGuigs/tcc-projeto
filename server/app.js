require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { rateLimit } = require("express-rate-limit");
const pinoHttp = require("pino-http");
const config = require("./src/config");
const db = require("./database");
const { requireAuth } = require("./src/middleware/auth");

const app = express();
app.disable("x-powered-by");
app.use(pinoHttp({ redact: ["req.headers.authorization", "req.headers.cookie", "req.body.senha"] }));
app.use(helmet());
app.use(cors({ origin: config.CLIENT_ORIGIN.split(",").map((item) => item.trim()), credentials: true }));
app.use(express.json({ limit: "256kb" }));
app.use(cookieParser());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false });
app.use("/usuarios/login", authLimiter);

app.use("/usuarios", require("./src/routes/usuario"));
app.use("/webhook", require("./src/routes/whatsapp"));
app.use("/pacientes", requireAuth, require("./src/routes/paciente"));
app.use("/convenios", requireAuth, require("./src/routes/convenio"));
app.use("/agendamentos", requireAuth, require("./src/routes/agendamentos"));
app.use("/atendimentos", requireAuth, require("./src/routes/atendimentos"));
app.use("/configuracoes", requireAuth, require("./src/routes/configuracoes"));

app.get("/health", async (req, res, next) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", database: "ok" });
  } catch (error) { next(error); }
});

app.use((req, res) => res.status(404).json({ message: "Rota não encontrada." }));
app.use((error, req, res, _next) => {
  req.log?.error({ err: error }, "Erro não tratado");
  res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Erro interno do servidor." });
});

module.exports = app;
