// server/src/services/atendimentoService.js
const db = require('../../database.js');

/**
 * Busca o histórico de atendimentos de um paciente específico.
 * Junta as tabelas 'atendimentos' e 'agendamentos' para obter os dados.
 * @param {number} pacienteId O ID do paciente.
 * @returns {Promise<Array>} Uma lista de objetos de atendimento.
 */
const getByPacienteId = async (pacienteId) => {
    // Query que seleciona os dados do atendimento e informações relevantes do agendamento
    const sql = `
        SELECT 
            at.id AS atendimento_id,
            at.data_atendimento,
            at.evolucao_clinica,
            at.procedimentos_realizados,
            ag.tipo_consulta,
            ag.data_hora AS data_hora_agendamento -- Pode ser útil ter a data agendada também
        FROM 
            atendimentos AS at
        JOIN 
            agendamentos AS ag ON at.agendamento_id = ag.id 
        WHERE 
            ag.paciente_id = ? 
        ORDER BY 
            at.data_atendimento DESC; -- Ordena do mais recente para o mais antigo
    `;

    // Executa a query passando o ID do paciente
    const [atendimentos] = await db.query(sql, [pacienteId]);

    return atendimentos;
};

// --- FUNÇÃO PARA CRIAR ATENDIMENTO (Precisaremos dela depois) ---
// Por enquanto, vamos deixar a estrutura pronta
const create = async (atendimentoData) => {
    const { agendamento_id, evolucao_clinica, procedimentos_realizados } = atendimentoData;
    
    // Validação básica
    if (!agendamento_id) {
        throw new Error('ID do agendamento é obrigatório para criar um atendimento.');
    }

    // Verifica se já existe um atendimento para este agendamento
    const [existingAtendimento] = await db.query(
        'SELECT id FROM atendimentos WHERE agendamento_id = ?',
        [agendamento_id]
    );

    if (existingAtendimento.length > 0) {
        throw new Error('Este agendamento já possui um prontuário registrado.');
    }

    // Atualiza o status do agendamento para "Concluído"
    await db.query(
        'UPDATE agendamentos SET status = ? WHERE id = ?',
        ['Concluído', agendamento_id]
    );

    const sql = `
        INSERT INTO atendimentos 
        (agendamento_id, evolucao_clinica, procedimentos_realizados) 
        VALUES (?, ?, ?)
    `;
    const params = [agendamento_id, evolucao_clinica, procedimentos_realizados];
    
    const [result] = await db.query(sql, params);
    return { id: result.insertId };
};


module.exports = {
    getByPacienteId,
    create, // Já exportamos a função create para quando precisarmos
};