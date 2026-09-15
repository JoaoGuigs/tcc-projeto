const express = require("express");
const db = require("../../database");
const validate = require("../middleware/validate");
const schemas = require("../schemas");

const router = express.Router();

router.get("/clinica", async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT nome_clinica, cnpj, telefone, email FROM configuracoes_clinica LIMIT 1");
    res.json(rows[0] || { nome_clinica: "", cnpj: "", telefone: "", email: "" });
  } catch (error) { next(error); }
});

router.put("/clinica", validate(schemas.clinic), async (req, res, next) => {
  const { nome_clinica, cnpj, telefone, email } = req.body;
  try {
    await db.query(
      `INSERT INTO configuracoes_clinica (id, nome_clinica, cnpj, telefone, email)
       VALUES (1, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nome_clinica = VALUES(nome_clinica), cnpj = VALUES(cnpj),
       telefone = VALUES(telefone), email = VALUES(email)`,
      [nome_clinica, cnpj, telefone, email],
    );
    res.json({ message: "Configurações atualizadas com sucesso." });
  } catch (error) { next(error); }
});

router.get("/mensagens", async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT id, titulo, mensagem FROM mensagens_padrao ORDER BY titulo");
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/mensagens", validate(schemas.message), async (req, res, next) => {
  try {
    const [result] = await db.query("INSERT INTO mensagens_padrao (titulo, mensagem) VALUES (?, ?)", [req.body.titulo, req.body.mensagem]);
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) { next(error); }
});

router.put("/mensagens/:id", validate(schemas.idParams, "params"), validate(schemas.message), async (req, res, next) => {
  try {
    const [result] = await db.query("UPDATE mensagens_padrao SET titulo = ?, mensagem = ? WHERE id = ?", [req.body.titulo, req.body.mensagem, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Mensagem não encontrada." });
    return res.json({ id: req.params.id, ...req.body });
  } catch (error) { return next(error); }
});

router.delete("/mensagens/:id", validate(schemas.idParams, "params"), async (req, res, next) => {
  try {
    const [result] = await db.query("DELETE FROM mensagens_padrao WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Mensagem não encontrada." });
    return res.status(204).end();
  } catch (error) { return next(error); }
});

module.exports = router;
