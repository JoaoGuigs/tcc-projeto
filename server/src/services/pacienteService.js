const db = require("../../database");

async function create({ nome_completo, celular, convenio_id, numero_carteirinha, descricao_problema, profissao }) {
  const normalizedPhone = String(celular).replace(/\D/g, "");
  if (!/^\d{10,11}$/.test(normalizedPhone)) {
    const error = new Error("Número de celular inválido. Informe DDD e número.");
    error.statusCode = 400;
    throw error;
  }
  try {
    const [result] = await db.query(
      `INSERT INTO pacientes
       (nome_completo, celular, convenio_id, numero_carteirinha, descricao_problema, profissao)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nome_completo, normalizedPhone, convenio_id || null, numero_carteirinha || null, descricao_problema || null, profissao || null],
    );
    return { id: result.insertId };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const conflict = new Error("Já existe um paciente cadastrado com este celular.");
      conflict.statusCode = 409;
      throw conflict;
    }
    throw error;
  }
}

async function getAll(nomeQuery) {
  const params = [];
  let sql = `SELECT p.id, p.nome_completo, p.celular, p.convenio_id, p.numero_carteirinha,
    p.descricao_problema, p.profissao, c.nome_convenio
    FROM pacientes p LEFT JOIN convenios c ON c.id = p.convenio_id`;
  if (nomeQuery) {
    sql += " WHERE p.nome_completo LIKE ?";
    params.push(`${nomeQuery}%`);
  }
  sql += nomeQuery ? " ORDER BY p.nome_completo LIMIT 10" : " ORDER BY p.nome_completo LIMIT 500";
  const [rows] = await db.query(sql, params);
  return rows;
}

async function getById(id) {
  const [rows] = await db.query(
    `SELECT p.id, p.nome_completo, p.celular, p.convenio_id, p.numero_carteirinha,
       p.descricao_problema, p.profissao, c.nome_convenio
     FROM pacientes p LEFT JOIN convenios c ON p.convenio_id = c.id WHERE p.id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

module.exports = { create, getAll, getById };
