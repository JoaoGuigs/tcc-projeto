const express = require('express');
const app = express();
const port = 3001; // Porta para o back-end, diferente da do React (3000)
const db = require('./database.js'); 
// Rota de teste
app.get('/', (req, res) => {
  res.send('API do PhysioClinic ERP está funcionando!');
});

// Rota de teste para verificar a conexão com o banco
app.get('/test-db', async (req, res) => {
  try {
    // Faz uma consulta simples para buscar a data e hora atuais do banco
    const [results, fields] = await db.query('SELECT NOW();');
    
    // Se a consulta funcionar, retorna o resultado
    res.json({
      message: 'Conexão com o banco de dados bem-sucedida!',
      result: results[0]
    });
  } catch (error) {
    // Se der erro, informa no console e retorna uma mensagem de erro
    console.error('Erro ao conectar ao banco de dados:', error);
    res.status(500).json({ message: 'Erro ao conectar ao banco de dados.' });
  }
});

const usuariosRoutes = require('./routes/usuarios.js'); // Importa as rotas de usuários

app.use('/usuarios', usuariosRoutes); // Usa as rotas de usuários

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});