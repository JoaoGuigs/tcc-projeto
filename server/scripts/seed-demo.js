require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("../../server/database");
const config = require("../src/config");

function mysqlDate(dayOffset, hour, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  const pad = (value) => String(value).padStart(2, "0");
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate())
    + " " + pad(hour) + ":" + pad(minute) + ":00";
}

async function ensureProfessional(connection) {
  const password = "FisioCare123!";
  const hash = await bcrypt.hash(password, 12);
  const [user] = await connection.query(
    "INSERT INTO usuarios (nome, email, senha_hash) VALUES ('Dra. Ana Souza', 'ana@fisiocare.demo', ?) "
      + "ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), nome = VALUES(nome), senha_hash = VALUES(senha_hash)",
    [hash],
  );
  const [professionals] = await connection.query(
    "SELECT id FROM profissionais WHERE usuario_id = ? LIMIT 1",
    [user.insertId],
  );
  if (professionals[0]) return { id: professionals[0].id, createdLogin: false, password };
  const [professional] = await connection.query(
    "INSERT INTO profissionais (usuario_id, registro_profissional, especialidade) "
      + "VALUES (?, 'CREFITO-DEMO-001', 'Fisioterapia') "
      + "ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), especialidade = VALUES(especialidade)",
    [user.insertId],
  );
  return { id: professional.insertId, createdLogin: true, password };
}

async function ensurePatient(connection, patient) {
  const [existing] = await connection.query("SELECT id FROM pacientes WHERE celular = ? LIMIT 1", [patient.celular]);
  if (existing[0]) return existing[0].id;
  const [result] = await connection.query(
    "INSERT INTO pacientes (nome_completo, celular, convenio_id, descricao_problema, profissao) VALUES (?, ?, ?, ?, ?)",
    [patient.nome, patient.celular, patient.convenioId || null, patient.problema, patient.profissao],
  );
  return result.insertId;
}

async function ensureConvenio(connection, name) {
  const [existing] = await connection.query("SELECT id FROM convenios WHERE nome_convenio = ? LIMIT 1", [name]);
  if (existing[0]) return existing[0].id;
  const [result] = await connection.query("INSERT INTO convenios (nome_convenio) VALUES (?)", [name]);
  return result.insertId;
}

async function ensureAppointment(connection, appointment) {
  const [existing] = await connection.query(
    "SELECT id FROM agendamentos WHERE paciente_id = ? AND profissional_id = ? AND data_hora = ? AND status <> 'Cancelado' LIMIT 1",
    [appointment.pacienteId, appointment.profissionalId, appointment.dataHora],
  );
  if (existing[0]) return existing[0].id;
  await connection.query(
    "INSERT IGNORE INTO agendamentos "
      + "(paciente_id, profissional_id, data_hora, tipo_consulta, observacoes, status) "
      + "VALUES (?, ?, ?, ?, ?, ?)",
    [appointment.pacienteId, appointment.profissionalId, appointment.dataHora, appointment.tipo,
      appointment.observacoes || "Sessão de acompanhamento.", appointment.status],
  );
  const [rows] = await connection.query(
    "SELECT id FROM agendamentos WHERE paciente_id = ? AND profissional_id = ? AND data_hora = ? "
      + "AND status <> 'Cancelado' LIMIT 1",
    [appointment.pacienteId, appointment.profissionalId, appointment.dataHora],
  );
  return rows[0]?.id;
}

async function ensureAttendance(connection, appointmentId, date, evolution, procedures) {
  if (!appointmentId) return;
  const [existing] = await connection.query("SELECT id FROM atendimentos WHERE agendamento_id = ? LIMIT 1", [appointmentId]);
  if (existing[0]) return;
  await connection.query(
    "INSERT IGNORE INTO atendimentos (agendamento_id, data_atendimento, evolucao_clinica, procedimentos_realizados) VALUES (?, ?, ?, ?)",
    [appointmentId, date, evolution, procedures],
  );
  await connection.query("UPDATE agendamentos SET status = 'Concluído' WHERE id = ? AND status <> 'Cancelado'", [appointmentId]);
}

function assertLocalDemoTarget() {
  if (config.NODE_ENV !== "development" || config.DB_HOST !== "localhost" || config.DB_NAME !== "tcc-projeto") {
    throw new Error("O seed de demonstração só pode ser executado no banco local tcc-projeto em development.");
  }
}

async function ensureWaitlist(connection, patientId, professionalId, preferredDate, period, notes) {
  const [rows] = await connection.query(
    "SELECT id FROM lista_espera WHERE paciente_id = ? AND profissional_id = ? AND status IN ('Aguardando', 'Contatado') LIMIT 1",
    [patientId, professionalId],
  );
  if (rows.length) return rows[0].id;
  const [result] = await connection.query(
    "INSERT INTO lista_espera (paciente_id, profissional_id, data_preferida, periodo, observacoes) VALUES (?, ?, ?, ?, ?)",
    [patientId, professionalId, preferredDate, period, notes],
  );
  return result.insertId;
}

function previousWeekdayOffset(index) {
  let offset = -1;
  let weekdays = 0;
  while (weekdays < index) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    if (date.getDay() !== 0 && date.getDay() !== 6) weekdays += 1;
    if (weekdays < index) offset -= 1;
  }
  return offset;
}

function isWeekdayOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.getDay() !== 0 && date.getDay() !== 6;
}

async function main() {
  assertLocalDemoTarget();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const professional = await ensureProfessional(connection);
    const [professionalRows] = await connection.query("SELECT id FROM profissionais ORDER BY id");
    const scheduleProfessionalIds = professionalRows.map((row) => row.id);
    const patients = [
      { nome: "Maria Oliveira", celular: "48999123344", problema: "Dor e limitação na coluna cervical", profissao: "Professora" },
      { nome: "João Pereira", celular: "48988772211", problema: "Dor no joelho após atividade física", profissao: "Contador" },
      { nome: "Carla Mendes", celular: "48991004455", problema: "Acompanhamento de pilates clínico", profissao: "Arquiteta" },
      { nome: "Beatriz Lima", celular: "48997721180", problema: "Reavaliação funcional", profissao: "Enfermeira" },
      { nome: "Renata Nunes", celular: "48984427701", problema: "Dor lombar recorrente", profissao: "Comerciante" },
      { nome: "Lucas Alves", celular: "48992310860", problema: "Tensão e dor cervical", profissao: "Desenvolvedor" },
    ];
    const ids = {};
    for (const patient of patients) ids[patient.nome] = await ensurePatient(connection, patient);

    const appointments = [
      ["Maria Oliveira", 0, 8, 0, "Retorno · coluna cervical", "Confirmado"],
      ["João Pereira", 0, 9, 0, "Avaliação · joelho", "Agendado"],
      ["Carla Mendes", 0, 11, 0, "Pilates clínico", "Confirmado"],
      ["Beatriz Lima", 0, 13, 30, "Reavaliação funcional", "Confirmado"],
      ["Lucas Alves", 1, 15, 0, "Sessão · cervical", "Confirmado"],
      ["Renata Nunes", 2, 9, 30, "Retorno · lombar", "Agendado"],
    ];
    for (const [name, day, hour, minute, type, status] of appointments) {
      await ensureAppointment(connection, {
        pacienteId: ids[name],
        profissionalId: professional.id,
        dataHora: mysqlDate(day, hour, minute),
        tipo: type,
        status,
      });
    }

    const tomorrow = mysqlDate(1, 9).slice(0, 10);
    await ensureWaitlist(connection, ids["Renata Nunes"], professional.id, tomorrow, "Manhã", "Aceita aviso com pouca antecedência");
    await ensureWaitlist(connection, ids["Lucas Alves"], professional.id, null, "Tarde", "Prefere depois das 15h");

    const previousId = await ensureAppointment(connection, {
      pacienteId: ids["Maria Oliveira"],
      profissionalId: professional.id,
      dataHora: mysqlDate(-1, 14, 30),
      tipo: "Retorno · coluna cervical",
      status: "Confirmado",
    });
    if (previousId) {
      await connection.query(
        "INSERT IGNORE INTO atendimentos "
          + "(agendamento_id, evolucao_clinica, procedimentos_realizados) "
          + "VALUES (?, 'Paciente apresentou redução da dor e ganho de amplitude.', "
          + "'Mobilização articular e exercícios ativos.')",
        [previousId],
      );
    }

    const convenioNames = ["Unimed", "Bradesco Saude", "SulAmerica"];
    const convenios = [];
    for (const name of convenioNames) convenios.push(await ensureConvenio(connection, name));
    const firstNames = ["Helena", "Marcos", "Sofia", "Rafael", "Isabela", "Eduardo", "Camila", "Pedro", "Laura", "Gustavo"];
    const lastNames = ["Martins", "Ribeiro", "Costa", "Almeida"];
    const professions = ["Professora", "Analista", "Comerciante", "Enfermeiro", "Designer", "Aposentado", "Advogada", "Estudante"];
    const complaints = [
      "Reabilitacao de dor lombar e melhora da mobilidade.",
      "Fortalecimento apos lesao no joelho.",
      "Tratamento de tensao cervical e correcao postural.",
      "Recuperacao funcional do ombro.",
      "Acompanhamento de equilibrio e marcha.",
      "Reabilitacao apos entorse no tornozelo.",
      "Reducao de dor e ganho de amplitude de movimento.",
      "Condicionamento e prevencao de novas lesoes.",
    ];
    const demoPatients = [];
    for (let index = 0; index < 40; index += 1) {
      const name = `${firstNames[index % firstNames.length]} ${lastNames[Math.floor(index / firstNames.length)]}`;
      const phone = `0099${String(index + 1).padStart(7, "0")}`;
      const convenioId = index % 4 === 0 ? null : convenios[index % convenios.length];
      const id = await ensurePatient(connection, {
        nome: name,
        celular: phone,
        convenioId,
        problema: complaints[index % complaints.length],
        profissao: professions[index % professions.length],
      });
      demoPatients.push({ id, nome: name, celular: phone });
    }

    const sessionTypes = ["Fisioterapia ortopedica", "Pilates clinico", "Terapia manual", "Reavaliacao funcional"];
    const scheduleTimes = [[8, 30], [10, 0], [12, 0], [14, 0], [15, 30], [16, 30]];
    for (const scheduleProfessionalId of scheduleProfessionalIds) {
      for (let offset = -35; offset <= 28; offset += 1) {
        if (!isWeekdayOffset(offset) && offset !== 0) continue;
        const slots = offset === 0 ? scheduleTimes.slice(0, 5) : scheduleTimes.slice(0, 3);
        for (let slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
          const patient = demoPatients[Math.abs(offset * 3 + slotIndex) % demoPatients.length];
          const [hour, minute] = slots[slotIndex];
          const isPast = offset < 0;
          const status = isPast
            ? (Math.abs(offset + slotIndex) % 7 === 0 ? "Faltou" : "Concluido")
            : ((offset + slotIndex) % 3 === 0 ? "Confirmado" : "Agendado");
          const appointmentId = await ensureAppointment(connection, {
            pacienteId: patient.id,
            profissionalId: scheduleProfessionalId,
            dataHora: mysqlDate(offset, hour, minute),
            tipo: sessionTypes[Math.abs(offset + slotIndex) % sessionTypes.length],
            status,
            observacoes: "Registro demonstrativo para popular a agenda.",
          });
          if (isPast && status === "Concluido") {
            await ensureAttendance(connection, appointmentId, mysqlDate(offset, hour, minute),
              "Evolucao estavel, com boa resposta aos exercicios e orientacoes passadas.",
              "Exercicios terapeuticos, mobilidade e terapia manual.");
          }
        }
      }

      // Perfil demonstrativo com dez sessoes anteriores para validar o historico clinico.
      const historyPatient = demoPatients[0];
      for (let visit = 1; visit <= 10; visit += 1) {
        const offset = previousWeekdayOffset(visit);
        const appointmentId = await ensureAppointment(connection, {
          pacienteId: historyPatient.id,
          profissionalId: scheduleProfessionalId,
          dataHora: mysqlDate(offset, 17, 30),
          tipo: sessionTypes[visit % sessionTypes.length],
          status: "Concluido",
          observacoes: "Sessao de acompanhamento demonstrativa.",
        });
        await ensureAttendance(connection, appointmentId, mysqlDate(offset, 17, 30),
          `Sessao ${visit}: evolucao favoravel e plano terapeutico mantido.`,
          "Exercicios funcionais, mobilidade e orientacoes domiciliares.");
      }

      for (let index = 0; index < 8; index += 1) {
        const patient = demoPatients[index + 8];
        await ensureWaitlist(connection, patient.id, scheduleProfessionalId,
          mysqlDate(index % 3, 9).slice(0, 10), ["Manha", "Tarde", "Qualquer horario"][index % 3],
          "Paciente demonstrativo; aceita contato para antecipar o atendimento.");
      }
    }

    // Somente mensagens recebidas em numeros ficticios (DDD 00), nunca numeros reais de contato.
    for (let index = 0; index < 8; index += 1) {
      const patient = demoPatients[index];
      for (let messageIndex = 0; messageIndex < 2; messageIndex += 1) {
        const text = messageIndex === 0
          ? "Ola, gostaria de confirmar meu proximo horario."
          : "Consigo ajustar meu atendimento para outro periodo?";
        await connection.query(
          "INSERT IGNORE INTO whatsapp_mensagens (numero, direcao, texto, status, message_id, lida) "
            + "VALUES (?, 'entrada', ?, 'recebida', ?, ?)",
          [patient.celular, text, `demo-seed-${index + 1}-${messageIndex + 1}`, messageIndex],
        );
      }
    }

    const messages = [
      ["48999123344", "entrada", "Oi, confirmo minha consulta de hoje.", "demo-in-1", 0],
      ["48999123344", "saida", "Consulta confirmada. Até breve!", "demo-out-1", 1],
      ["48988772211", "entrada", "Tenho horário marcado às 9h?", "demo-in-2", 0],
    ];
    for (const [number, direction, message, messageId, read] of messages) {
      await connection.query(
        "INSERT IGNORE INTO whatsapp_mensagens "
          + "(numero, direcao, texto, status, message_id, lida) "
          + "VALUES (?, ?, ?, 'enviada', ?, ?)",
        [number, direction, message, messageId, read],
      );
    }

    const [demoUsers] = await connection.query(
      "SELECT senha_hash FROM usuarios WHERE email = 'ana@fisiocare.demo' LIMIT 1",
    );
    const credentialsAreValid = demoUsers[0]
      ? await bcrypt.compare(professional.password, demoUsers[0].senha_hash)
      : false;
    if (!credentialsAreValid) throw new Error("As credenciais de demonstração não foram gravadas corretamente.");

    const [totals] = await connection.query(
      "SELECT (SELECT COUNT(*) FROM pacientes) AS pacientes, "
        + "(SELECT COUNT(*) FROM agendamentos) AS agendamentos, "
        + "(SELECT COUNT(*) FROM atendimentos) AS atendimentos, "
        + "(SELECT COUNT(*) FROM lista_espera) AS lista_espera, "
        + "(SELECT COUNT(*) FROM whatsapp_mensagens) AS mensagens",
    );

    await connection.commit();
    console.log("Dados de demonstração carregados com sucesso.");
    console.log("Registros no banco local: " + JSON.stringify(totals[0]));
    console.log("Login de demonstração: ana@fisiocare.demo");
    console.log("Senha de demonstração: " + professional.password);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await db.end();
  }
}

main().catch((error) => {
  console.error("Falha ao carregar dados de demonstração:", error.message);
  process.exit(1);
});
