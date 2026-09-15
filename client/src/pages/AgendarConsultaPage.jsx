import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clock3, MessageCircleMore, Plus, UserRound, UsersRound, X } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../auth/AuthContext";
import api from "../services/api";

dayjs.locale("pt-br");

const STATUSES = ["Agendado", "Confirmado", "Chegou", "Faltou"];
const TONES = {
  Agendado: "bg-warning-soft text-[#78591d]",
  Confirmado: "bg-success-soft text-primary",
  Chegou: "bg-arrived-soft text-[#6b4c89]",
  Concluído: "bg-done-soft text-ink",
  Faltou: "bg-[#f7dfdc] text-[#9a3832]",
};
const inputClass = "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";

function mondayOf(date) {
  return date.startOf("day").subtract((date.day() + 6) % 7, "day");
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#14201c]/45 p-4" onMouseDown={onClose}>
      <section className={`max-h-[92vh] w-full overflow-y-auto rounded-3xl border border-border bg-canvas p-5 shadow-2xl sm:p-6 ${wide ? "max-w-3xl" : "max-w-xl"}`} onMouseDown={(event) => event.stopPropagation()}>
        <header className="mb-5 flex items-start justify-between gap-4">
          <div><h2 className="text-2xl font-bold leading-tight text-ink">{title}</h2>{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}</div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-white text-muted hover:text-ink"><X size={17} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}

function PatientPicker({ patients, selected, onSelect }) {
  const [term, setTerm] = useState(selected?.nome_completo || "");
  const matches = useMemo(() => {
    const value = term.trim().toLowerCase();
    if (selected || value.length < 2) return [];
    return patients.filter((patient) => patient.nome_completo.toLowerCase().includes(value) || patient.celular?.includes(value)).slice(0, 6);
  }, [patients, selected, term]);

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-bold text-ink">Paciente</label>
      <div className="relative"><UserRound className="absolute left-3 top-3 text-muted" size={18} /><input className={`${inputClass} pl-10`} value={term} placeholder="Digite o nome ou telefone" onChange={(event) => { setTerm(event.target.value); onSelect(null); }} /></div>
      {selected && <button type="button" onClick={() => { setTerm(""); onSelect(null); }} className="mt-2 text-xs font-bold text-primary">Trocar paciente</button>}
      {matches.length > 0 && <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg">{matches.map((patient) => <button key={patient.id} type="button" onClick={() => { onSelect(patient); setTerm(patient.nome_completo); }} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-primary-soft"><strong>{patient.nome_completo}</strong><span className="text-xs text-muted">{patient.celular}</span></button>)}</div>}
      {!selected && term.trim().length >= 2 && matches.length === 0 && <p className="mt-2 text-xs text-muted">Nenhum paciente encontrado. Cadastre-o primeiro pelo botão no topo.</p>}
    </div>
  );
}

function AppointmentForm({ item, initialDay, initialTime, initialPatient, patients, onClose, onDone, notify }) {
  const { user } = useAuth();
  const [patient, setPatient] = useState(initialPatient || (item ? patients.find((p) => String(p.id) === String(item.paciente_id)) : null));
  const [date, setDate] = useState(dayjs(item?.data_hora || initialDay || dayjs()).format("YYYY-MM-DD"));
  const [time, setTime] = useState(initialTime || (item ? dayjs(item.data_hora).format("HH:mm") : ""));
  const [type, setType] = useState(item?.tipo_consulta || "Consulta de fisioterapia");
  const [notes, setNotes] = useState(item?.observacoes || "");
  const [saving, setSaving] = useState(false);
  const { data: slots = [], isPending } = useQuery({
    queryKey: ["available-times", date, user?.profissional_id],
    enabled: Boolean(date && user?.profissional_id),
    queryFn: async () => (await api.get("/agendamentos/horarios-disponiveis", { params: { data: date, profissional_id: user.profissional_id } })).data,
  });
  const times = useMemo(() => {
    const current = item && dayjs(item.data_hora).format("YYYY-MM-DD") === date ? dayjs(item.data_hora).format("HH:mm") : null;
    return [...new Set([...slots, ...(current ? [current] : [])])].sort();
  }, [item, date, slots]);

  async function save(event) {
    event.preventDefault();
    if (!patient || !date || !time) return notify("Selecione paciente, data e horário.", "error");
    setSaving(true);
    const data_hora = `${date} ${time}:00`;
    try {
      if (item) await api.patch(`/agendamentos/${item.id}`, { data_hora, tipo_consulta: type, observacoes: notes });
      else await api.post("/agendamentos", { paciente_id: patient.id, profissional_id: user.profissional_id, data_hora, tipo_consulta: type, observacoes: notes, status: "Agendado" });
      notify(item ? "Consulta remarcada com sucesso." : "Consulta marcada com sucesso.");
      onDone();
    } catch (error) { notify(error.userMessage || "Não foi possível salvar a consulta.", "error"); }
    finally { setSaving(false); }
  }

  return <Modal title={item ? "Remarcar consulta" : "Marcar consulta"} subtitle="Escolha o paciente e um horário livre. Você poderá alterar tudo depois." onClose={onClose}>
    <form onSubmit={save} className="space-y-5">
      <PatientPicker patients={patients} selected={patient} onSelect={setPatient} />
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-ink">Data<input type="date" min={dayjs().format("YYYY-MM-DD")} className={`${inputClass} mt-2`} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} /></label><label className="text-sm font-bold text-ink">Tipo de consulta<select className={`${inputClass} mt-2`} value={type} onChange={(e) => setType(e.target.value)}><option>Consulta de fisioterapia</option><option>Avaliação</option><option>Retorno</option><option>Reavaliação funcional</option><option>Pilates clínico</option></select></label></div>
      <div><p className="mb-2 text-sm font-bold text-ink">Horário</p>{isPending ? <p className="text-sm text-muted">Buscando horários livres…</p> : times.length ? <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{times.map((slot) => <button key={slot} type="button" onClick={() => setTime(slot)} className={`h-10 rounded-xl border text-sm font-bold ${time === slot ? "border-primary bg-primary text-white" : "border-border bg-white text-ink hover:bg-primary-soft"}`}>{slot}</button>)}</div> : <p className="rounded-xl bg-warning-soft p-3 text-sm text-[#78591d]">Este dia não tem horários livres.</p>}</div>
      <label className="block text-sm font-bold text-ink">Observações<textarea className="mt-2 min-h-20 w-full resize-y rounded-xl border border-border bg-white p-3 text-sm outline-none focus:border-primary" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: retorno de joelho, trazer exames…" /></label>
      <div className="rounded-2xl bg-primary-soft p-4 text-sm text-primary"><strong>Resumo:</strong> {patient?.nome_completo || "Escolha o paciente"} · {date ? dayjs(date).format("DD/MM/YYYY") : "—"} às {time || "—"}</div>
      <button disabled={saving || !patient || !time} className="h-12 w-full rounded-full bg-primary px-5 text-sm font-bold text-white disabled:opacity-40">{saving ? "Salvando…" : item ? "Confirmar novo horário" : "Confirmar agendamento"}</button>
    </form>
  </Modal>;
}

function AppointmentDetails({ item, onClose, onEdit, onChanged, notify }) {
  const navigate = useNavigate();
  const [working, setWorking] = useState(false);
  async function update(status) {
    setWorking(true);
    try { await api.patch(`/agendamentos/${item.id}`, { status }); notify(`Status alterado para ${status}.`); onChanged(); }
    catch (error) { notify(error.userMessage || "Não foi possível atualizar.", "error"); }
    finally { setWorking(false); }
  }
  async function cancel() {
    if (!window.confirm(`Cancelar a consulta de ${item.paciente_nome}?`)) return;
    setWorking(true);
    try { await api.delete(`/agendamentos/${item.id}`); notify("Consulta cancelada."); onChanged(); }
    catch (error) { notify(error.userMessage || "Não foi possível cancelar.", "error"); }
    finally { setWorking(false); }
  }
  return <Modal title={item.paciente_nome} subtitle={`${dayjs(item.data_hora).format("dddd, DD [de] MMMM [às] HH:mm")} · ${item.tipo_consulta}`} onClose={onClose}>
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-white p-4"><p className="text-xs font-bold uppercase tracking-wider text-muted">Status atual</p><span className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-sm font-bold ${TONES[item.atendimento_id ? "Concluído" : item.status] || TONES.Agendado}`}>{item.atendimento_id ? "Concluído" : item.status}</span>{item.observacoes && <p className="mt-3 text-sm text-muted">{item.observacoes}</p>}</div>
      {!item.atendimento_id && <><div><p className="mb-2 text-sm font-bold text-ink">O que aconteceu agora?</p><div className="grid grid-cols-2 gap-2">{STATUSES.map((status) => <button key={status} disabled={working || status === item.status} onClick={() => update(status)} className={`h-11 rounded-xl border text-sm font-bold disabled:opacity-40 ${TONES[status]}`}>{status === "Confirmado" ? "✓ Confirmou" : status === "Chegou" ? "● Paciente chegou" : status}</button>)}</div></div><div className="grid gap-2 sm:grid-cols-2"><button onClick={onEdit} className="h-11 rounded-full border border-border bg-white text-sm font-bold text-ink">Remarcar horário</button><button onClick={() => navigate(`/atendimentos/novo?pacienteId=${item.paciente_id}&agendamentoId=${item.id}`)} className="h-11 rounded-full bg-primary text-sm font-bold text-white">Registrar atendimento</button></div><button disabled={working} onClick={cancel} className="w-full text-center text-sm font-bold text-[#9a3832]">Cancelar consulta</button></>}
      <Link to={`/pacientes?perfil=${item.paciente_id}`} className="block text-center text-sm font-bold text-primary">Abrir ficha completa do paciente →</Link>
    </div>
  </Modal>;
}

function Waitlist({ patients, onClose, onSchedule, notify }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [patient, setPatient] = useState(null);
  const [date, setDate] = useState("");
  const [period, setPeriod] = useState("Qualquer horário");
  const [notes, setNotes] = useState("");
  const { data: items = [], isPending } = useQuery({ queryKey: ["waitlist"], queryFn: async () => (await api.get("/lista-espera")).data });
  async function add(event) {
    event.preventDefault();
    if (!patient) return notify("Selecione um paciente.", "error");
    try { await api.post("/lista-espera", { paciente_id: patient.id, data_preferida: date || null, periodo: period, observacoes: notes }); await queryClient.invalidateQueries({ queryKey: ["waitlist"] }); setAdding(false); setPatient(null); setNotes(""); notify("Paciente adicionado à lista de espera."); }
    catch (error) { notify(error.userMessage || "Não foi possível adicionar.", "error"); }
  }
  async function status(id, value) { try { await api.patch(`/lista-espera/${id}`, { status: value }); await queryClient.invalidateQueries({ queryKey: ["waitlist"] }); } catch (error) { notify(error.userMessage || "Não foi possível atualizar.", "error"); } }
  return <Modal wide title="Lista de espera" subtitle="Use esta lista para preencher rapidamente um horário que ficou livre." onClose={onClose}>
    <div className="mb-4 flex justify-between rounded-2xl bg-primary-soft p-4"><div><strong className="text-primary">{items.filter((i) => i.status === "Aguardando").length} aguardando uma vaga</strong><p className="text-xs text-muted">Prioridade para quem entrou primeiro.</p></div><button onClick={() => setAdding((v) => !v)} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-white"><Plus size={16} /> Adicionar</button></div>
    {adding && <form onSubmit={add} className="mb-5 space-y-4 rounded-2xl border border-border bg-white p-4"><PatientPicker patients={patients} selected={patient} onSelect={setPatient} /><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">Data preferida<input type="date" className={`${inputClass} mt-2`} value={date} onChange={(e) => setDate(e.target.value)} /></label><label className="text-sm font-bold">Período<select className={`${inputClass} mt-2`} value={period} onChange={(e) => setPeriod(e.target.value)}><option>Qualquer horário</option><option>Manhã</option><option>Tarde</option></select></label></div><input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observação opcional" /><button className="h-11 w-full rounded-full bg-primary text-sm font-bold text-white">Salvar na lista</button></form>}
    <div className="space-y-3">{isPending && <p className="py-8 text-center text-muted">Carregando…</p>}{!isPending && items.length === 0 && <div className="rounded-2xl border border-dashed border-border p-8 text-center"><UsersRound className="mx-auto mb-2 text-muted" /><strong className="block text-ink">A lista está vazia</strong><span className="text-sm text-muted">Adicione pacientes que aceitam antecipar o atendimento.</span></div>}{items.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><strong className="block text-ink">{item.paciente_nome}</strong><span className="text-xs text-muted">{item.data_preferida ? dayjs(item.data_preferida).format("DD/MM/YYYY") : "Qualquer data"} · {item.periodo}{item.observacoes ? ` · ${item.observacoes}` : ""}</span></div><span className={`self-start rounded-full px-2.5 py-1 text-xs font-bold ${item.status === "Contatado" ? "bg-warning-soft text-[#78591d]" : "bg-primary-soft text-primary"}`}>{item.status}</span><div className="flex gap-2"><a onClick={() => status(item.id, "Contatado")} href={`https://wa.me/55${String(item.celular).replace(/\D/g, "")}?text=${encodeURIComponent("Olá! Surgiu um horário disponível para sua consulta. Você gostaria de antecipar?")}`} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary" title="Oferecer vaga pelo WhatsApp"><MessageCircleMore size={17} /></a><button onClick={() => onSchedule(item)} className="rounded-full bg-primary px-3 text-xs font-bold text-white">Agendar</button><button onClick={() => status(item.id, "Removido")} className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted" title="Remover"><X size={16} /></button></div></div>)}</div>
  </Modal>;
}

function AppointmentCard({ item, onOpen }) {
  const status = item.atendimento_id ? "Concluído" : item.status;
  const cardTone = status === "Confirmado" ? "bg-success-soft" : status === "Chegou" ? "bg-arrived-soft" : status === "Concluído" ? "bg-done-soft" : status === "Faltou" ? "bg-[#f7dfdc]" : "bg-warning-soft";
  return <button onClick={() => onOpen(item)} className={`flex min-h-[92px] w-full flex-col rounded-xl border border-transparent p-3 text-left transition hover:-translate-y-px hover:border-primary/30 hover:shadow-sm ${cardTone}`}><div className="flex items-center justify-between gap-2"><strong className="text-[15px] text-ink">{dayjs(item.data_hora).format("HH:mm")}</strong><span className="rounded-full bg-white/65 px-2 py-1 text-[10px] font-bold text-ink">{status}</span></div><p className="mt-2 truncate text-sm font-bold text-ink">{item.paciente_nome}</p><p className="truncate text-xs text-muted">{item.tipo_consulta}</p></button>;
}

function WeekView({ days, byDay, onOpen, onBook, onSelectDay }) {
  const today = dayjs().format("YYYY-MM-DD");
  return <section className="overflow-x-auto rounded-2xl border border-border bg-white shadow-[0_1px_2px_rgba(31,42,36,0.03)]">
    <div className="grid min-w-[980px] grid-cols-5 divide-x divide-border">
      {days.map((day) => {
        const key = day.format("YYYY-MM-DD");
        const items = byDay[key] || [];
        const isToday = key === today;
        return <div key={key} className="flex min-h-[500px] min-w-0 flex-col bg-white">
          <button type="button" onClick={() => onSelectDay(day)} className={`border-b border-border px-4 py-4 text-left transition hover:bg-canvas ${isToday ? "bg-primary-soft" : "bg-table-head"}`}>
            <span className={`block text-sm font-bold uppercase tracking-[0.04em] ${isToday ? "text-primary" : "text-ink"}`}>{day.format("ddd DD").replace(".", "")}{isToday ? " · HOJE" : ""}</span>
            <span className="mt-1 block text-xs text-muted">{items.length} {items.length === 1 ? "consulta marcada" : "consultas marcadas"}</span>
          </button>
          <div className="flex flex-1 flex-col gap-2.5 p-3.5">
            {items.map((item) => <AppointmentCard key={item.id} item={item} onOpen={onOpen} />)}
            <button type="button" onClick={() => onBook(day)} className="mt-auto inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/35 bg-primary-soft/45 text-xs font-bold text-primary transition hover:bg-primary-soft"><Plus size={15} /> Adicionar consulta</button>
          </div>
        </div>;
      })}
    </div>
  </section>;
}

export default function AgendarConsultaPage() {
  const { setPageTitle } = useOutletContext();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState("semana");
  const [anchor, setAnchor] = useState(dayjs());
  const [form, setForm] = useState(null);
  const [details, setDetails] = useState(null);
  const [waitlist, setWaitlist] = useState(false);
  const [toast, setToast] = useState(null);
  useEffect(() => setPageTitle("Agenda"), [setPageTitle]);
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(null), 3500); return () => clearTimeout(timer); }, [toast]);
  const notify = (message, tone = "success") => setToast({ message, tone });
  const monday = useMemo(() => mondayOf(anchor), [anchor]);
  const range = useMemo(() => view === "mes" ? { dataInicio: anchor.startOf("month").subtract(7, "day").format("YYYY-MM-DD"), dataFim: anchor.endOf("month").add(7, "day").format("YYYY-MM-DD") } : view === "dia" ? { dataInicio: anchor.format("YYYY-MM-DD"), dataFim: anchor.format("YYYY-MM-DD") } : { dataInicio: monday.format("YYYY-MM-DD"), dataFim: monday.add(4, "day").format("YYYY-MM-DD") }, [anchor, monday, view]);
  const { data: appointments = [], isPending, isError } = useQuery({ queryKey: ["agenda", range], queryFn: async () => (await api.get("/agendamentos", { params: range })).data });
  const { data: patients = [] } = useQuery({ queryKey: ["pacientes"], queryFn: async () => (await api.get("/pacientes")).data });
  const preset = patients.find((p) => String(p.id) === params.get("pacienteId"));
  useEffect(() => { if (preset && params.get("pacienteId")) { setForm({ initialDay: dayjs(), initialPatient: preset }); setParams({}, { replace: true }); } }, [preset, params, setParams]);
  const byDay = useMemo(() => appointments.reduce((map, item) => { (map[dayjs(item.data_hora).format("YYYY-MM-DD")] ||= []).push(item); return map; }, {}), [appointments]);
  const days = useMemo(() => Array.from({ length: 5 }, (_, index) => monday.add(index, "day")), [monday]);
  const monthDays = useMemo(() => { const first = anchor.startOf("month"); const start = mondayOf(first); return Array.from({ length: 42 }, (_, index) => start.add(index, "day")); }, [anchor]);
  const refresh = async () => { setDetails(null); setForm(null); await Promise.all([queryClient.invalidateQueries({ queryKey: ["agenda"] }), queryClient.invalidateQueries({ queryKey: ["pacientes-agenda"] })]); };
  function move(amount) { setAnchor((value) => value.add(amount, view === "mes" ? "month" : view === "dia" ? "day" : "week")); }
  function scheduleWaitlist(item) { setWaitlist(false); setForm({ initialDay: item.data_preferida ? dayjs(item.data_preferida) : dayjs(), initialPatient: patients.find((p) => String(p.id) === String(item.paciente_id)), waitlistId: item.id }); }
  async function formDone() { if (form?.waitlistId) { await api.patch(`/lista-espera/${form.waitlistId}`, { status: "Agendado" }); queryClient.invalidateQueries({ queryKey: ["waitlist"] }); } await refresh(); }
  const label = view === "semana" ? `${monday.format("DD/MM")} a ${monday.add(4, "day").format("DD/MM")}` : view === "dia" ? anchor.format("DD [de] MMMM") : anchor.format("MMMM [de] YYYY");

  return <div className="flex w-full flex-1 flex-col gap-5">
    <PageHeader eyebrow="Sua rotina em um só lugar" title="Agenda" onNewAppointment={() => setForm({ initialDay: anchor })} />
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-3"><div className="flex items-center gap-2"><button onClick={() => move(-1)} className="grid h-10 w-10 place-items-center rounded-xl border border-border"><ChevronLeft size={18} /></button><button onClick={() => setAnchor(dayjs())} className="h-10 rounded-xl border border-border px-4 text-sm font-bold">Hoje</button><button onClick={() => move(1)} className="grid h-10 w-10 place-items-center rounded-xl border border-border"><ChevronRight size={18} /></button><strong className="ml-2 capitalize text-lg text-ink">{label}</strong></div><div className="flex items-center gap-2"><button onClick={() => setWaitlist(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-primary"><UsersRound size={17} /> Lista de espera</button><div className="flex rounded-xl bg-segment p-1">{[["dia", "Dia"], ["semana", "Semana"], ["mes", "Mês"]].map(([id, text]) => <button key={id} onClick={() => setView(id)} className={`rounded-lg px-4 py-2 text-sm ${view === id ? "bg-white font-bold shadow-sm" : "text-muted"}`}>{text}</button>)}</div></div></section>
    {isPending && <div className="grid min-h-72 place-items-center rounded-2xl border border-border bg-white text-muted">Carregando agenda…</div>}
    {isError && <div className="rounded-2xl bg-[#f7dfdc] p-5 text-[#9a3832]">Não foi possível carregar a agenda. Tente atualizar a página.</div>}
    {!isPending && !isError && view === "semana" && <WeekView days={days} byDay={byDay} onOpen={setDetails} onBook={(day) => setForm({ initialDay: day })} onSelectDay={(day) => { setAnchor(day); setView("dia"); }} />}
    {!isPending && !isError && view === "dia" && <DayView day={anchor} items={byDay[anchor.format("YYYY-MM-DD")] || []} onOpen={setDetails} onBook={(time) => setForm({ initialDay: anchor, initialTime: time })} />}
    {!isPending && !isError && view === "mes" && <section className="grid grid-cols-7 overflow-hidden rounded-2xl border border-border bg-border">{["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"].map((day) => <div key={day} className="bg-white p-2 text-xs font-bold text-muted">{day}</div>)}{monthDays.map((day) => { const key = day.format("YYYY-MM-DD"); const count = (byDay[key] || []).length; return <button key={key} onClick={() => { setAnchor(day); setView("dia"); }} className={`min-h-24 bg-white p-2 text-left hover:bg-primary-soft ${day.month() !== anchor.month() ? "opacity-45" : ""}`}><span className={`text-sm ${key === dayjs().format("YYYY-MM-DD") ? "font-bold text-primary" : "text-ink"}`}>{day.format("DD")}</span>{count > 0 && <span className="mt-2 block rounded-lg bg-primary-soft px-2 py-1 text-xs font-bold text-primary">{count} {count === 1 ? "consulta" : "consultas"}</span>}</button>; })}</section>}
    {form && <AppointmentForm {...form} patients={patients} onClose={() => setForm(null)} onDone={formDone} notify={notify} />}
    {details && <AppointmentDetails item={details} onClose={() => setDetails(null)} onEdit={() => { setForm({ item: details, initialPatient: patients.find((p) => String(p.id) === String(details.paciente_id)) }); setDetails(null); }} onChanged={refresh} notify={notify} />}
    {waitlist && <Waitlist patients={patients} onClose={() => setWaitlist(false)} onSchedule={scheduleWaitlist} notify={notify} />}
    {toast && <div className={`fixed bottom-6 right-6 z-[60] max-w-sm rounded-xl px-4 py-3 text-sm font-bold text-white shadow-xl ${toast.tone === "error" ? "bg-[#9a3832]" : "bg-primary"}`}>{toast.message}</div>}
  </div>;
}

function DayView({ day, items, onOpen, onBook }) {
  const { user } = useAuth();
  const { data: slots = [] } = useQuery({ queryKey: ["available-times", day.format("YYYY-MM-DD"), user?.profissional_id], enabled: Boolean(user?.profissional_id), queryFn: async () => (await api.get("/agendamentos/horarios-disponiveis", { params: { data: day.format("YYYY-MM-DD"), profissional_id: user.profissional_id } })).data });
  return <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="rounded-2xl border border-border bg-white p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-bold capitalize text-ink">{day.format("dddd, DD [de] MMMM")}</h2><p className="text-sm text-muted">Clique em uma consulta para confirmar, remarcar ou registrar.</p></div><span className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary">{items.length} consultas</span></div><div className="space-y-2">{items.map((item) => <button key={item.id} onClick={() => onOpen(item)} className="flex w-full items-center gap-4 rounded-xl bg-canvas p-4 text-left hover:ring-1 hover:ring-primary/30"><span className="w-14 text-lg font-bold text-ink">{dayjs(item.data_hora).format("HH:mm")}</span><span className="min-w-0 flex-1"><strong className="block truncate text-ink">{item.paciente_nome}</strong><small className="text-muted">{item.tipo_consulta}</small></span><span className={`rounded-full px-3 py-1 text-xs font-bold ${TONES[item.atendimento_id ? "Concluído" : item.status] || TONES.Agendado}`}>{item.atendimento_id ? "Concluído" : item.status}</span></button>)}{items.length === 0 && <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">Nenhuma consulta neste dia.</p>}</div></div><aside className="rounded-2xl border border-border bg-white p-5"><div className="mb-4 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"><Clock3 size={19} /></span><div><h3 className="font-bold text-ink">Horários livres</h3><p className="text-xs text-muted">Clique para preencher</p></div></div><div className="grid grid-cols-3 gap-2">{slots.map((time) => <button key={time} onClick={() => onBook(time)} className="h-10 rounded-xl border border-border text-sm font-bold text-primary hover:bg-primary-soft">{time}</button>)}</div>{slots.length === 0 && <p className="text-sm text-muted">Agenda completa para este dia.</p>}</aside></section>;
}
