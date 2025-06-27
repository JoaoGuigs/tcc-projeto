//rotas para cadastro e login de usuários


const express = require('express');
const router = express.Router();
const db = require('../database.js'); // Usamos .. para "voltar" uma pasta

// Rota: POST /usuarios/cadastro
// router.post('/cadastro', async (req, res) => {
//   // Aqui vai a lógica para pegar os dados do body (req.body)
//   // e inserir um novo usuário no banco de dados.
//   // Lembre-se de usar bcrypt para a senha!
//   res.send('Rota de cadastro de usuário');
// });

// Rota: POST /usuarios/login
router.get('/login', async (req, res) => {
  // Aqui vai a lógica para verificar o email e a senha
  res.send('Rota de login de usuário');
});

module.exports = router; // Exporta o router com as rotas definidas