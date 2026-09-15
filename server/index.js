const app = require("./app");
const config = require("./src/config");
const { retryPending } = require("./src/services/whatsappEventService");

const server = app.listen(config.PORT, () => console.log(`Servidor rodando na porta ${config.PORT}`));
const retryTimer = setInterval(() => retryPending().catch(console.error), 10_000);
retryTimer.unref();

function shutdown(signal) {
  console.log(`${signal} recebido; encerrando servidor.`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
