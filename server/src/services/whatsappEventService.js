const db = require("../../database");
const { parseMensagem } = require("./whatsappParserService");
const { criarAgendamento, cancelarAgendamento } = require("./whatsappBookingService");
const { enviarMensagem } = require("./evolutionApiService");
const chat = require("./whatsappChatService");

async function enqueue({ messageId, numero, texto }) {
  const [result] = await db.query("INSERT IGNORE INTO whatsapp_eventos (message_id, numero, texto) VALUES (?, ?, ?)", [messageId, numero, texto]);
  if (!result.affectedRows) return null;
  await chat.registrar({ numero, direcao: "entrada", texto, status: "pendente", messageId });
  return result.insertId;
}

async function claim(id) {
  const [result] = await db.query(
    `UPDATE whatsapp_eventos SET status = 'processando', tentativas = tentativas + 1
     WHERE id = ? AND status IN ('pendente', 'falhou') AND tentativas < 3`, [id],
  );
  if (!result.affectedRows) return null;
  const [rows] = await db.query("SELECT id, numero, texto, message_id FROM whatsapp_eventos WHERE id = ?", [id]);
  return rows[0] || null;
}

async function processEvent(id) {
  const event = await claim(id);
  if (!event) return;
  try {
    const parsed = await parseMensagem(event.texto);
    let result;
    if (parsed.intencao === "agendar") result = await criarAgendamento(parsed);
    else if (parsed.intencao === "cancelar") result = await cancelarAgendamento(parsed);
    else result = { mensagemResposta: "Não entendi. Use: paciente Nome dia hora, ou cancela Nome dia hora." };
    await enviarMensagem(event.numero, result.mensagemResposta);
    await chat.registrar({ numero: event.numero, direcao: "saida", texto: result.mensagemResposta, status: "enviada" });
    await chat.atualizarStatusPorMessageId(event.message_id, "concluido");
    await db.query("UPDATE whatsapp_eventos SET status = 'concluido', ultimo_erro = NULL WHERE id = ?", [id]);
  } catch (error) {
    await chat.atualizarStatusPorMessageId(event.message_id, "falhou", String(error.message).slice(0, 1000));
    await db.query("UPDATE whatsapp_eventos SET status = 'falhou', ultimo_erro = ? WHERE id = ?", [String(error.message).slice(0, 1000), id]);
    throw error;
  }
}

async function retryPending() {
  await db.query(
    `UPDATE whatsapp_eventos SET status = 'falhou', ultimo_erro = 'Processamento interrompido'
     WHERE status = 'processando' AND atualizado_em < DATE_SUB(NOW(), INTERVAL 1 MINUTE)`,
  );
  const [rows] = await db.query(
    `SELECT id FROM whatsapp_eventos WHERE status IN ('pendente', 'falhou') AND tentativas < 3 ORDER BY criado_em LIMIT 10`,
  );
  await Promise.allSettled(rows.map(({ id }) => processEvent(id)));
}

module.exports = { enqueue, processEvent, retryPending };
