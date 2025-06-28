// Importa o pacote mysql2
const mysql = require('mysql2');

// Cria o Pool de Conexões com o banco de dados
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234', 
  database: 'tcc-projeto',
  port: 3309,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// A linha .promise() permite que usemos a sintaxe moderna async/await
// em vez de callbacks, o que torna o código muito mais limpo.
module.exports = pool.promise();