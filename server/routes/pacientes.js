const express = require("express");
const router = express.Router();
const db = require("../database.js"); // Usamos .. para "voltar" uma pasta

router.post("/", async (req, res) => {
  try {
    const {
      nome_completo,
      celular,
      profissao,
      convenio_medico,
      numero_carteirinha,
      descricao_problema,
    } = req.body;
    if (!nome_completo) {
      return res
        .status(400)
        .json({ message: "O nome completo é obrigatório." });
    }
    const sql =
      "INSERT INTO Paciente (nome_completo, celular, profissao, convenio_medico, numero_carteirinha, descricao_problema) VALUES (?, ?, ?, ?, ?, ?)";
    const [result] = await db.query(sql, [
      nome_completo,
      celular,
      profissao,
      convenio_medico,
      numero_carteirinha,
      descricao_problema,
    ]);

    res
      .status(201)
      .json({
        message: "Paciente cadastrado com sucesso",
        id: result.insertId,
      });
  } catch (error) {
    console.error("Erro ao cadastrar pacient:", error);
    res.status(500).json({ message: "Erro ao cadastrar paciente." });
  }
});

//Listando todos os pacientes
router.get("/", async (req, res) => {
  try {
    const [pacientes] = await db.query(
      "SELECT * FROM Paciente ORDER BY nome_completo"
    );
    console.log("Pacientes encontrados:", pacientes);
    res.status(200).json(pacientes);
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error);
    res.status(500).json({ message: "Erro interno ao buscar pacientes." });
  }
});

module.exports = router;
