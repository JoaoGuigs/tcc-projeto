import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck2,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Search,
  UserRound,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { PageHeader } from "../components/PageHeader";
import api from "../services/api";

dayjs.locale("pt-br");

const STEPS = [
  { id: 1, label: "Paciente", hint: "Quem foi atendido" },
  { id: 2, label: "Consulta", hint: "Qual sessão registrar" },
  { id: 3, label: "Evolução", hint: "Registrar e salvar" },
];

const fieldClass =
  "w-full rounded-[10px] border border-border bg-[#fbfaf8] px-4 py-3 text-sm font-semibold text-ink outline-none transition placeholder:font-normal placeholder:text-muted focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10";

function ProgressStepper({ current, onNavigate, canOpen }) {
  return (
    <nav aria-label="Etapas do atendimento" className="rounded-2xl border border-border bg-white px-4 py-4 sm:px-6">
      <p className="mb-3 text-sm font-semibold text-muted">Etapa {current} de {STEPS.length}</p>
      <ol className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        {STEPS.map((step, index) => {
          const done = current > step.id;
          const active = current === step.id;
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate(step.id)}
                disabled={!canOpen[step.id] || active}
                aria-current={active ? "step" : undefined}
                aria-label={`Ir para etapa ${step.id}: ${step.label}`}
                className={`flex min-h-[56px] min-w-0 flex-1 items-center gap-3 rounded-[13px] border px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${!active && canOpen[step.id] ? "cursor-pointer hover:border-primary hover:bg-primary-soft hover:text-primary active:bg-primary-soft/80" : "cursor-default"} ${
                  active
                    ? "border-primary bg-primary-soft"
                    : done
                      ? "border-primary/30 bg-white"
                      : "border-border bg-canvas"
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    done
                      ? "bg-primary text-white"
                      : active
                        ? "border-2 border-primary bg-white text-primary"
                        : "bg-white text-muted"
                  }`}
                >
                  {done ? <Check size={16} strokeWidth={2.5} aria-hidden="true" /> : step.id}
                </span>
                <span className="min-w-0">
                  <span className={`block truncate text-sm font-bold ${active || done ? "text-ink" : "text-muted"}`}>
                    {step.label}
                  </span>
                  <span className="block truncate text-xs text-muted">{step.hint}</span>
                </span>
              </button>
              {index < STEPS.length - 1 && (
                <ChevronRight size={16} className="hidden shrink-0 text-border sm:block" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function PatientBanner({ patient, appointment, onChangePatient }) {
  if (!patient) return null;
  const when = appointment ? dayjs(appointment.data_hora) : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white px-5 py-4">
      <div className="flex min-w-0 items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <UserRound size={22} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-ink">{patient.nome_completo}</p>
          <p className="truncate text-sm text-muted">
            {patient.celular || "Sem telefone"}
            {patient.nome_convenio ? ` · ${patient.nome_convenio}` : ""}
            {when ? ` · ${when.format("DD/MM/YYYY [às] HH:mm")}` : ""}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onChangePatient}
        className="min-h-11 cursor-pointer rounded-[11px] border border-border px-4 py-2 text-sm font-bold text-ink transition-colors hover:border-primary/40 hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Trocar paciente
      </button>
    </div>
  );
}

function formatAppointment(item) {
  const date = dayjs(item.data_hora);
  const relation = date.isAfter(dayjs())
    ? "Próxima consulta"
    : date.isSame(dayjs(), "day")
      ? "Consulta de hoje"
      : "Pendente de registro";
  return { date, relation };
}

export default function RegistrarAtendimentoPage() {
  const { setPageTitle } = useOutletContext();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const initialPatientId = searchParams.get("pacienteId");
  const initialAppointmentId = searchParams.get("agendamentoId");
  const initialPatientApplied = useRef(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [term, setTerm] = useState("");
  const [patient, setPatient] = useState(null);
  const [appointmentId, setAppointmentId] = useState(initialAppointmentId || "");
  const [evolution, setEvolution] = useState("");
  const [procedures, setProcedures] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => setPageTitle("Registrar atendimento"), [setPageTitle]);

  const { data: patients = [], isPending: loadingPatients } = useQuery({
    queryKey: ["pacientes"],
    queryFn: async () => (await api.get("/pacientes")).data,
  });

  const recentRange = useMemo(() => ({
    dataInicio: dayjs().subtract(30, "day").format("YYYY-MM-DD"),
    dataFim: dayjs().format("YYYY-MM-DD"),
    semAtendimento: true,
    limite: 100,
  }), []);
  const recentAppointmentsQuery = useQuery({
    queryKey: ["recent-pending-attendances", recentRange],
    enabled: !patient,
    queryFn: async () => (await api.get("/agendamentos", { params: recentRange })).data,
  });

  useEffect(() => {
    if (!initialPatientId || !patients.length || initialPatientApplied.current) return;
    initialPatientApplied.current = true;
    const found = patients.find((item) => String(item.id) === String(initialPatientId));
    if (found) {
      setPatient(found);
      setTerm(found.nome_completo);
      setCurrentStep(2);
    }
  }, [initialPatientId, patients]);

  const { data: appointments = [], isPending: loadingAppointments } = useQuery({
    queryKey: ["pending-attendance", patient?.id],
    enabled: Boolean(patient?.id),
    queryFn: async () =>
      (
        await api.get("/agendamentos", {
          params: { pacienteId: patient.id, semAtendimento: true, limite: 100 },
        })
      ).data,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["attendance-history", patient?.id],
    enabled: Boolean(patient?.id),
    queryFn: async () => (await api.get(`/atendimentos/paciente/${patient.id}`)).data,
  });

  const filteredPatients = useMemo(() => {
    const value = term.trim().toLowerCase();
    if (patient || value.length < 2) return [];
    return patients
      .filter(
        (item) =>
          item.nome_completo.toLowerCase().includes(value) || item.celular?.includes(value),
      )
      .slice(0, 8);
  }, [patient, patients, term]);

  const recentPatients = useMemo(() => {
    const patientsById = new Map(patients.map((item) => [String(item.id), item]));
    const latestByPatient = new Map();
    for (const appointment of recentAppointmentsQuery.data || []) {
      if (appointment.status === "Cancelado" || appointment.atendimento_id || dayjs(appointment.data_hora).isAfter(dayjs())) continue;
      const person = patientsById.get(String(appointment.paciente_id));
      if (!person) continue;
      const previous = latestByPatient.get(String(person.id));
      if (!previous || dayjs(appointment.data_hora).isAfter(previous.data_hora)) {
        latestByPatient.set(String(person.id), { patient: person, appointment });
      }
    }
    return [...latestByPatient.values()]
      .sort((a, b) => dayjs(b.appointment.data_hora).valueOf() - dayjs(a.appointment.data_hora).valueOf())
      .slice(0, 5);
  }, [patients, recentAppointmentsQuery.data]);

  const validAppointments = useMemo(
    () =>
      appointments
        .filter((item) => item.status !== "Cancelado" && !item.atendimento_id)
        .sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora)),
    [appointments],
  );

  const selectedAppointment = validAppointments.find(
    (item) => String(item.id) === String(appointmentId),
  );

  function navigateStep(step) {
    if (step === 1 || (step === 2 && patient) || (step === 3 && selectedAppointment)) setCurrentStep(step);
  }

  function selectPatient(item) {
    setPatient(item);
    setTerm(item.nome_completo);
    setAppointmentId("");
    setCurrentStep(2);
    setEvolution("");
    setProcedures("");
    setMessage(null);
  }

  function changePatient() {
    if ((evolution.trim() || procedures.trim()) && !window.confirm("Trocar de paciente vai descartar o texto ainda não salvo. Deseja continuar?")) return;
    resetPatient();
  }

  function selectAppointment(item) {
    if (String(item.id) === String(appointmentId)) return;
    if ((evolution.trim() || procedures.trim()) && !window.confirm("Trocar de consulta vai descartar o texto ainda não salvo. Deseja continuar?")) return;
    setAppointmentId(String(item.id));
    setEvolution("");
    setProcedures("");
    setMessage(null);
  }

  function resetPatient() {
    setPatient(null);
    setTerm("");
    setAppointmentId("");
    setCurrentStep(1);
    setEvolution("");
    setProcedures("");
    setMessage(null);
  }

  async function save(event) {
    event.preventDefault();
    if (!appointmentId || (!evolution.trim() && !procedures.trim())) {
      return setMessage({
        tone: "error",
        text: "Preencha a evolução clínica ou os procedimentos realizados.",
      });
    }
    setSaving(true);
    setMessage(null);
    try {
      await api.post("/atendimentos", {
        agendamento_id: Number(appointmentId),
        evolucao_clinica: evolution,
        procedimentos_realizados: procedures,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pending-attendance", patient.id] }),
        queryClient.invalidateQueries({ queryKey: ["attendance-history", patient.id] }),
        queryClient.invalidateQueries({ queryKey: ["agenda"] }),
        queryClient.invalidateQueries({ queryKey: ["pacientes-agenda"] }),
        queryClient.invalidateQueries({ queryKey: ["recent-pending-attendances"] }),
      ]);
      setEvolution("");
      setProcedures("");
      setAppointmentId("");
      setCurrentStep(2);
      setMessage({ tone: "success", text: "Atendimento registrado e consulta concluída." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error.userMessage || "Não foi possível registrar o atendimento.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-5">
      <PageHeader eyebrow="Atendimentos" title="Registrar atendimento" showActions={false} />

      <ProgressStepper current={currentStep} onNavigate={navigateStep} canOpen={{ 1: true, 2: Boolean(patient), 3: Boolean(selectedAppointment) }} />

      {message && (
        <div
          role={message.tone === "error" ? "alert" : "status"}
          className={`rounded-2xl px-4 py-3 text-sm font-bold ${
            message.tone === "error"
              ? "bg-[#f1ddda] text-[#75413d]"
              : "bg-primary-soft text-primary"
          }`}
        >
          {message.text}
        </div>
      )}

      {patient && currentStep !== 1 && (
        <PatientBanner
          patient={patient}
          appointment={selectedAppointment}
          onChangePatient={changePatient}
        />
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0 space-y-5">
          {currentStep === 1 && (
            <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
              <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink">
                Quem foi atendido?
              </h2>
              <p className="mt-1 mb-5 text-sm text-muted">
                Busque pelo nome ou telefone para abrir o prontuário da sessão.
              </p>

              {patient ? (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-[13px] bg-primary-soft p-4">
                  <div className="min-w-0"><strong className="block text-base text-ink">{patient.nome_completo}</strong><span className="text-sm text-muted">Paciente selecionado para este atendimento</span></div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={changePatient} className="min-h-11 cursor-pointer rounded-[11px] border border-border bg-white px-4 text-sm font-bold text-ink transition-colors hover:border-primary/40 hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Trocar paciente</button>
                    <button type="button" onClick={() => setCurrentStep(2)} className="min-h-11 cursor-pointer rounded-[11px] bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-[#245a54] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Continuar para consulta</button>
                  </div>
                </div>
              ) : <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  className={`${fieldClass} pl-11`}
                  value={term}
                  onChange={(e) => {
                    setTerm(e.target.value);
                  }}
                  placeholder="Digite o nome do paciente…"
                  autoFocus
                  aria-label="Buscar paciente"
                />
                {filteredPatients.length > 0 && (
                  <ul className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-[13px] border border-border bg-white shadow-lg">
                    {filteredPatients.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => selectPatient(item)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-primary-soft"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                              <UserRound size={16} />
                            </span>
                            <strong className="truncate text-sm text-ink">{item.nome_completo}</strong>
                          </span>
                          <span className="shrink-0 text-xs text-muted">{item.celular || "—"}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>}

              {loadingPatients && <p className="mt-3 text-xs text-muted">Carregando pacientes…</p>}
              {!loadingPatients && term.trim().length >= 2 && filteredPatients.length === 0 && !patient && (
                <p className="mt-4 rounded-[13px] bg-canvas px-4 py-3 text-sm text-muted">
                  Nenhum paciente encontrado. Cadastre com “Novo paciente” no topo.
                </p>
              )}

              {!term.trim() && (
                <div className="mt-6 border-t border-border pt-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                      <Clock3 size={19} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-ink">Atendimentos recentes</h3>
                      <p className="mt-0.5 text-sm text-muted">Consultas dos últimos 30 dias sem evolução registrada.</p>
                    </div>
                  </div>

                  {recentAppointmentsQuery.isPending && (
                    <p role="status" className="mt-4 text-sm text-muted">Buscando atendimentos pendentes…</p>
                  )}
                  {recentAppointmentsQuery.isError && (
                    <p role="alert" className="mt-4 text-sm text-[#75413d]">
                      Não foi possível carregar os atendimentos recentes. {" "}
                      <button type="button" onClick={() => recentAppointmentsQuery.refetch()} className="font-bold underline">
                        Tentar novamente
                      </button>
                    </p>
                  )}
                  {recentAppointmentsQuery.isSuccess && recentPatients.length === 0 && (
                    <p className="mt-4 rounded-xl bg-canvas px-4 py-3 text-sm text-muted">
                      Nenhuma consulta recente aguardando registro. Você também pode buscar um paciente pelo nome ou telefone.
                    </p>
                  )}
                  {recentPatients.length > 0 && (
                    <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                      {recentPatients.map(({ patient: recentPatient, appointment }) => (
                        <li key={recentPatient.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setPatient(recentPatient);
                              setTerm(recentPatient.nome_completo);
                              setAppointmentId(String(appointment.id));
                              setCurrentStep(2);
                              setMessage(null);
                            }}
                            aria-label={`Continuar atendimento de ${recentPatient.nome_completo}, ${dayjs(appointment.data_hora).format("DD/MM/YYYY [às] HH:mm")}`}
                            className="flex min-h-[76px] w-full items-center gap-3 rounded-xl bg-canvas px-3 text-left transition hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          >
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-canvas text-sm font-bold text-primary">
                              {recentPatient.nome_completo.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1">
                              <strong className="block truncate text-sm text-ink">{recentPatient.nome_completo}</strong>
                              <span className="mt-0.5 block text-xs text-muted">
                                {dayjs(appointment.data_hora).format("DD/MM [às] HH:mm")} · {appointment.tipo_consulta || "Consulta"}
                              </span>
                            </span>
                            <ChevronRight size={18} className="shrink-0 text-primary" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>
          )}

          {currentStep === 2 && patient && (
            <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
              <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink">
                Qual consulta deseja registrar?
              </h2>
              <p className="mt-1 mb-5 text-sm text-muted">
                Selecione a sessão correspondente para manter o histórico correto.
              </p>

              {loadingAppointments && <p className="text-sm text-muted">Buscando consultas…</p>}

              <div className="space-y-2">
                {validAppointments.map((item) => {
                  const info = formatAppointment(item);
                  const selected = String(item.id) === String(appointmentId);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectAppointment(item)}
                      aria-pressed={selected}
                      className={`flex w-full items-center gap-4 rounded-[13px] border px-4 py-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                        selected
                          ? "border-primary bg-primary-soft"
                          : "border-border bg-canvas hover:border-primary/40 hover:bg-white"
                      }`}
                    >
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-[11px] ${
                          selected ? "bg-primary text-white" : "bg-white text-primary"
                        }`}
                      >
                        <CalendarCheck2 size={19} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block text-sm text-ink">
                          {info.date.format("DD/MM/YYYY [às] HH:mm")}
                        </strong>
                        <span className="text-xs text-muted">
                          {item.tipo_consulta} · {info.relation}
                        </span>
                      </span>
                      {selected ? (
                        <Check size={19} className="shrink-0 text-primary" />
                      ) : (
                        <ChevronRight size={18} className="shrink-0 text-muted" />
                      )}
                    </button>
                  );
                })}
              </div>

              {!loadingAppointments && validAppointments.length === 0 && (
                <div className="rounded-[13px] border border-dashed border-border bg-canvas px-6 py-8 text-center">
                  <strong className="block text-ink">Nenhuma consulta pendente</strong>
                  <p className="mt-1 text-sm text-muted">
                    Este paciente não possui atendimento para registrar.
                  </p>
                  <Link
                    to={`/agendar?pacienteId=${patient.id}`}
                    className="mt-4 inline-flex text-sm font-bold text-primary hover:underline"
                  >
                    Marcar uma consulta →
                  </Link>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-bold text-ink transition hover:bg-canvas"
                >
                  <ChevronLeft size={16} />
                  Voltar
                </button>
                {validAppointments.length > 0 && (
                  <button
                    type="button"
                    disabled={!selectedAppointment}
                    onClick={() => setCurrentStep(3)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[11px] bg-primary px-5 text-sm font-bold text-white transition hover:bg-[#245a54] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continuar para evolução <ChevronRight size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            </section>
          )}

          {currentStep === 3 && selectedAppointment && (
            <form
              onSubmit={save}
              className="rounded-2xl border border-border bg-white p-5 shadow-[0_1px_0_rgba(31,42,36,0.04)] sm:p-6"
            >
              <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink">
                Como foi o atendimento?
              </h2>
              <p className="mt-1 mb-5 text-sm text-muted">
                Registre apenas as informações clínicas necessárias para acompanhar a evolução.
              </p>

              {dayjs(selectedAppointment.data_hora).isAfter(dayjs().endOf("day")) && (
                <div className="mb-4 rounded-[13px] border border-[#d8d2c7] bg-[#f5e9cc] px-4 py-3 text-sm text-[#7b4e0b]">
                  Esta consulta está marcada para uma data futura. Confira se selecionou a sessão correta.
                </div>
              )}

              <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[11px] bg-primary-soft px-4 py-3 text-sm">
                <CalendarCheck2 size={17} className="text-primary" aria-hidden="true" />
                <span className="font-bold text-ink">Consulta selecionada</span>
                <span className="text-muted">{dayjs(selectedAppointment.data_hora).format("DD/MM/YYYY [às] HH:mm")} · {selectedAppointment.tipo_consulta || "Consulta"}</span>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[13px] font-bold text-ink">Evolução clínica</span>
                  <textarea
                    className={`${fieldClass} min-h-35 resize-y font-normal`}
                    value={evolution}
                    onChange={(e) => setEvolution(e.target.value)}
                    placeholder="Ex.: paciente relata redução da dor, melhora de mobilidade…"
                    rows={5}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[13px] font-bold text-ink">Procedimentos realizados</span>
                  <textarea
                    className={`${fieldClass} min-h-25 resize-y font-normal`}
                    value={procedures}
                    onChange={(e) => setProcedures(e.target.value)}
                    placeholder="Ex.: mobilização, exercícios ativos, orientações…"
                    rows={3}
                  />
                </label>

                <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-bold text-ink transition hover:bg-canvas"
                  >
                    <ChevronLeft size={16} />
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || (!evolution.trim() && !procedures.trim())}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[11px] bg-primary px-6 text-sm font-bold text-white shadow-[0_1px_0_rgba(31,42,36,0.08)] transition hover:bg-[#245a54] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ClipboardList size={18} />
                    {saving ? "Salvando…" : "Salvar evolução"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </main>

        <aside className="rounded-2xl border border-border bg-white p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-ink">Histórico recente</h2>
            <p className="mt-1 text-sm text-muted">Consulte registros anteriores sem sair desta etapa.</p>
          </div>

          {!patient && (
            <p className="rounded-[13px] bg-canvas px-4 py-5 text-sm text-muted">
              Selecione um paciente para consultar as evoluções anteriores.
            </p>
          )}

          {patient && history.length === 0 && (
            <p className="rounded-[13px] bg-canvas px-4 py-5 text-sm text-muted">
              Ainda não há atendimentos registrados para este paciente.
            </p>
          )}

          <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
            {history.slice(0, 5).map((item) => (
              <article key={item.atendimento_id} className="rounded-[13px] bg-canvas p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <strong className="text-sm text-ink">
                    {dayjs(item.data_atendimento).format("DD/MM/YYYY")}
                  </strong>
                  <span className="truncate text-xs text-muted">{item.tipo_consulta}</span>
                </div>
                {item.evolucao_clinica && (
                  <p className="line-clamp-3 text-sm leading-5 text-muted">{item.evolucao_clinica}</p>
                )}
                {item.procedimentos_realizados && (
                  <p className="mt-2 text-xs font-semibold text-primary">
                    {item.procedimentos_realizados}
                  </p>
                )}
              </article>
            ))}
          </div>

          {patient && (
            <Link
              to={`/pacientes?perfil=${patient.id}`}
              className="mt-4 block text-center text-sm font-bold text-primary hover:underline"
            >
              Abrir ficha completa →
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
