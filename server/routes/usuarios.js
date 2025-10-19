//rotas para cadastro e login de usuários

const express = require("express");
const router = express.Router();
const db = require("../database.js"); // Usamos .. para "voltar" uma pasta
const bcrypt = require("bcryptjs");
// Rota: POST /usuarios/cadastro
// router.post('/cadastro', async (req, res) => {
//   // Aqui vai a lógica para pegar os dados do body (req.body)
//   // e inserir um novo usuário no banco de dados.
//   // Lembre-se de usar bcrypt para a senha!
//   res.send('Rota de cadastro de usuário');
// });

router.post()