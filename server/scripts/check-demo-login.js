require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("../database");

async function main() {
  const email = "ana@fisiocare.demo";
  const password = "FisioCare123!";
  const [users] = await db.query(
    "SELECT u.id, u.email, u.senha_hash, p.id AS profissional_id "
      + "FROM usuarios u LEFT JOIN profissionais p ON p.usuario_id = u.id "
      + "WHERE u.email = ? LIMIT 1",
    [email],
  );
  const user = users[0];
  const valid = user ? await bcrypt.compare(password, user.senha_hash) : false;
  if (!valid || !user.profissional_id) {
    throw new Error("Usuário demo ausente, senha inválida ou profissional não vinculado.");
  }
  console.log(`Credenciais válidas para ${user.email} (profissional ${user.profissional_id}).`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
