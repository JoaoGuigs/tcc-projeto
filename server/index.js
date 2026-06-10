// Local: server/index.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();
const port = 3001;

// --- Middlewares Essenciais ---
app.use(cors());
app.use(express.json());

// --- Importação das Rotas ---

const usuariosRoutes = require("./src/routes/usuario.js");
const pacientesRoutes = require("./src/routes/paciente.js");
const conveniosRoutes = require("./src/routes/convenio.js");
const agendamentosRoutes = require("./src/routes/agendamentos.js");
const atendimentosRoutes = require("./src/routes/atendimentos.js");
const configuracoesRoutes = require("./src/routes/configuracoes.js");
const whatsappRoutes = require("./src/routes/whatsapp.js");

// --- Uso das Rotas ---
app.use("/usuarios", usuariosRoutes);
app.use("/pacientes", pacientesRoutes);
app.use("/convenios", conveniosRoutes);
app.use("/agendamentos", agendamentosRoutes);
app.use("/atendimentos", atendimentosRoutes);
app.use("/configuracoes", configuracoesRoutes);
app.use("/webhook", whatsappRoutes);
app.get("/", (req, res) => {
  res.send("API do PhysioClinic está funcionando!");
});

// --- Inicialização do Servidor ---
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
