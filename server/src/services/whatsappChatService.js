const db = require("../../database");

function normalize(numero) {
  return String(numero || "").replace(/\D/g, "");
}

async function registrar({ numero, direcao, texto, status = "enviada", messageId = null }) {
  const [result] = await db.query(
    `INSERT IGNORE INTO whatsapp_mensagens (numero, direcao, texto, status, message_id, lida)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [normalize(numero), direcao, texto, status, messageId, direcao === "saida" ? 1 : 0],
  );
  return result.insertId || null;
}

async function atualizarStatusPorMessageId(messageId, status, erro = null) {
  if (!messageId) return;
  await db.query("UPDATE whatsapp_mensagens SET status = ?, erro = ? WHERE message_id = ?", [status, erro, messageId]);
}

async function marcarLidas(numero) {
  const [result] = await db.query(
    "UPDATE whatsapp_mensagens SET lida = 1 WHERE numero = ? AND direcao = 'entrada' AND lida = 0",
    [normalize(numero)],
  );
  return result.affectedRows;
}

async function resolverPaciente(numero) {
  const [pacientes] = await db.query("SELECT id, nome_completo, celular FROM pacientes");
  const digits = normalize(numero);
  const tail11 = digits.slice(-11);
  const tail10 = digits.slice(-10);
  const match = pacientes.find((paciente) => {
    const celular = normalize(paciente.celular);
    return (celular.length === 11 && celular === tail11) || (celular.length === 10 && celular === tail10);
  });
  return match ? { id: match.id, nome_completo: match.nome_completo } : null;
}

async function listarConversas() {
  const [rows] = await db.query(
    `SELECT numero, direcao, texto, status, erro, lida, criado_em
     FROM whatsapp_mensagens ORDER BY criado_em DESC LIMIT 500`,
  );

  const porNumero = new Map();
  for (const row of rows) {
    if (!porNumero.has(row.numero)) porNumero.set(row.numero, []);
    porNumero.get(row.numero).push(row);
  }

  const conversas = [];
  for (const [numero, mensagens] of porNumero) {
    const ultima = mensagens[0];
    conversas.push({
      numero,
      paciente: await resolverPaciente(numero),
      ultimo_texto: ultima.texto,
      ultima_direcao: ultima.direcao,
      ultima_em: ultima.criado_em,
      nao_lidas: mensagens.filter((m) => m.direcao === "entrada" && !m.lida).length,
      total: mensagens.length,
    });
  }

  conversas.sort((a, b) => new Date(b.ultima_em) - new Date(a.ultima_em));
  return conversas;
}

async function listarMensagens(numero, limite = 200) {
  const [rows] = await db.query(
    `SELECT id, numero, direcao, texto, status, erro, lida, criado_em
     FROM whatsapp_mensagens WHERE numero = ? ORDER BY criado_em ASC LIMIT ?`,
    [normalize(numero), limite],
  );
  return rows;
}

async function obterConversa(numero) {
  const normalizado = normalize(numero);
  const [mensagens, paciente] = await Promise.all([listarMensagens(normalizado), resolverPaciente(normalizado)]);
  if (mensagens.length === 0 && !paciente) return null;
  return { numero: normalizado, paciente, mensagens };
}

module.exports = { registrar, atualizarStatusPorMessageId, marcarLidas, listarConversas, listarMensagens, obterConversa };
