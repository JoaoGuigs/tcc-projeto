const express = require('express');
const router = express.Router();
const db = require('../../database');

// Buscar configurações da clínica
router.get('/ ', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT nome_clinica, cnpj, telefone, email FROM configuracoes_clinica LIMIT 1'
    );
    res.json(rows[0] || {
      nome_clinica: '',
      cnpj: '',
      telefone: '',
      email: '',
    });
  } catch (error) {
    console.error('Erro ao buscar configurações da clínica:', error);
    res.status(500).json({ message: 'Erro ao buscar configurações da clínica' });
  }
});

// Atualizar configurações da clínica
router.put('/clinica', async (req, res) => {
  const { nome_clinica, cnpj, telefone, email } = req.body;

  try {
    const [rows] = await db.query('SELECT id FROM configuracoes_clinica LIMIT 1');
    
    if (rows.length > 0) {
      // Atualiza configurações existentes
      await db.query(
        'UPDATE configuracoes_clinica SET nome_clinica = ?, cnpj = ?, telefone = ?, email = ? WHERE id = ?',
        [nome_clinica, cnpj, telefone, email, rows[0].id]
      );
    } else {
      // Insere novas configurações
      await db.query(
        'INSERT INTO configuracoes_clinica (nome_clinica, cnpj, telefone, email) VALUES (?, ?, ?, ?)',
        [nome_clinica, cnpj, telefone, email]
      );
    }

    res.json({ message: 'Configurações atualizadas com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar configurações da clínica:', error);
    res.status(500).json({ message: 'Erro ao atualizar configurações da clínica' });
  }
});

// Buscar mensagens padrão
router.get('/mensagens', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, titulo, mensagem FROM mensagens_padrao'
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar mensagens padrão:', error);
    res.status(500).json({ message: 'Erro ao buscar mensagens padrão' });
  }
});

// Adicionar mensagem padrão
router.post('/mensagens', async (req, res) => {
  const { titulo, mensagem } = req.body;

  try {
    await db.query(
      'INSERT INTO mensagens_padrao (titulo, mensagem) VALUES (?, ?)',
      [titulo, mensagem]
    );
    res.json({ message: 'Mensagem padrão adicionada com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar mensagem padrão:', error);
    res.status(500).json({ message: 'Erro ao adicionar mensagem padrão' });
  }
});

// Atualizar mensagem padrão
router.put('/mensagens/:id', async (req, res) => {
  const { id } = req.params;
  const { titulo, mensagem } = req.body;

  try {
    await db.query(
      'UPDATE mensagens_padrao SET titulo = ?, mensagem = ? WHERE id = ?',
      [titulo, mensagem, id]
    );
    res.json({ message: 'Mensagem padrão atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar mensagem padrão:', error);
    res.status(500).json({ message: 'Erro ao atualizar mensagem padrão' });
  }
});

// Excluir mensagem padrão
router.delete('/mensagens/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM mensagens_padrao WHERE id = ?', [id]);
    res.json({ message: 'Mensagem padrão excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir mensagem padrão:', error);
    res.status(500).json({ message: 'Erro ao excluir mensagem padrão' });
  }
});

module.exports = router;