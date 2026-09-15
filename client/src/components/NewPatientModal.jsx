import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { useConvenios } from "../hooks/useConvenios";
import { formatPhone, onlyDigits } from "../utils/phone";

const EMPTY = {
  nome_completo: "",
  celular: "",
  profissao: "",
  convenio_id: "",
  numero_carteirinha: "",
  descricao_problema: "",
};

const inputClass =
  "h-[46px] w-full rounded-[12px] border border-solid border-border bg-canvas px-4 text-[15px] text-ink outline-none placeholder:text-muted focus:border-primary";
const inputErrorClass = "border-[#C62828] focus:border-[#C62828]";

function Field({ label, error, hint, children }) {
  return (
    <label className="flex flex-col gap-[6px]">
      <span className="text-sm font-semibold leading-[18px] text-ink">{label}</span>
      {children}
      {error ? (
        <span className="text-xs leading-[16px] text-[#C62828]">{error}</span>
      ) : hint ? (
        <span className="text-xs leading-[16px] text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

function Chevron() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m6 9 6 6 6-6" fill="none" stroke="#66736c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NewPatientModal({ open, onClose, onCreated }) {
  const queryClient = useQueryClient();
  const { data: convenios = [] } = useConvenios();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState("");

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setErrors({});
      setFormError("");
      setSaving(false);
      setCreated("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setFormError("");
  };

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    const nome = form.nome_completo.trim();
    const digits = onlyDigits(form.celular);

    if (nome.length < 5) nextErrors.nome_completo = "Informe o nome completo (mínimo 5 letras)";
    else if (!nome.includes(" ")) nextErrors.nome_completo = "Informe nome e sobrenome";
    if (digits.length < 10) nextErrors.celular = "Informe DDD e número de celular";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      await api.post("/pacientes", {
        nome_completo: nome,
        celular: digits,
        convenio_id: form.convenio_id ? Number(form.convenio_id) : null,
        numero_carteirinha: form.numero_carteirinha.trim() || null,
        descricao_problema: form.descricao_problema.trim() || null,
        profissao: form.profissao.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      setCreated(nome);
      onCreated?.(nome);
    } catch (err) {
      setFormError(err.userMessage || "Não foi possível cadastrar o paciente. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-[620px] flex-col overflow-auto rounded-[20px] border border-solid border-border bg-surface p-[22px]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Novo paciente"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-[2px]">
            <h3 className="font-display text-[24px] font-semibold leading-[30px] text-ink">Novo paciente</h3>
            <span className="text-xs leading-[18px] text-muted">
              {created ? "Cadastro concluído" : "Preencha os dados do paciente"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="cursor-pointer rounded-full px-3 py-1 text-sm font-bold text-muted hover:bg-canvas"
          >
            Fechar ✕
          </button>
        </div>

        {created ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-success-soft">
              <svg width="26" height="26" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="#2f6f68" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="font-display text-[22px] font-semibold leading-[28px] text-ink">Paciente cadastrado!</p>
            <p className="text-sm leading-[20px] text-muted">
              <strong className="text-ink">{created}</strong> já está na sua lista de pacientes.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex h-[46px] cursor-pointer items-center justify-center rounded-full bg-primary px-[24px] text-sm font-bold text-surface transition-colors hover:bg-[#245a54]"
            >
              Concluir
            </button>
          </div>
        ) : (
          <form className="mt-[18px] flex flex-col gap-[14px]" onSubmit={handleSubmit}>
            <Field label="Nome completo" error={errors.nome_completo}>
              <input
                name="nome_completo"
                value={form.nome_completo}
                onChange={(event) => setField("nome_completo", event.target.value)}
                placeholder="Ex.: Maria Oliveira"
                maxLength={180}
                autoFocus
                className={`${inputClass} ${errors.nome_completo ? inputErrorClass : ""}`}
              />
            </Field>

            <div className="grid gap-[14px] sm:grid-cols-2">
              <Field label="Celular" error={errors.celular} hint="DDD + número">
                <input
                  name="celular"
                  value={form.celular}
                  onChange={(event) => setField("celular", formatPhone(event.target.value))}
                  placeholder="(48) 99999-0000"
                  inputMode="tel"
                  className={`${inputClass} ${errors.celular ? inputErrorClass : ""}`}
                />
              </Field>
              <Field label="Profissão">
                <input
                  name="profissao"
                  value={form.profissao}
                  onChange={(event) => setField("profissao", event.target.value)}
                  placeholder="Ex.: Professora"
                  maxLength={120}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-[14px] sm:grid-cols-2">
              <Field label="Convênio" hint="Deixe em particular se não houver">
                <span className="relative flex">
                  <select
                    name="convenio_id"
                    value={form.convenio_id}
                    onChange={(event) => setField("convenio_id", event.target.value)}
                    className={`${inputClass} cursor-pointer appearance-none pr-10`}
                  >
                    <option value="">Particular (sem convênio)</option>
                    {convenios.map((convenio) => (
                      <option key={convenio.id} value={convenio.id}>
                        {convenio.nome_convenio}
                      </option>
                    ))}
                  </select>
                  <Chevron />
                </span>
              </Field>
              <Field label="Número da carteirinha">
                <input
                  name="numero_carteirinha"
                  value={form.numero_carteirinha}
                  onChange={(event) => setField("numero_carteirinha", event.target.value.replace(/\D/g, ""))}
                  placeholder="Somente números"
                  inputMode="numeric"
                  maxLength={80}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Descrição do problema" hint="Queixa principal, região e tempo de dor">
              <textarea
                name="descricao_problema"
                value={form.descricao_problema}
                onChange={(event) => setField("descricao_problema", event.target.value)}
                placeholder="Ex.: Dor lombar há 3 semanas, piora ao sentar"
                rows={3}
                className="min-h-[92px] w-full resize-y rounded-[12px] border border-solid border-border bg-canvas px-4 py-3 text-[15px] leading-[22px] text-ink outline-none placeholder:text-muted focus:border-primary"
              />
            </Field>

            {formError && (
              <p className="rounded-[12px] bg-[#FBEAEA] px-4 py-3 text-sm leading-[20px] text-[#C62828]">{formError}</p>
            )}

            <div className="flex items-center justify-end gap-[10px] pt-1">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-[46px] cursor-pointer items-center justify-center rounded-full border border-solid border-border bg-surface px-[18px] text-sm font-semibold leading-[18px] text-ink hover:bg-canvas"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-[46px] cursor-pointer items-center justify-center rounded-full bg-primary px-[18px] text-sm font-bold leading-[18px] text-surface transition-colors hover:bg-[#245a54] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "Salvando..." : "Salvar paciente"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
