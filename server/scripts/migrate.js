require("dotenv").config();

const fs = require("node:fs/promises");
const path = require("node:path");
const mysql = require("mysql2/promise");
const config = require("../src/config");

const ignorableCodes = new Set([
  "ER_DUP_FIELDNAME",
  "ER_DUP_KEYNAME",
  "ER_FK_DUP_NAME",
  "ER_CHECK_CONSTRAINT_DUP_NAME",
  "ER_DUP_CONSTRAINT_NAME",
]);

function splitSqlStatements(sql) {
  const statements = [];
  let current = "";
  let single = false;
  let double = false;
  let backtick = false;
  let lineComment = false;
  let blockComment = false;
  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    const next = sql[i + 1] || "";
    if (lineComment) {
      current += char;
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      current += char;
      if (char === "*" && next === "/") {
        current += next;
        i += 1;
        blockComment = false;
      }
      continue;
    }
    if (!single && !double && !backtick) {
      if (char === "-" && next === "-") { lineComment = true; current += char; continue; }
      if (char === "#") { lineComment = true; current += char; continue; }
      if (char === "/" && next === "*") { blockComment = true; current += char + next; i += 1; continue; }
    }
    if (char === "'" && !double && !backtick && sql[i - 1] !== "\\") single = !single;
    else if (char === '"' && !single && !backtick && sql[i - 1] !== "\\") double = !double;
    else if (char === "`" && !single && !double) backtick = !backtick;
    if (char === ";" && !single && !double && !backtick) {
      if (current.trim()) statements.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

async function tableExists(connection, tableName) {
  const [rows] = await connection.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1`,
    [tableName],
  );
  return rows.length > 0;
}

async function assertNoDuplicates(connection) {
  const checks = [];
  if (await tableExists(connection, "usuarios")) {
    checks.push(["emails duplicados em usuarios",
      "SELECT email AS valor, COUNT(*) AS total FROM usuarios GROUP BY email HAVING COUNT(*) > 1"]);
  }
  if (await tableExists(connection, "pacientes")) {
    checks.push(["celulares duplicados em pacientes",
      "SELECT celular AS valor, COUNT(*) AS total FROM pacientes GROUP BY celular HAVING COUNT(*) > 1"]);
  }
  if (await tableExists(connection, "agendamentos")) {
    checks.push(["horários ativos duplicados em agendamentos",
      `SELECT profissional_id, data_hora, COUNT(*) AS total FROM agendamentos
       WHERE status <> 'Cancelado' GROUP BY profissional_id, data_hora HAVING COUNT(*) > 1`]);
  }
  if (await tableExists(connection, "atendimentos")) {
    checks.push(["prontuários duplicados em atendimentos",
      "SELECT agendamento_id AS valor, COUNT(*) AS total FROM atendimentos GROUP BY agendamento_id HAVING COUNT(*) > 1"]);
  }
  if (await tableExists(connection, "whatsapp_eventos")) {
    checks.push(["message_id duplicados em whatsapp_eventos",
      "SELECT message_id AS valor, COUNT(*) AS total FROM whatsapp_eventos GROUP BY message_id HAVING COUNT(*) > 1"]);
  }
  if (await tableExists(connection, "convenios")) {
    checks.push(["nomes duplicados em convenios",
      "SELECT nome_convenio AS valor, COUNT(*) AS total FROM convenios GROUP BY nome_convenio HAVING COUNT(*) > 1"]);
  }

  const problems = [];
  for (const [label, sql] of checks) {
    const [rows] = await connection.query(sql);
    if (rows.length) problems.push({ label, rows });
  }
  if (!problems.length) return;

  const details = problems.map(({ label, rows }) => `${label}: ${JSON.stringify(rows)}`).join("\n");
  throw new Error(`Não foi possível aplicar índices únicos. Resolva as duplicidades abaixo:\n${details}`);
}

async function main() {
  const connection = await mysql.createConnection({
    host: config.DB_HOST, port: config.DB_PORT, user: config.DB_USER,
    password: config.DB_PASSWORD, database: config.DB_NAME, charset: "utf8mb4",
  });
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(191) PRIMARY KEY, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    const migrationsDir = path.resolve(__dirname, "../migrations");
    const files = (await fs.readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();
    for (const name of files) {
      const [existing] = await connection.query("SELECT name FROM schema_migrations WHERE name = ?", [name]);
      if (existing.length) continue;
      if (name.startsWith("002_") || name.startsWith("005_")) await assertNoDuplicates(connection);
      const sql = await fs.readFile(path.join(migrationsDir, name), "utf8");
      const statements = splitSqlStatements(sql).map((statement) => statement.trim()).filter(Boolean);
      for (const statement of statements) {
        try { await connection.query(statement); }
        catch (error) {
          if (error.code === "ER_DUP_ENTRY") {
            throw new Error(`Índice único bloqueado por dados duplicados em ${name}. ${error.message}`);
          }
          if (!ignorableCodes.has(error.code)) throw error;
        }
      }
      await connection.query("INSERT INTO schema_migrations (name) VALUES (?)", [name]);
      console.log(`Migration aplicada: ${name}`);
    }
  } finally { await connection.end(); }
}

main().catch((error) => { console.error(error); process.exit(1); });
