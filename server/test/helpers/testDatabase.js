const fs = require("node:fs/promises");
const path = require("node:path");
const mysql = require("mysql2/promise");

const productionDatabase = process.env.DB_NAME || "tcc-projeto";
const testDatabase = process.env.DB_TEST_NAME
  || `${productionDatabase.replace(/[^a-zA-Z0-9_]/g, "_")}_test`;

if (testDatabase === productionDatabase || !testDatabase.endsWith("_test")) {
  throw new Error("O banco de testes precisa ser diferente do banco principal e terminar com _test.");
}

process.env.NODE_ENV = "test";
process.env.DB_NAME = testDatabase;

const ignorableMigrationErrors = new Set([
  "ER_DUP_FIELDNAME",
  "ER_DUP_KEYNAME",
  "ER_FK_DUP_NAME",
]);

async function ensureTestDatabase(config) {
  if (!/^[a-zA-Z0-9_]+$/.test(config.DB_NAME) || !config.DB_NAME.endsWith("_test")) {
    throw new Error(`Nome inseguro para banco de testes: ${config.DB_NAME}`);
  }

  const admin = await mysql.createConnection({
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
  });
  try {
    await admin.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
    );
  } finally {
    await admin.end();
  }

  const connection = await mysql.createConnection({
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    multipleStatements: true,
  });
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(191) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    const migrationsDirectory = path.resolve(__dirname, "../../migrations");
    const files = (await fs.readdir(migrationsDirectory))
      .filter((name) => name.endsWith(".sql"))
      .sort();

    for (const name of files) {
      const [applied] = await connection.query(
        "SELECT name FROM schema_migrations WHERE name = ?",
        [name],
      );
      if (applied.length) continue;

      const sql = await fs.readFile(path.join(migrationsDirectory, name), "utf8");
      const statements = sql.split(";").map((statement) => statement.trim()).filter(Boolean);
      for (const statement of statements) {
        try {
          await connection.query(statement);
        } catch (error) {
          if (!ignorableMigrationErrors.has(error.code)) throw error;
        }
      }
      await connection.query("INSERT INTO schema_migrations (name) VALUES (?)", [name]);
    }
  } finally {
    await connection.end();
  }
}

module.exports = { ensureTestDatabase };
