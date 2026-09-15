import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck2, Check, ChevronRight, ClipboardList, Search, UserRound } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { PageHeader } from "../components/PageHeader";
import api from "../services/api";

dayjs.locale("pt-br");
const fieldClass = "w-full rounded-2xl border border-border bg-white p-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10";

function Step({ number, label, active, done }) {
  return <div className={`flex items-center gap-3 rounded-2xl border p-3 ${active ? "border-primary bg-primary-soft" : "border-border bg-white"}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${done ? "bg-primary text-white" : active ? "border border-primary text-primary" : "bg-canvas text-muted"}`}>{done ? <Check size={16} /> : number}</span><span className={`text-sm font-bold ${active ? "text-primary" : "text-muted"}`}>{label}</span></div>;
}

function formatAppointment(item) {
  const date = dayjs(item.data_hora);
  const relation = date.isAfter(dayjs()) ? "Próxima consulta" : date.isSame(dayjs(), "day") ? "Consulta de hoje" : "Pendente de registro";
  return { date, relation };
}

export default function RegistrarAtendimentoPage() {
  const { setPageTitle } = useOutletContext();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const initialPatientId = searchParams.get("pacienteId");
  const initialAppointmentId = searchParams.get("agendamentoId");
  const [term, setTerm] = useState("");
  const [patient, setPatient] = useState(null);
  const [appointmentId, setAppointmentId] = useState(initialAppointmentId || "");
  const [evolution, setEvolution] = useState("");
  const [procedures, setProcedures] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  useEffect(() => setPageTitle("Registrar atendimento"), [setPageTitle]);

  const { data: patients = [], isPending: loadingPatients } = useQuery({ queryKey: ["pacientes"], queryFn: async () => (await api.get("/pacientes")).data });
  useEffect(() => { if (!initialPatientId || !patients.length || patient) return; const found = patients.find((item) => String(item.id) === String(initialPatientId)); if (found) { setPatient(found); setTerm(found.nome_completo); } }, [initialPatientId, patient, patients]);
  const { data: appointments = [], isPending: loadingAppointments } = useQuery({ queryKey: ["pending-attendance", patient?.id], enabled: Boolean(patient?.id), queryFn: async () => (await api.get("/agendamentos", { params: { pacienteId: patient.id, semAtendimento: true, limite: 100 } })).data });
  const { data: history = [] } = useQuery({ queryKey: ["attendance-history", patient?.id], enabled: Boolean(patient?.id), queryFn: async () => (await api.get(`/atendimentos/paciente/${patient.id}`)).data });
  const filteredPatients = useMemo(() => { const value = term.trim().toLowerCase(); if (patient || value.length < 2) return []; return patients.filter((item) => item.nome_completo.toLowerCase().includes(value) || item.celular?.includes(value)).slice(0, 8); }, [patient, patients, term]);
  const validAppointments = useMemo(() => appointments.filter((item) => item.status !== "Cancelado" && !item.atendimento_id).sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora)), [appointments]);
  const selectedAppointment = validAppointments.find((item) => String(item.id) === String(appointmentId));
  const currentStep = !patient ? 1 : !appointmentId ? 2 : 3;

  function selectPatient(item) { setPatient(item); setTerm(item.nome_completo); setAppointmentId(""); setMessage(null); }
  function resetPatient() { setPatient(null); setTerm(""); setAppointmentId(""); setEvolution(""); setProcedures(""); }
  async function save(event) {
    event.preventDefault();
    if (!appointmentId || (!evolution.trim() && !procedures.trim())) return setMessage({ tone: "error", text: "Preencha a evolução clínica ou os procedimentos realizados." });
    setSaving(true); setMessage(null);
    try {
      await api.post("/atendimentos", { agendamento_id: Number(appointmentId), evolucao_clinica: evolution, procedimentos_realizados: procedures });
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["pending-attendance", patient.id] }), queryClient.invalidateQueries({ queryKey: ["attendance-history", patient.id] }), queryClient.invalidateQueries({ queryKey: ["agenda"] }), queryClient.invalidateQueries({ queryKey: ["pacientes-agenda"] })]);
      setEvolution(""); setProcedures(""); setAppointmentId(""); setMessage({ tone: "success", text: "Atendimento registrado e consulta concluída." });
    } catch (error) { setMessage({ tone: "error", text: error.userMessage || "Não foi possível registrar o atendimento." }); }
    finally { setSaving(false); }
  }

  return <div className="flex w-full flex-1 flex-col gap-5">
    <PageHeader eyebrow="Prontuário simples e organizado" title="Registrar atendimento" />
    <div className="grid gap-3 md:grid-cols-3"><Step number="1" label="Escolher paciente" active={currentStep === 1} done={currentStep > 1} /><Step number="2" label="Escolher consulta" active={currentStep === 2} done={currentStep > 2} /><Step number="3" label="Escrever e salvar" active={currentStep === 3} done={false} /></div>
    {message && <div className={`rounded-2xl p-4 text-sm font-bold ${message.tone === "error" ? "bg-[#f7dfdc] text-[#9a3832]" : "bg-success-soft text-primary"}`}>{message.text}</div>}
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <main className="space-y-5">
        <section className="rounded-3xl border border-border bg-white p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Etapa 1</p><h2 className="text-xl font-bold text-ink">Quem foi atendido?</h2></div>{patient && <button onClick={resetPatient} className="text-sm font-bold text-primary">Trocar paciente</button>}</div><div className="relative"><Search className="absolute left-4 top-4 text-muted" size={19} /><input className={`${fieldClass} pl-12`} value={term} onChange={(e) => { setTerm(e.target.value); if (patient) resetPatient(); }} placeholder="Busque pelo nome ou telefone" />{filteredPatients.length > 0 && <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-2xl border border-border bg-white shadow-lg">{filteredPatients.map((item) => <button key={item.id} onClick={() => selectPatient(item)} className="flex w-full items-center justify-between p-4 text-left hover:bg-primary-soft"><span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary"><UserRound size={17} /></span><strong className="text-sm text-ink">{item.nome_completo}</strong></span><span className="text-xs text-muted">{item.celular}</span></button>)}</div>}</div>{loadingPatients && <p className="mt-2 text-xs text-muted">Carregando pacientes…</p>}{patient && <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary-soft p-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-white"><Check size={18} /></span><div><strong className="block text-ink">{patient.nome_completo}</strong><span className="text-xs text-muted">Paciente selecionado</span></div></div>}</section>
        {patient && <section className="rounded-3xl border border-border bg-white p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-wider text-primary">Etapa 2</p><h2 className="text-xl font-bold text-ink">Qual consulta deseja registrar?</h2><p className="mb-4 text-sm text-muted">Selecione a sessão correspondente para manter o histórico correto.</p>{loadingAppointments && <p className="text-sm text-muted">Buscando consultas…</p>}<div className="space-y-2">{validAppointments.map((item) => { const info = formatAppointment(item); const selected = String(item.id) === String(appointmentId); return <button key={item.id} onClick={() => setAppointmentId(item.id)} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left ${selected ? "border-primary bg-primary-soft" : "border-border bg-canvas hover:border-primary/40"}`}><span className={`grid h-11 w-11 place-items-center rounded-xl ${selected ? "bg-primary text-white" : "bg-white text-primary"}`}><CalendarCheck2 size={19} /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-ink">{info.date.format("DD/MM/YYYY [às] HH:mm")}</strong><span className="text-xs text-muted">{item.tipo_consulta} · {info.relation}</span></span>{selected ? <Check size={19} className="text-primary" /> : <ChevronRight size={18} className="text-muted" />}</button>; })}</div>{!loadingAppointments && validAppointments.length === 0 && <div className="rounded-2xl border border-dashed border-border p-6 text-center"><strong className="block text-ink">Nenhuma consulta pendente</strong><span className="text-sm text-muted">Este paciente não possui atendimento para registrar.</span><Link to={`/agendar?pacienteId=${patient.id}`} className="mt-3 block text-sm font-bold text-primary">Marcar uma consulta →</Link></div>}</section>}
        {selectedAppointment && <form onSubmit={save} className="rounded-3xl border border-primary/30 bg-white p-5 shadow-sm sm:p-6"><p className="text-xs font-bold uppercase tracking-wider text-primary">Etapa 3</p><h2 className="text-xl font-bold text-ink">Como foi o atendimento?</h2><p className="mb-5 text-sm text-muted">Registre apenas as informações clínicas necessárias para acompanhar a evolução.</p>{dayjs(selectedAppointment.data_hora).isAfter(dayjs().endOf("day")) && <div className="mb-4 rounded-2xl bg-warning-soft p-4 text-sm text-[#78591d]">Esta consulta está marcada para uma data futura. Confira se selecionou a sessão correta.</div>}<div className="space-y-4"><label className="block text-sm font-bold text-ink">Evolução clínica<textarea className={`${fieldClass} mt-2 min-h-36 resize-y`} value={evolution} onChange={(e) => setEvolution(e.target.value)} placeholder="Ex.: paciente relata redução da dor, melhora de mobilidade…" /></label><label className="block text-sm font-bold text-ink">Procedimentos realizados<textarea className={`${fieldClass} mt-2 min-h-28 resize-y`} value={procedures} onChange={(e) => setProcedures(e.target.value)} placeholder="Ex.: mobilização, exercícios ativos, orientações…" /></label><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setAppointmentId("")} className="h-12 rounded-full border border-border px-5 text-sm font-bold text-ink">Voltar</button><button disabled={saving || (!evolution.trim() && !procedures.trim())} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white disabled:opacity-40"><ClipboardList size={18} />{saving ? "Salvando…" : "Salvar e concluir atendimento"}</button></div></div></form>}
      </main>
      <aside className="rounded-3xl border border-border bg-white p-5"><div className="mb-4"><p className="text-xs font-bold uppercase tracking-wider text-primary">Contexto</p><h2 className="text-lg font-bold text-ink">Histórico recente</h2></div>{!patient && <p className="rounded-2xl bg-canvas p-5 text-sm text-muted">Selecione um paciente para consultar as evoluções anteriores.</p>}{patient && history.length === 0 && <p className="rounded-2xl bg-canvas p-5 text-sm text-muted">Ainda não há atendimentos registrados para este paciente.</p>}<div className="space-y-3">{history.slice(0, 5).map((item) => <article key={item.atendimento_id} className="rounded-2xl bg-canvas p-4"><div className="mb-2 flex items-center justify-between"><strong className="text-sm text-ink">{dayjs(item.data_atendimento).format("DD/MM/YYYY")}</strong><span className="text-xs text-muted">{item.tipo_consulta}</span></div>{item.evolucao_clinica && <p className="line-clamp-3 text-sm leading-5 text-muted">{item.evolucao_clinica}</p>}{item.procedimentos_realizados && <p className="mt-2 text-xs text-primary">{item.procedimentos_realizados}</p>}</article>)}</div>{patient && <Link to={`/pacientes?perfil=${patient.id}`} className="mt-4 block text-center text-sm font-bold text-primary">Abrir ficha completa →</Link>}</aside>
    </div>
  </div>;
}
