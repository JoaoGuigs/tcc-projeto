const jwt = require("jsonwebtoken");
const usuarioService = require("../services/usuarioService");
const config = require("../config");

const cookieOptions = {
  httpOnly: true,
  secure: config.COOKIE_SECURE,
  sameSite: "lax",
  maxAge: 8 * 60 * 60 * 1000,
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
    const token = jwt.sign({ sub: user.id, nome: user.nome, email: user.email }, config.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: config.JWT_EXPIRES_IN,
    });
    return res.cookie("session", token, cookieOptions).json({ message: "Login realizado com sucesso.", user });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    return next(error);
  }
}

function logout(req, res) {
  res.clearCookie("session", cookieOptions).status(204).end();
}

async function me(req, res, next) {
  try {
    const user = await usuarioService.getPublicUserById(req.user.sub);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado." });
    return res.json({ user });
  } catch (error) { return next(error); }
}

module.exports = { createProfissional, login, logout, me };
