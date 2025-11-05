const db = require("../../database");

const create = async (pacienteData) => {
  const {
    nome_completo,
    celular,
    convenio_id,
    numero_carteirinha,
    descricao_problema,
    profissao,
  } = pacienteData;
  // Verificar se celular foi informado
  if (!celular || String(celular).trim() === '') {
    throw new Error('Celular é obrigatório para cadastro de paciente.');
  }

  // Normalizar celular (apenas dígitos)
  const celularNormalized = String(celular).replace(/\D/g, '');

  // Validar tamanho (10 ou 11 dígitos é comum no BR)
  if (!(celularNormalized.length === 10 || celularNormalized.length === 11)) {
    throw new Error('Número de celular inválido. Informe DDD + número (10 ou 11 dígitos).');
  }

  // Checar existência usando o valor normalizado
  const [existing] = await db.query('SELECT id FROM pacientes WHERE celular = ?', [celularNormalized]);
  if (existing.length > 0) {
    throw new Error('Já existe um paciente cadastrado com este celular.');
  }
  const sql =
    "INSERT INTO pacientes (nome_completo, celular, convenio_id, numero_carteirinha, descricao_problema, profissao) VALUES (?, ?, ?, ?, ?, ?)";
  const [result] = await db.query(sql, [
    nome_completo,
    celularNormalized,
    convenio_id,
    numero_carteirinha,
    descricao_problema,
    profissao || null,
  ]);
  return { id: result.insertId };
};
const getAll = async (nomeQuery) => { // 1. Recebe o nome como parâmetro
    let sql = "SELECT id, nome_completo FROM pacientes"; // 2. Pega só id e nome
    const params = [];

    if (nomeQuery) { // 3. Se um nome foi enviado...
        sql += " WHERE nome_completo LIKE ?"; // ...adiciona o filtro LIKE
        params.push(`%${nomeQuery}%`); // ...e o parâmetro (com % para busca parcial)
    }
    sql += " ORDER BY nome_completo LIMIT 10"; // 4. Limita a 10 resultados

    const [pacientes] = await db.query(sql, params);
    return pacientes;
};
const getById = async (id) => {
    // Query que busca dados do paciente e faz JOIN com convenios
    const sql = `
        SELECT 
            p.id, 
            p.nome_completo, 
            p.celular, 
            p.convenio_id, 
            p.numero_carteirinha, 
            p.descricao_problema,
            p.profissao, -- Incluímos a profissao
            c.nome_convenio -- Pegamos o nome do convênio da tabela convenios
        FROM 
            pacientes AS p 
        LEFT JOIN 
            convenios AS c ON p.convenio_id = c.id 
        WHERE 
            p.id = ?;
    `;
    
    // Executa a query passando o ID recebido
    const [pacientes] = await db.query(sql, [id]);

    // Retorna o primeiro (e único) paciente encontrado, ou null se não encontrar
    return pacientes.length > 0 ? pacientes[0] : null; 
};


module.exports = {
    create, getAll, getById
}