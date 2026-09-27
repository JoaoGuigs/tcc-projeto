import { z } from "zod";
import { onlyDigits } from "../utils/phone";

export const patientSchema = z.object({
  nome_completo: z
    .string()
    .trim()
    .min(5, "Informe o nome completo (mínimo 5 letras)")
    .refine((v) => v.includes(" "), "Informe nome e sobrenome")
    .refine((v) => v.length <= 180, "Nome muito longo"),
  celular: z
    .string()
    .trim()
    .min(1, "O número de celular é obrigatório")
    .refine((v) => {
      const digits = onlyDigits(v);
      return digits.length >= 10 && digits.length <= 13;
    }, "Digite um número válido com DDD (DDI 55 opcional)"),
  profissao: z.string().trim().max(120).optional().nullable(),
  convenio_id: z.union([z.string(), z.number()]).optional().nullable(),
  numero_carteirinha: z.string().trim().max(80).optional().nullable(),
  descricao_problema: z.string().trim().max(5000).optional().nullable(),
});

export function validatePatient(form) {
  const result = patientSchema.safeParse(form);
  if (result.success) return { ok: true, data: result.data, errors: {} };
  const errors = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path?.[0] || "form");
    if (!errors[field]) errors[field] = issue.message;
  }
  return { ok: false, data: null, errors };
}

export function toPatientPayload(form) {
  return {
    nome_completo: String(form.nome_completo || "").trim(),
    celular: onlyDigits(form.celular),
    convenio_id: form.convenio_id ? Number(form.convenio_id) : null,
    numero_carteirinha: String(form.numero_carteirinha || "").trim() || null,
    descricao_problema: String(form.descricao_problema || "").trim() || null,
    profissao: String(form.profissao || "").trim() || null,
  };
}
