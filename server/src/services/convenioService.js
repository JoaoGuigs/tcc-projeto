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
  try {
    const [result] = await db.query(
      "INSERT INTO convenios (nome_convenio) VALUES (?)",
      [nome_convenio]
    );
    return { id: result.insertId, nome_convenio };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const conflict = new Error("Já existe um convênio com este nome.");
      conflict.statusCode = 409;
      throw conflict;
    }
    throw error;
  }
};

const deleteById = async (id) => {
  // Primeiro verifica se o convênio está sendo usado por algum paciente
  const [pacientes] = await db.query(
    "SELECT COUNT(*) as total FROM pacientes WHERE convenio_id = ?",
    [id]
  );
  
  if (pacientes[0].total > 0) {
    const error = new Error(`Este convênio está sendo usado por ${pacientes[0].total} paciente(s) e não pode ser deletado. Primeiro remova ou altere o convênio destes pacientes.`);
    error.statusCode = 409;
    throw error;
  }
  
  // Se não está sendo usado, pode deletar
  const [result] = await db.query(
    "DELETE FROM convenios WHERE id = ?",
    [id]
  );
  
  if (result.affectedRows === 0) {
    const notFound = new Error("Convênio não encontrado");
    notFound.statusCode = 404;
    throw notFound;
  }
  
  return result;
};

module.exports = {
  getAll,
  create,
  deleteById,
};
