const jwt = require("jsonwebtoken");
const config = require("../config");
const db = require("../../database");
const tokenService = require("../services/tokenService");

function readToken(req) {
  const bearer = req.get("authorization");
  if (bearer?.startsWith("Bearer ")) return { token: bearer.slice(7), via: "bearer" };
  const cookieToken = req.cookies?.["__Host-session"] || req.cookies?.session || null;
  if (cookieToken) return { token: cookieToken, via: "cookie" };
  return { token: null, via: null };
}

async function requireAuth(req, res, next) {
  const { token, via } = readToken(req);
  if (!token) return res.status(401).json({ message: "Autenticação necessária." });
  try {
    const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ["HS256"] });
    if (payload?.jti && (await tokenService.isRevoked(payload.jti))) {
      return res.status(401).json({ message: "Sessão revogada." });
    }
    req.user = payload;
    req.authVia = via;
    return next();
  } catch {
    return res.status(401).json({ message: "Sessão inválida ou expirada." });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.admin === true) return next();
  return res.status(403).json({ message: "Acesso restrito ao administrador." });
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

async function requireAdminOrFirstUser(req, res, next) {
  try {
    const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM usuarios");
    if (Number(total) === 0) return next();
    await requireAuth(req, res, () => {});
    if (!req.user) return;
    return requireAdmin(req, res, next);
  } catch (error) {
    return next(error);
  }
}

module.exports = { requireAuth, requireAdmin, requireAuthOrFirstUser, requireAdminOrFirstUser };
