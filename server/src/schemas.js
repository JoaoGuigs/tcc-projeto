const { z } = require("zod");

const id = z.coerce.number().int().positive();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato YYYY-MM-DD");
const dateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/, "Data e hora inválidas");
const optionalText = z.string().trim().max(5000).optional().nullable();

module.exports = {
  idParams: z.object({ id }),
  patientIdParams: z.object({ pacienteId: id }),
  login: z.object({ email: z.string().trim().toLowerCase().email(), senha: z.string().min(8).max(128) }),
  professional: z.object({
    nome: z.string().trim().min(3).max(150),
    email: z.string().trim().toLowerCase().email(),
    senha: z.string().min(8).max(128),
    registro_profissional: z.string().trim().min(3).max(80),
    especialidade: z.string().trim().min(2).max(120),
  }),
  patient: z.object({
    nome_completo: z.string().trim().min(5).max(180).refine((value) => value.includes(" "), "Informe nome e sobrenome"),
    celular: z.string().trim().min(10).max(20),
    convenio_id: id.optional().nullable(),
    numero_carteirinha: z.string().trim().max(80).optional().nullable(),
    descricao_problema: optionalText,
    profissao: z.string().trim().max(120).optional().nullable(),
  }),
  patientQuery: z.object({ nome: z.string().trim().min(3).max(100).optional() }),
  appointmentQuery: z.object({
    pacienteId: id.optional(), dataInicio: date.optional(), dataFim: date.optional(),
    semAtendimento: z.enum(["true", "false", "1", "0"]).optional(),
    limite: z.coerce.number().int().min(1).max(200).default(100),
  }).refine((value) => !value.dataInicio || !value.dataFim || value.dataInicio <= value.dataFim, {
    message: "Data inicial deve ser anterior à data final", path: ["dataFim"],
  }),
  availableTimesQuery: z.object({ data: date, profissional_id: id }),
  appointment: z.object({
    paciente_id: id, profissional_id: id, data_hora: dateTime,
    tipo_consulta: z.string().trim().max(120).default("Consulta Padrão"),
    observacoes: optionalText, status: z.enum(["Agendado", "Confirmado"]).default("Agendado"),
  }),
  appointmentUpdate: z.object({
    data_hora: dateTime.optional(),
    tipo_consulta: z.string().trim().min(2).max(120).optional(),
    observacoes: optionalText,
    status: z.enum(["Agendado", "Confirmado", "Chegou", "Faltou"]).optional(),
  }).refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "Informe ao menos uma alteração",
  }),
  waitlist: z.object({
    paciente_id: id,
    data_preferida: date.optional().nullable(),
    periodo: z.enum(["Qualquer horário", "Manhã", "Tarde"]).default("Qualquer horário"),
    observacoes: z.string().trim().max(500).optional().nullable(),
  }),
  waitlistUpdate: z.object({
    status: z.enum(["Aguardando", "Contatado", "Agendado", "Removido"]),
  }),
  attendance: z.object({
    agendamento_id: id,
    evolucao_clinica: optionalText,
    procedimentos_realizados: optionalText,
  }).refine((value) => value.evolucao_clinica || value.procedimentos_realizados, {
    message: "Preencha a evolução clínica ou os procedimentos realizados",
  }),
  convenio: z.object({ nome_convenio: z.string().trim().min(2).max(150) }),
  clinic: z.object({
    nome_clinica: z.string().trim().min(2).max(180), cnpj: z.string().trim().max(20),
    telefone: z.string().trim().max(20), email: z.string().trim().email(),
  }),
  message: z.object({ titulo: z.string().trim().min(2).max(150), mensagem: z.string().trim().min(2).max(2000) }),
  whatsappSend: z.object({
    numero: z.string().trim().regex(/^\d{10,15}$/, "Informe DDI, DDD e número (somente dígitos)"),
    texto: z.string().trim().min(1).max(2000),
  }),
  whatsappTemplateSend: z.object({
    numero: z.string().trim().regex(/^\d{10,15}$/, "Informe DDI, DDD e número (somente dígitos)"),
    nome_template: z.string().trim().regex(/^[a-z0-9_]{1,512}$/, "Nome de template inválido"),
    idioma: z.string().trim().regex(/^[a-z]{2,3}_[A-Z]{2}$/).default("pt_BR"),
    parametros: z.array(z.string().trim().max(1024)).max(20).default([]),
  }),
  whatsappNumeroParams: z.object({
    numero: z.string().trim().regex(/^\d{10,15}$/, "Número inválido"),
  }),
};
