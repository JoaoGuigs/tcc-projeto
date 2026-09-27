const db = require("../../database");
const bcrypt = require("bcryptjs");

async function createProfissional({ nome, email, senha, registro_profissional, especialidade }) {
  let connection;
  try {
    const senhaHash = await bcrypt.hash(senha, 12);
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [[{ total }]] = await connection.query("SELECT COUNT(*) AS total FROM usuarios");
    const isFirst = Number(total) === 0;
    try {
      const [userResult] = await connection.execute(
        "INSERT INTO usuarios (nome, email, senha_hash, is_admin) VALUES (?, ?, ?, ?)",
        [nome, email, senhaHash, isFirst],
      );
      await connection.execute(
        "INSERT INTO profissionais (usuario_id, registro_profissional, especialidade) VALUES (?, ?, ?)",
        [userResult.insertId, registro_profissional, especialidade],
      );
      await connection.commit();
      return { id: userResult.insertId, nome, email, is_admin: isFirst, message: "Profissional cadastrado com sucesso!" };
    } catch (error) {
      if (error.code !== "ER_BAD_FIELD_ERROR") throw error;
      // Banco antigo sem migration 006 — segue sem papel.
      const [userResult] = await connection.execute(
        "INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)",
        [nome, email, senhaHash],
      );
      await connection.execute(
        "INSERT INTO profissionais (usuario_id, registro_profissional, especialidade) VALUES (?, ?, ?)",
        [userResult.insertId, registro_profissional, especialidade],
      );
      await connection.commit();
      return { id: userResult.insertId, nome, email, is_admin: isFirst, message: "Profissional cadastrado com sucesso!" };
    }
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

async function login({ email, senha }) {
  let users;
  try {
    [users] = await db.query(
      `SELECT u.id, u.nome, u.email, u.senha_hash, u.is_admin, p.id AS profissional_id,
         p.registro_profissional, p.especialidade
       FROM usuarios u
       LEFT JOIN profissionais p ON p.usuario_id = u.id
       WHERE u.email = ? LIMIT 1`,
      [email],
    );
  } catch (error) {
    if (error.code !== "ER_BAD_FIELD_ERROR") throw error;
    [users] = await db.query(
      `SELECT u.id, u.nome, u.email, u.senha_hash, p.id AS profissional_id,
         p.registro_profissional, p.especialidade
       FROM usuarios u
       LEFT JOIN profissionais p ON p.usuario_id = u.id
       WHERE u.email = ? LIMIT 1`,
      [email],
    );
  }
  const user = users[0];
  const valid = user ? await bcrypt.compare(senha, user.senha_hash) : false;
  if (!valid) {
    const error = new Error("Email ou senha inválidos.");
    error.statusCode = 401;
    throw error;
  }
  return {
    id: user.id, nome: user.nome, email: user.email,
    is_admin: Boolean(user.is_admin),
    profissional_id: user.profissional_id,
    registro_profissional: user.registro_profissional,
    especialidade: user.especialidade,
  };
}

async function getPublicUserById(id) {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.nome, u.email, u.is_admin, p.id AS profissional_id,
         p.registro_profissional, p.especialidade
       FROM usuarios u
       LEFT JOIN profissionais p ON p.usuario_id = u.id
       WHERE u.id = ? LIMIT 1`,
      [id],
    );
    if (rows[0]) rows[0].is_admin = Boolean(rows[0].is_admin);
    return rows[0] || null;
  } catch (error) {
    if (error.code !== "ER_BAD_FIELD_ERROR") throw error;
    const [rows] = await db.query(
      `SELECT u.id, u.nome, u.email, p.id AS profissional_id,
         p.registro_profissional, p.especialidade
       FROM usuarios u
       LEFT JOIN profissionais p ON p.usuario_id = u.id
       WHERE u.id = ? LIMIT 1`,
      [id],
    );
    return rows[0] || null;
  }
}

module.exports = { createProfissional, login, getPublicUserById };
