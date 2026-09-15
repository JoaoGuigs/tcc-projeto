const waitlistService = require("../services/waitlistService");
const usuarioService = require("../services/usuarioService");

async function professionalId(req) {
  const user = await usuarioService.getPublicUserById(req.user.sub);
  if (!user?.profissional_id) {
    const error = new Error("Usuário não está vinculado a um profissional.");
    error.statusCode = 403;
    throw error;
  }
  return user.profissional_id;
}

async function list(req, res) {
  try { res.json(await waitlistService.getAll(await professionalId(req))); }
  catch (error) { res.status(error.statusCode || 500).json({ message: error.message || "Erro ao buscar lista de espera." }); }
}
async function create(req, res) {
  try { res.status(201).json(await waitlistService.create(await professionalId(req), req.body)); }
  catch (error) { res.status(error.statusCode || 500).json({ message: error.message || "Erro ao adicionar à lista de espera." }); }
}
async function update(req, res) {
  try { res.json(await waitlistService.updateStatus(req.params.id, await professionalId(req), req.body.status)); }
  catch (error) { res.status(error.statusCode || 500).json({ message: error.message || "Erro ao atualizar lista de espera." }); }
}

module.exports = { list, create, update };
