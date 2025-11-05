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

const deleteById = async (id) => {
  // Primeiro verifica se o convênio está sendo usado por algum paciente
  const [pacientes] = await db.query(
    "SELECT COUNT(*) as total FROM pacientes WHERE convenio_id = ?",
    [id]
  );
  
  if (pacientes[0].total > 0) {
    throw new Error(`Este convênio está sendo usado por ${pacientes[0].total} paciente(s) e não pode ser deletado. Primeiro remova ou altere o convênio destes pacientes.`);
  }
  
  // Se não está sendo usado, pode deletar
  const [result] = await db.query(
    "DELETE FROM convenios WHERE id = ?",
    [id]
  );
  
  if (result.affectedRows === 0) {
    throw new Error("Convênio não encontrado");
  }
  
  return result;
};

module.exports = {
  getAll,
  create,
  deleteById,
};
