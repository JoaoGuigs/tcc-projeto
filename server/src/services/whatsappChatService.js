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
  const digits = normalize(numero);
  if (!digits) return null;
  const tail11 = digits.slice(-11);
  const tail10 = digits.slice(-10);
  const [candidatos] = await db.query(
    "SELECT id, nome_completo, celular FROM pacientes WHERE celular LIKE ? OR celular LIKE ? LIMIT 20",
    [`%${tail11}`, `%${tail10}`],
  );
  const match = candidatos.find((paciente) => {
    const celular = normalize(paciente.celular);
    return celular.endsWith(tail11) || celular.endsWith(tail10);
  });
  return match ? { id: match.id, nome_completo: match.nome_completo } : null;
}

async function listarConversas(limite = 50, offset = 0) {
  const limit = Math.min(Math.max(Number(limite) || 50, 1), 200);
  const off = Math.max(Number(offset) || 0, 0);
  const [agregado] = await db.query(
    `SELECT numero, MAX(criado_em) AS ultima_em, COUNT(*) AS total,
       SUM(direcao = 'entrada' AND lida = 0) AS nao_lidas
     FROM whatsapp_mensagens GROUP BY numero ORDER BY ultima_em DESC LIMIT ? OFFSET ?`,
    [limit, off],
  );
  if (!agregado.length) return [];

  const [ultimas] = await db.query(
    `SELECT m.numero, m.direcao, m.texto, m.criado_em FROM whatsapp_mensagens m
     INNER JOIN (SELECT numero, MAX(criado_em) AS ultima_em FROM whatsapp_mensagens GROUP BY numero) u
       ON u.numero = m.numero AND u.ultima_em = m.criado_em
     WHERE m.numero IN (?)`,
    [agregado.map((row) => row.numero)],
  );
  const ultimaPorNumero = new Map(ultimas.map((row) => [row.numero, row]));

  const [pacientes] = await db.query("SELECT id, nome_completo, celular FROM pacientes");
  const porCelular = pacientes.map((p) => ({ id: p.id, nome_completo: p.nome_completo, celular: normalize(p.celular) }));
  const resolverLocal = (numero) => {
    const digits = normalize(numero);
    const found = porCelular.find((p) => p.celular.endsWith(digits.slice(-11)) || p.celular.endsWith(digits.slice(-10)));
    return found ? { id: found.id, nome_completo: found.nome_completo } : null;
  };

  return agregado.map((row) => {
    const ultima = ultimaPorNumero.get(row.numero);
    return {
      numero: row.numero,
      paciente: resolverLocal(row.numero),
      ultimo_texto: ultima?.texto || "",
      ultima_direcao: ultima?.direcao || "entrada",
      ultima_em: row.ultima_em,
      nao_lidas: Number(row.nao_lidas) || 0,
      total: Number(row.total) || 0,
    };
  }).sort((a, b) => new Date(b.ultima_em) - new Date(a.ultima_em));
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
