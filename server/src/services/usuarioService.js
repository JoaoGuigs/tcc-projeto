const db = require("../../database");
const bcrypt = require("bcryptjs");

async function createProfissional({ nome, email, senha, registro_profissional, especialidade }) {
  let connection;
  try {
    const senhaHash = await bcrypt.hash(senha, 12);
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [userResult] = await connection.execute(
      "INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)",
      [nome, email, senhaHash],
    );
    await connection.execute(
      "INSERT INTO profissionais (usuario_id, registro_profissional, especialidade) VALUES (?, ?, ?)",
      [userResult.insertId, registro_profissional, especialidade],
    );
    await connection.commit();
    return { id: userResult.insertId, nome, email, message: "Profissional cadastrado com sucesso!" };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

async function login({ email, senha }) {
  const [users] = await db.query(
    "SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ? LIMIT 1",
    [email],
  );
  const user = users[0];
  const valid = user ? await bcrypt.compare(senha, user.senha_hash) : false;
  if (!valid) {
    const error = new Error("Email ou senha inválidos.");
    error.statusCode = 401;
    throw error;
  }
  return { id: user.id, nome: user.nome, email: user.email };
}

module.exports = { createProfissional, login };
