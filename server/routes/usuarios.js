//rotas para cadastro e login de usuários


const express = require('express');
const router = express.Router();
const db = require('../database.js'); // Usamos .. para "voltar" uma pasta
const bcrypt = require('bcryptjs');
// Rota: POST /usuarios/cadastro
// router.post('/cadastro', async (req, res) => {
//   // Aqui vai a lógica para pegar os dados do body (req.body)
//   // e inserir um novo usuário no banco de dados.
//   // Lembre-se de usar bcrypt para a senha!
//   res.send('Rota de cadastro de usuário');
// });

// Rota: POST /usuarios/login
router.post('/login', async (req, res) => {

    try{
      const {email, senha} = req.body;
      console.log('Tentando fazer login com:', { email, senha });

      if(!email || !senha){
        return res.status(400).json({message:'Email e senha são obrigatorios.'});
      }
      const [users] = await db.query('SELECT * FROM Usuario WHERE email = ?', [email]);

      if(users.length === 0){
        return res.status(404).json({message:'Usuário não encontrado.'});
      }
      const user = users[0];

      const SenhaCorreta = await bcrypt.compare(senha, user.senha_hash);

      if(!SenhaCorreta){
        return res.status(401).json({message:'Senha incorreta.'});
      }

      // Se chegou aqui, login bem-sucedido
      res.status(200).json({message: 'Login realizado com sucesso.'});
    } catch(error){
      console.error('Error no login', error)
      res.status(500).json({message: 'erro interno ao fazer login.'});
    }  
});

module.exports = router; // Exporta o router com as rotas definidas