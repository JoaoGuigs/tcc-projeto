const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const usuarioService = require("../services/usuarioService");
const tokenService = require("../services/tokenService");
const config = require("../config");

function parseExpiresInMs(value, fallbackMs) {
  if (!value) return fallbackMs;
  if (/^\d+$/.test(String(value))) return Number(value) * 1000;
  const match = String(value).match(/^(\d+)\s*([smhd])$/i);
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return amount * multipliers[unit];
}

function isSecureCookie() {
  return Boolean(config.COOKIE_SECURE) || config.NODE_ENV === "production";
}

function sessionCookieName() {
  return isSecureCookie() ? "__Host-session" : "session";
}

const cookieOptions = {
  httpOnly: true,
  secure: isSecureCookie(),
  sameSite: "lax",
  maxAge: parseExpiresInMs(config.JWT_EXPIRES_IN, 8 * 60 * 60 * 1000),
  path: "/",
};

const csrfCookieOptions = {
  httpOnly: false,
  secure: isSecureCookie(),
  sameSite: "lax",
  maxAge: parseExpiresInMs(config.JWT_EXPIRES_IN, 8 * 60 * 60 * 1000),
  path: "/",
};

async function createProfissional(req, res, next) {
  try {
    const result = await usuarioService.createProfissional(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Email ou registro já cadastrado." });
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const user = await usuarioService.login(req.body);
    const token = jwt.sign(
      { sub: user.id, nome: user.nome, email: user.email, admin: Boolean(user.is_admin), jti: crypto.randomUUID() },
      config.JWT_SECRET,
      { algorithm: "HS256", expiresIn: config.JWT_EXPIRES_IN },
    );
    const csrfToken = crypto.randomBytes(32).toString("hex");
    return res
      .cookie(sessionCookieName(), token, cookieOptions)
      .cookie("csrf", csrfToken, csrfCookieOptions)
      .json({ message: "Login realizado com sucesso.", user });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    return next(error);
  }
}

async function logout(req, res) {
  try {
    const token = req.cookies?.[sessionCookieName()] || req.cookies?.session || req.cookies?.["__Host-session"];
    if (token) {
      const decoded = jwt.decode(token);
      if (decoded?.jti) {
        const expMs = decoded.exp ? decoded.exp * 1000 : Date.now() + cookieOptions.maxAge;
        await tokenService.revoke(decoded.jti, new Date(expMs));
      }
    }
  } catch {
    // logout nunca falha por erro de revogação
  }
  res.clearCookie("session", { ...cookieOptions, secure: false });
  res.clearCookie("__Host-session", { ...cookieOptions, secure: true });
  res.clearCookie("csrf", { ...csrfCookieOptions });
  res.status(204).end();
}

async function me(req, res, next) {
  try {
    const user = await usuarioService.getPublicUserById(req.user.sub);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado." });
    return res.json({ user });
  } catch (error) { return next(error); }
}

module.exports = { createProfissional, login, logout, me };
