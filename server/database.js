// Importa o pacote mysql2
const mysql = require('mysql2');
const config = require('./src/config');

// Cria o Pool de Conexões com o banco de dados
const pool = mysql.createPool({
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  port: config.DB_PORT,
  waitForConnections: true,
  connectionLimit: config.DB_POOL_SIZE,
  queueLimit: 100,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
  dateStrings: true
});

// A linha .promise() permite que usemos a sintaxe moderna async/await
// em vez de callbacks, o que torna o código muito mais limpo.
module.exports = pool.promise();
