const jwt = require("jsonwebtoken");
const config = require("../config");
const db = require("../../database");

function readToken(req) {
  const bearer = req.get("authorization");
  if (bearer?.startsWith("Bearer ")) return bearer.slice(7);
  return req.cookies?.session || null;
}

function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ message: "Autenticação necessária." });
  try {
    req.user = jwt.verify(token, config.JWT_SECRET, { algorithms: ["HS256"] });
    return next();
  } catch {
    return res.status(401).json({ message: "Sessão inválida ou expirada." });
  }
}

async function requireAuthOrFirstUser(req, res, next) {
  try {
    const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM usuarios");
    if (Number(total) === 0) return next();
    return requireAuth(req, res, next);
  } catch (error) {
    return next(error);
  }
}

module.exports = { requireAuth, requireAuthOrFirstUser };
