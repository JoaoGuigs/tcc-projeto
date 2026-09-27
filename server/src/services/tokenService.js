const db = require("../../database");

async function revoke(jti, expiresAt) {
  if (!jti) return;
  const expira = expiresAt instanceof Date ? expiresAt : new Date(Date.now() + 8 * 60 * 60 * 1000);
  try {
    await db.query(
      "INSERT IGNORE INTO revoked_tokens (jti, expires_at) VALUES (?, ?)",
      [jti, expira],
    );
  } catch (error) {
    // Tabela pode não existir em bancos antigos antes da migration 005 — ignora para não quebrar logout.
    if (error.code === "ER_NO_SUCH_TABLE") return;
    throw error;
  }
}

async function isRevoked(jti) {
  if (!jti) return false;
  try {
    const [rows] = await db.query("SELECT 1 FROM revoked_tokens WHERE jti = ? LIMIT 1", [jti]);
    return rows.length > 0;
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE") return false;
    throw error;
  }
}

async function cleanup() {
  try {
    await db.query("DELETE FROM revoked_tokens WHERE expires_at < NOW()");
  } catch {
    // ignora — tabela pode não existir ainda
  }
}

module.exports = { revoke, isRevoked, cleanup };
