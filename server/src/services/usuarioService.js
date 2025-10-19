const db = require('../../database.js');
const bcrypt = require('bcryptjs');

const createProfissional = async (profissionalData) => {
    const { nome, email, senha, registro_profissional, especialidade } = profissionalData;
    let connection;
    try {
        const senhaHash = await bcrypt.hash(senha, 10);
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [userResult] = await connection.execute('INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)', [nome, email, senhaHash]);
        const novoUsuarioId = userResult.insertId;
        await connection.execute('INSERT INTO profissionais (usuario_id, registro_profissional, especialidade) VALUES (?, ?, ?)', [novoUsuarioId, registro_profissional, especialidade]);
        await connection.commit();
        return { message: 'Profissional cadastrado com sucesso!' };
    } catch (error) {
        if (connection) await connection.rollback();
        throw error; // Lança o erro para o controller tratar
    } finally {
        if (connection) connection.release();
    }
};

const login = async (loginData) => {
    const { email, senha } = loginData;
    const [users] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    if (users.length === 0) {
        // Lançamos um erro específico para o controller saber o que aconteceu
        const error = new Error("Usuário não encontrado.");
        error.statusCode = 404;
        throw error;
    }
    const user = users[0];
    const senhaCorreta = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaCorreta) {
        const error = new Error("Senha incorreta.");
        error.statusCode = 401;
        throw error;
    }
    return { message: "Login realizado com sucesso." };
};

module.exports = {
    createProfissional,
    login,
};