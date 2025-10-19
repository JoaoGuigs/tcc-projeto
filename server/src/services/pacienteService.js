const db = require("../../database");

const create = async (pacienteData) => {
  const {
    nome_completo,
    celular,
    convenio_id,
    numero_carteirinha,
    descricao_problema,
  } = pacienteData;
  const sql =
    "INSERT INTO pacientes (nome_completo, celular, convenio_id, numero_carteirinha, descricao_problema) VALUES (?, ?, ?, ? ,?)";
  const [result] = await db.query(sql, [
    nome_completo,
    celular,
    convenio_id,
    numero_carteirinha,
    descricao_problema,
  ]);
  return { id: result.insertId };
};
const getAll = async () => {
  const [pacientes] = await db.query(
    "SELECT * FROM pacientes order by nome_completo"
  );
  return pacientes;
};

module.exports = {
    create, getAll
}