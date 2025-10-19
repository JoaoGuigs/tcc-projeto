const db = require("../../database");

const getAll = async () => {
  // Adjust column name if your schema uses `ativo` instead of `ativos`
  const [convenios] = await db.query(
    "SELECT * FROM convenios WHERE ativo = TRUE"
  );
  return convenios;
};

const create = async (convenioData) => {
  const { nome_convenio } = convenioData;
  const [result] = await db.query(
    "INSERT INTO convenios (nome_convenio) VALUES (?)",
    [nome_convenio]
  );
  return { id: result.insertId, nome_convenio };
};

module.exports = {
  getAll,
  create,
};
