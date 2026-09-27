import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarX2, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, MessageCircleMore, Plus, UserRound, UsersRound, X } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { PageHeader } from "../components/PageHeader";
import { PrettySelect } from "../components/ui/select";
import { PrettyDatePicker } from "../components/ui/date-picker";
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
  Cancelado: "bg-canvas text-muted",
};
const inputClass = "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";

function mondayOf(date) {
  return date.startOf("day").subtract((date.day() + 6) % 7, "day");
}

function needsAttendanceConfirmation(item, now) {
  if (!item || item.atendimento_id) return false;
  if (!["Agendado", "Confirmado"].includes(item.status || "Agendado")) return false;
  const scheduled = dayjs(item.data_hora);
  return scheduled.isValid() && !scheduled.add(1, "hour").isAfter(now);
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#14201c]/45 p-4" onMouseDown={onClose}>
      <section className={`max-h-[92vh] w-full overflow-y-auto rounded-3xl border border-border bg-canvas p-5 shadow-2xl sm:p-6 ${wide ? "max-w-3xl" : "max-w-xl"}`} onMouseDown={(event) => event.stopPropagation()}>
        <header className="mb-5 flex items-start justify-between gap-4">
          <div><h2 className="text-2xl font-bold leading-tight text-ink">{title}</h2>{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}</div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-white text-muted transition-all duration-150 hover:-translate-y-px hover:bg-canvas hover:text-ink hover:shadow-sm active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><X size={17} /></button>
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
      {selected && <button type="button" onClick={() => { setTerm(""); onSelect(null); }} className="mt-2 cursor-pointer text-xs font-bold text-primary transition-colors hover:text-[#245a54] hover:underline focus-visible:outline-2 focus-visible:outline-primary">Trocar paciente</button>}
      {matches.length > 0 && <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg">{matches.map((patient) => <button key={patient.id} type="button" onClick={() => { onSelect(patient); setTerm(patient.nome_completo); }} className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-primary"><strong>{patient.nome_completo}</strong><span className="text-xs text-muted">{patient.celular}</span></button>)}</div>}
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
  useEffect(() => {
    if (!isPending && !item && time && !times.includes(time)) setTime("");
  }, [isPending, item, time, times]);

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
      <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold text-ink">Data<PrettyDatePicker min={dayjs().format("YYYY-MM-DD")} wrapperClassName="mt-2" value={date} onChange={(next) => { setDate(next); setTime(""); }} /></label><label className="block text-sm font-bold text-ink">Tipo de consulta<PrettySelect wrapperClassName="mt-2" ariaLabel="Tipo de consulta" value={type} onChange={(next) => setType(next)} options={["Consulta de fisioterapia", "Avaliação", "Retorno", "Reavaliação funcional", "Pilates clínico"]} /></label></div>
      <div><p className="mb-2 text-sm font-bold text-ink">Horário</p>{isPending ? <p className="text-sm text-muted">Buscando horários livres…</p> : times.length ? <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{times.map((slot) => <button key={slot} type="button" onClick={() => setTime(slot)} className={`h-10 cursor-pointer rounded-xl border text-sm font-bold transition-all duration-150 active:scale-[0.97] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${time === slot ? "border-primary bg-primary text-white shadow-md hover:bg-[#245a54]" : "border-border bg-white text-ink hover:-translate-y-px hover:border-primary/40 hover:bg-primary-soft hover:shadow-sm"}`}>{slot}</button>)}</div> : <p className="rounded-xl bg-warning-soft p-3 text-sm text-[#78591d]">Este dia não tem horários livres.</p>}</div>
      <label className="block text-sm font-bold text-ink">Observações<textarea className="mt-2 min-h-20 w-full resize-y rounded-xl border border-border bg-white p-3 text-sm outline-none focus:border-primary" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: retorno de joelho, trazer exames…" /></label>
      <div className="rounded-2xl bg-primary-soft p-4 text-sm text-primary"><strong>Resumo:</strong> {patient?.nome_completo || "Escolha o paciente"} · {date ? dayjs(date).format("DD/MM/YYYY") : "—"} às {time || "—"}</div>
      <button disabled={saving || !patient || !time} className="h-12 w-full cursor-pointer rounded-full bg-primary px-5 text-sm font-bold text-white shadow-[0_1px_0_rgba(31,42,36,0.08)] transition-all duration-150 hover:-translate-y-px hover:bg-[#245a54] hover:shadow-md active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none">{saving ? "Salvando…" : item ? "Confirmar novo horário" : "Confirmar agendamento"}</button>
    </form>
  </Modal>;
}

function CancelAppointmentDialog({ item, onClose, onConfirm }) {
  const dialogRef = useRef(null);
  const backButtonRef = useRef(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    backButtonRef.current?.focus();
    return () => dialog.close();
  }, []);

  async function confirm() {
    if (working) return;
    setWorking(true);
    setError("");
    try { await onConfirm(item); }
    catch (failure) { setError(failure.userMessage || "Não foi possível cancelar a consulta. Tente novamente."); setWorking(false); }
  }

  return <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); if (!working) onClose(); }} aria-labelledby="cancel-appointment-title" aria-describedby="cancel-appointment-description" className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border bg-white p-5 text-ink backdrop:bg-[#14201c]/45 sm:p-6">
    <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#F1DDDA] text-[#75413D]"><CalendarX2 size={22} aria-hidden="true" /></div>
    <h2 id="cancel-appointment-title" className="mt-4 text-2xl font-bold leading-tight">Cancelar consulta?</h2>
    <p id="cancel-appointment-description" className="mt-2 text-sm leading-6 text-muted">Confira os dados antes de cancelar. Se o horário ainda não passou, ele ficará livre para outra consulta.</p>
    <div className="mt-5 rounded-[13px] bg-canvas p-4">
      <strong className="block truncate text-[17px] text-ink">{item.paciente_nome || "Paciente sem nome"}</strong>
      <span className="mt-1 block text-sm text-muted">{dayjs(item.data_hora).format("DD/MM/YYYY [às] HH:mm")}</span>
      <span className="mt-1 block text-sm text-muted">{item.tipo_consulta || "Consulta de fisioterapia"}</span>
    </div>
    {error && <p role="alert" className="mt-4 rounded-xl bg-[#F1DDDA] px-4 py-3 text-sm text-[#75413D]">{error}</p>}
    <div className="mt-6 grid gap-2 sm:grid-cols-2">
      <button ref={backButtonRef} type="button" disabled={working} onClick={onClose} className="min-h-11 rounded-[11px] border border-border bg-white px-4 text-sm font-bold text-ink transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50">Voltar</button>
      <button type="button" disabled={working} onClick={confirm} className="min-h-11 rounded-[11px] bg-[#F1DDDA] px-4 text-sm font-bold text-[#75413D] transition-colors hover:bg-[#E9CBC6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#75413D] disabled:cursor-not-allowed disabled:opacity-50">{working ? "Cancelando…" : "Sim, cancelar"}</button>
    </div>
  </dialog>;
}

function AppointmentDetails({ item, onClose, onEdit, onChanged, onCancelRequest, notify }) {
  const navigate = useNavigate();
  const [working, setWorking] = useState(false);
  async function update(status) {
    setWorking(true);
    try { await api.patch(`/agendamentos/${item.id}`, { status }); notify(`Status alterado para ${status}.`); onChanged(); }
    catch (error) { notify(error.userMessage || "Não foi possível atualizar.", "error"); }
    finally { setWorking(false); }
  }
  function cancel() { onCancelRequest(item); }
  return <Modal title={item.paciente_nome} subtitle={`${dayjs(item.data_hora).format("dddd, DD [de] MMMM [às] HH:mm")} · ${item.tipo_consulta}`} onClose={onClose}>
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-white p-4"><p className="text-xs font-bold uppercase tracking-wider text-muted">Status atual</p><span className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-sm font-bold ${TONES[item.atendimento_id ? "Concluído" : item.status] || TONES.Agendado}`}>{item.atendimento_id ? "Concluído" : item.status}</span>{item.observacoes && <p className="mt-3 text-sm text-muted">{item.observacoes}</p>}</div>
      {!item.atendimento_id && <><div><p className="mb-2 text-sm font-bold text-ink">O que aconteceu agora?</p><div className="grid grid-cols-2 gap-2">{STATUSES.map((status) => <button key={status} disabled={working || status === item.status} onClick={() => update(status)} className={`h-11 cursor-pointer rounded-xl border text-sm font-bold transition-all duration-150 hover:-translate-y-px hover:shadow-sm active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none ${TONES[status]}`}>{status === "Confirmado" ? "✓ Confirmou" : status === "Chegou" ? "● Paciente chegou" : status}</button>)}</div></div><div className="grid gap-2 sm:grid-cols-2"><button onClick={onEdit} className="h-11 cursor-pointer rounded-full border border-border bg-white text-sm font-bold text-ink transition-all duration-150 hover:-translate-y-px hover:border-primary/40 hover:bg-canvas hover:shadow-sm active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Remarcar horário</button><button onClick={() => navigate(`/atendimentos/novo?pacienteId=${item.paciente_id}&agendamentoId=${item.id}`)} className="h-11 cursor-pointer rounded-full bg-primary text-sm font-bold text-white shadow-[0_1px_0_rgba(31,42,36,0.08)] transition-all duration-150 hover:-translate-y-px hover:bg-[#245a54] hover:shadow-md active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Registrar atendimento</button></div><button disabled={working} onClick={cancel} className="w-full cursor-pointer text-center text-sm font-bold text-[#9a3832] transition-colors hover:text-[#613330] hover:underline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50">Cancelar consulta</button></>}
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
    <div className="mb-4 flex justify-between rounded-2xl bg-primary-soft p-4"><div><strong className="text-primary">{items.filter((i) => i.status === "Aguardando").length} aguardando uma vaga</strong><p className="text-xs text-muted">Prioridade para quem entrou primeiro.</p></div><button onClick={() => setAdding((v) => !v)} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-white shadow-[0_1px_0_rgba(31,42,36,0.08)] transition-all duration-150 hover:-translate-y-px hover:bg-[#245a54] hover:shadow-md active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><Plus size={16} /> Adicionar</button></div>
    {adding && <form onSubmit={add} className="mb-5 space-y-4 rounded-2xl border border-border bg-white p-4"><PatientPicker patients={patients} selected={patient} onSelect={setPatient} /><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-bold">Data preferida<PrettyDatePicker wrapperClassName="mt-2" value={date} onChange={(next) => setDate(next)} /></label><label className="block text-sm font-bold">Período<PrettySelect wrapperClassName="mt-2" ariaLabel="Período" value={period} onChange={(next) => setPeriod(next)} options={["Qualquer horário", "Manhã", "Tarde"]} /></label></div><input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observação opcional" /><button className="h-11 w-full cursor-pointer rounded-full bg-primary text-sm font-bold text-white shadow-[0_1px_0_rgba(31,42,36,0.08)] transition-all duration-150 hover:-translate-y-px hover:bg-[#245a54] hover:shadow-md active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Salvar na lista</button></form>}
    <div className="space-y-3">{isPending && <p className="py-8 text-center text-muted">Carregando…</p>}{!isPending && items.length === 0 && <div className="rounded-2xl border border-dashed border-border p-8 text-center"><UsersRound className="mx-auto mb-2 text-muted" /><strong className="block text-ink">A lista está vazia</strong><span className="text-sm text-muted">Adicione pacientes que aceitam antecipar o atendimento.</span></div>}{items.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><strong className="block text-ink">{item.paciente_nome}</strong><span className="text-xs text-muted">{item.data_preferida ? dayjs(item.data_preferida).format("DD/MM/YYYY") : "Qualquer data"} · {item.periodo}{item.observacoes ? ` · ${item.observacoes}` : ""}</span></div><span className={`self-start rounded-full px-2.5 py-1 text-xs font-bold ${item.status === "Contatado" ? "bg-warning-soft text-[#78591d]" : "bg-primary-soft text-primary"}`}>{item.status}</span><div className="flex gap-2"><a onClick={() => status(item.id, "Contatado")} href={`https://wa.me/55${String(item.celular).replace(/\D/g, "")}?text=${encodeURIComponent("Olá! Surgiu um horário disponível para sua consulta. Você gostaria de antecipar?")}`} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary transition-all duration-150 hover:-translate-y-px hover:bg-[#cce0db] hover:shadow-sm active:translate-y-0 active:scale-[0.95] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-primary" title="Oferecer vaga pelo WhatsApp"><MessageCircleMore size={17} /></a><button onClick={() => onSchedule(item)} className="rounded-full bg-primary px-3 text-xs font-bold text-white shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-[#245a54] hover:shadow-md active:translate-y-0 active:scale-[0.97] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-primary">Agendar</button><button onClick={() => status(item.id, "Removido")} className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-border text-muted transition-all duration-150 hover:-translate-y-px hover:border-[#C62828]/30 hover:bg-[#f1ddda] hover:text-[#75413d] active:translate-y-0 active:scale-[0.95] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-primary" title="Remover"><X size={16} /></button></div></div>)}</div>
  </Modal>;
}

function AttendanceActions({ item, onAnswer }) {
  const [working, setWorking] = useState(null);
  const [error, setError] = useState("");

  async function answer(status) {
    if (working) return;
    setWorking(status);
    setError("");
    try { await onAnswer(item, status); }
    catch (failure) {
      setError(failure.userMessage || "Não foi possível registrar a presença. Tente novamente.");
    }
    finally { setWorking(null); }
  }

  return <div role="group" aria-label={`Confirmar presença de ${item.paciente_nome || "paciente"} às ${dayjs(item.data_hora).format("HH:mm")}`} aria-busy={Boolean(working)} className="px-2 pb-2">
    <div className="flex justify-end gap-1">
      <button type="button" title="Veio" aria-label={`${item.paciente_nome || "Paciente"} veio`} disabled={Boolean(working)} onClick={() => answer("Chegou")} className="grid h-11 w-11 place-items-center rounded-[11px] border border-primary/20 bg-white/70 text-primary transition-colors hover:border-primary/40 hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"><Check size={20} strokeWidth={2.5} aria-hidden="true" /></button>
      <button type="button" title="Não veio" aria-label={`${item.paciente_nome || "Paciente"} não veio`} disabled={Boolean(working)} onClick={() => answer("Faltou")} className="grid h-11 w-11 place-items-center rounded-[11px] border border-[#75413D]/20 bg-white/70 text-[#75413D] transition-colors hover:border-[#75413D]/40 hover:bg-[#F1DDDA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#75413D] disabled:cursor-not-allowed disabled:opacity-50"><X size={19} strokeWidth={2.5} aria-hidden="true" /></button>
    </div>
    {error && <p role="alert" className="mt-2 text-xs leading-4 text-[#75413D]">{error}</p>}
  </div>;
}

function AppointmentCard({ item, onOpen, onAttendance, now, hasCancel = false }) {
  const status = item.atendimento_id ? "Concluído" : item.status;
  const cardTone = status === "Confirmado" ? "bg-success-soft" : status === "Chegou" ? "bg-arrived-soft" : status === "Concluído" ? "bg-done-soft" : status === "Faltou" ? "bg-[#f7dfdc]" : "bg-warning-soft";
  const content = <><div className="flex items-center justify-between gap-2"><strong className="text-[17px] text-ink">{dayjs(item.data_hora).format("HH:mm")}</strong><span className="rounded-full bg-white/65 px-2 py-1 text-[13px] font-bold text-ink">{status}</span></div><p className="mt-2 truncate text-sm font-bold text-ink">{item.paciente_nome}</p><p className="truncate text-xs text-muted">{item.tipo_consulta}</p></>;
  return <div className={`${hasCancel ? "rounded-t-xl" : "rounded-xl"} overflow-hidden ${cardTone}`}>
    <button type="button" onClick={() => onOpen(item)} className="flex min-h-[92px] w-full cursor-pointer flex-col p-3 text-left transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary">{content}</button>
    {needsAttendanceConfirmation(item, now) && <AttendanceActions item={item} onAnswer={onAttendance} />}
  </div>;
}

function WeekView({ days, byDay, now, onOpen, onCancel, onAttendance, onBook, onSelectDay }) {
  const today = now.format("YYYY-MM-DD");
  return <section className="overflow-x-auto rounded-2xl border border-border bg-white shadow-[0_1px_2px_rgba(31,42,36,0.03)]">
    <div className="grid grid-cols-1 sm:min-w-[980px] sm:grid-cols-5 sm:divide-x sm:divide-border">
      {days.map((day) => {
        const key = day.format("YYYY-MM-DD");
        const items = byDay[key] || [];
        const isToday = key === today;
        return <div key={key} className="flex min-h-0 min-w-0 flex-col border-b border-border bg-white last:border-b-0 sm:min-h-[500px] sm:border-b-0">
          <button type="button" onClick={() => onSelectDay(day)} className={`cursor-pointer border-b border-border px-4 py-4 text-left transition-colors duration-150 hover:bg-canvas focus-visible:outline-2 focus-visible:outline-primary ${isToday ? "bg-primary-soft" : "bg-table-head"}`}>
            <span className={`block text-sm font-bold uppercase tracking-[0.04em] ${isToday ? "text-primary" : "text-ink"}`}>{day.format("ddd DD").replace(".", "")}{isToday ? " · HOJE" : ""}</span>
            <span className="mt-1 block text-xs text-muted">{items.length} {items.length === 1 ? "consulta marcada" : "consultas marcadas"}</span>
          </button>
          <div className="flex flex-1 flex-col gap-2.5 p-3.5">
            {items.map((item) => {
              const canCancel = !item.atendimento_id;
              return <div key={item.id} className="overflow-hidden rounded-xl">
                <AppointmentCard item={item} onOpen={onOpen} onAttendance={onAttendance} now={now} hasCancel={canCancel} />
                {canCancel && <button type="button" onClick={() => onCancel(item)} className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 border-t border-[#75413D]/15 bg-canvas px-3 text-xs font-bold text-[#75413D] transition-colors hover:bg-[#F1DDDA] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#75413D]"><CalendarX2 size={14} aria-hidden="true" /> Cancelar consulta</button>}
              </div>;
            })}
            {onBook && <button type="button" onClick={() => onBook(day)} className="mt-auto inline-flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/35 bg-primary-soft/45 text-xs font-bold text-primary transition-colors duration-150 hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-primary"><Plus size={15} /> Adicionar consulta</button>}
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
  const [cancelTarget, setCancelTarget] = useState(null);
  const [waitlist, setWaitlist] = useState(false);
  const [toast, setToast] = useState(null);
  const [now, setNow] = useState(() => dayjs());
  useEffect(() => setPageTitle("Agenda"), [setPageTitle]);
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(null), 3500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { const timer = setInterval(() => setNow(dayjs()), 60_000); return () => clearInterval(timer); }, []);
  const notify = (message, tone = "success") => setToast({ message, tone });
  const monday = useMemo(() => mondayOf(anchor), [anchor]);
  const range = useMemo(() => view === "mes" ? { dataInicio: anchor.startOf("month").subtract(7, "day").format("YYYY-MM-DD"), dataFim: anchor.endOf("month").add(7, "day").format("YYYY-MM-DD") } : view === "dia" ? { dataInicio: anchor.format("YYYY-MM-DD"), dataFim: anchor.format("YYYY-MM-DD") } : { dataInicio: monday.format("YYYY-MM-DD"), dataFim: monday.add(4, "day").format("YYYY-MM-DD") }, [anchor, monday, view]);
  const { data: appointments = [], isPending, isError } = useQuery({ queryKey: ["agenda", range], queryFn: async () => (await api.get("/agendamentos", { params: range })).data });
  const { data: patients = [] } = useQuery({ queryKey: ["pacientes"], queryFn: async () => (await api.get("/pacientes")).data });
  const preset = patients.find((p) => String(p.id) === params.get("pacienteId"));
  useEffect(() => { if (preset && params.get("pacienteId")) { setForm({ initialDay: dayjs(), initialPatient: preset }); setParams({}, { replace: true }); } }, [preset, params, setParams]);
  useEffect(() => {
    const requestedDate = params.get("data");
    const requestedTime = params.get("horario");
    if (!requestedDate || !requestedTime) return;
    const day = dayjs(requestedDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate) || !/^\d{2}:\d{2}$/.test(requestedTime) || !day.isValid() || day.isBefore(dayjs(), "day")) {
      setParams({}, { replace: true });
      return;
    }
    setAnchor(day);
    setView("dia");
    setForm({ initialDay: day, initialTime: requestedTime });
    setParams({}, { replace: true });
  }, [params, setParams]);
  const byDay = useMemo(() => appointments.reduce((map, item) => { (map[dayjs(item.data_hora).format("YYYY-MM-DD")] ||= []).push(item); return map; }, {}), [appointments]);
  const days = useMemo(() => Array.from({ length: 5 }, (_, index) => monday.add(index, "day")), [monday]);
  const monthDays = useMemo(() => { const first = anchor.startOf("month"); const start = mondayOf(first); return Array.from({ length: 42 }, (_, index) => start.add(index, "day")); }, [anchor]);
  const refresh = async () => { setDetails(null); setForm(null); await Promise.all([queryClient.invalidateQueries({ queryKey: ["agenda"] }), queryClient.invalidateQueries({ queryKey: ["pacientes-agenda"] })]); };
  async function cancelAppointment(item) {
    await api.delete(`/agendamentos/${item.id}`);
    setCancelTarget(null);
    notify("Consulta cancelada.");
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["agenda"] }),
      queryClient.invalidateQueries({ queryKey: ["available-times"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-agendamentos"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-horarios-disponiveis"] }),
      queryClient.invalidateQueries({ queryKey: ["pacientes-agenda"] }),
    ]);
  }
  async function answerAttendance(item, status) {
    await api.patch(`/agendamentos/${item.id}`, { status });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["agenda"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-agendamentos"] }),
      queryClient.invalidateQueries({ queryKey: ["pacientes-agenda"] }),
    ]);
    notify(status === "Chegou" ? "Presença registrada." : "Falta registrada.");
  }
  function move(amount) { setAnchor((value) => value.add(amount, view === "mes" ? "month" : view === "dia" ? "day" : "week")); }
  function scheduleWaitlist(item) { setWaitlist(false); setForm({ initialDay: item.data_preferida ? dayjs(item.data_preferida) : dayjs(), initialPatient: patients.find((p) => String(p.id) === String(item.paciente_id)), waitlistId: item.id }); }
  async function formDone() { if (form?.waitlistId) { await api.patch(`/lista-espera/${form.waitlistId}`, { status: "Agendado" }); queryClient.invalidateQueries({ queryKey: ["waitlist"] }); } await refresh(); }
  const label = view === "semana" ? `${monday.format("DD/MM")} a ${monday.add(4, "day").format("DD/MM")}` : view === "dia" ? anchor.format("DD [de] MMMM") : anchor.format("MMMM [de] YYYY");

  return <div className="flex w-full flex-1 flex-col gap-5">
    <PageHeader eyebrow="Sua rotina em um só lugar" title="Agenda" onNewAppointment={() => setForm({ initialDay: anchor })} />
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => move(-1)} aria-label="Período anterior" className="grid h-10 w-10 place-items-center rounded-xl border border-border transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-primary"><ChevronLeft size={18} aria-hidden="true" /></button>
        <button type="button" onClick={() => setAnchor(dayjs())} className="h-10 rounded-xl border border-border px-4 text-sm font-bold transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-primary">Hoje</button>
        <button type="button" onClick={() => move(1)} aria-label="Próximo período" className="grid h-10 w-10 place-items-center rounded-xl border border-border transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-primary"><ChevronRight size={18} aria-hidden="true" /></button>
        <strong className="ml-2 capitalize text-lg text-ink">{label}</strong>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setWaitlist(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-primary transition-colors hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-primary"><UsersRound size={17} aria-hidden="true" /> Lista de espera</button>
        <div className="flex rounded-xl bg-segment p-1" role="group" aria-label="Visualização da agenda">
          {[["dia", "Dia"], ["semana", "Semana"], ["mes", "Mês"]].map(([id, text]) => <button key={id} type="button" onClick={() => setView(id)} aria-pressed={view === id} className={`min-h-9 rounded-lg px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary ${view === id ? "bg-white font-bold text-ink" : "text-muted hover:bg-white/60 hover:text-ink"}`}>{text}</button>)}
        </div>
      </div>
    </section>
    {isPending && <div className="grid min-h-72 place-items-center rounded-2xl border border-border bg-white text-muted">Carregando agenda…</div>}
    {isError && <div className="rounded-2xl bg-[#f7dfdc] p-5 text-[#9a3832]">Não foi possível carregar a agenda. Tente atualizar a página.</div>}
    {!isPending && !isError && view === "semana" && <WeekView days={days} byDay={byDay} now={now} onOpen={setDetails} onCancel={setCancelTarget} onAttendance={answerAttendance} onBook={(day) => setForm({ initialDay: day })} onSelectDay={(day) => { setAnchor(day); setView("dia"); }} />}
    {!isPending && !isError && view === "dia" && <DayView day={anchor} items={byDay[anchor.format("YYYY-MM-DD")] || []} now={now} onOpen={setDetails} onBook={(time) => setForm({ initialDay: anchor, initialTime: time })} onAttendance={answerAttendance} />}
    {!isPending && !isError && view === "mes" && <section className="grid grid-cols-7 overflow-hidden rounded-2xl border border-border bg-border">{["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"].map((day) => <div key={day} className="bg-white p-2 text-xs font-bold text-muted">{day}</div>)}{monthDays.map((day) => { const key = day.format("YYYY-MM-DD"); const count = (byDay[key] || []).length; return <button key={key} onClick={() => { setAnchor(day); setView("dia"); }} className={`min-h-24 cursor-pointer bg-white p-2 text-left transition-colors duration-150 hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-primary ${day.month() !== anchor.month() ? "opacity-45" : ""}`}><span className={`text-sm ${key === dayjs().format("YYYY-MM-DD") ? "font-bold text-primary" : "text-ink"}`}>{day.format("DD")}</span>{count > 0 && <span className="mt-2 block rounded-lg bg-primary-soft px-2 py-1 text-xs font-bold text-primary">{count} {count === 1 ? "consulta" : "consultas"}</span>}</button>; })}</section>}
    {form && <AppointmentForm {...form} patients={patients} onClose={() => setForm(null)} onDone={formDone} notify={notify} />}
    {cancelTarget && <CancelAppointmentDialog item={cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={cancelAppointment} />}
    {details && <AppointmentDetails item={details} onClose={() => setDetails(null)} onEdit={() => { setForm({ item: details, initialPatient: patients.find((p) => String(p.id) === String(details.paciente_id)) }); setDetails(null); }} onChanged={refresh} onCancelRequest={(item) => { setDetails(null); setCancelTarget(item); }} notify={notify} />}
    {waitlist && <Waitlist patients={patients} onClose={() => setWaitlist(false)} onSchedule={scheduleWaitlist} notify={notify} />}
    {toast && <div role={toast.tone === "error" ? "alert" : "status"} className={`fixed left-4 right-4 top-4 z-[60] flex min-h-14 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg sm:left-auto sm:right-6 sm:top-6 sm:w-full sm:max-w-sm ${toast.tone === "error" ? "bg-[#9a3832]" : "bg-primary"}`}>
      {toast.tone === "error" ? <CircleAlert size={20} className="shrink-0" aria-hidden="true" /> : <CheckCircle2 size={20} className="shrink-0" aria-hidden="true" />}
      <span className="min-w-0 flex-1">{toast.message}</span>
      <button type="button" onClick={() => setToast(null)} aria-label="Fechar aviso" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white/90 transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><X size={17} aria-hidden="true" /></button>
    </div>}
  </div>;
}

function DaySlot({ time, appointment, available, past, now, onOpen, onBook, onAttendance }) {
  const rowClass = "grid min-h-[74px] w-full grid-cols-[60px_minmax(0,1fr)_auto] items-center gap-3 rounded-[13px] px-3 py-3 text-left sm:grid-cols-[70px_minmax(0,1fr)_auto] sm:px-4";
  const timeLabel = <span className={`text-lg font-bold tabular-nums ${available && !past && !appointment ? "text-primary" : "text-ink"}`}>{time}</span>;

  if (appointment) {
    const status = appointment.atendimento_id ? "Concluído" : appointment.status || "Agendado";
    const content = <>{timeLabel}<span className="min-w-0"><strong className="block truncate text-sm text-ink">{appointment.paciente_nome || "Paciente sem nome"}</strong><small className="block truncate text-[13px] text-muted">{appointment.tipo_consulta || "Consulta de fisioterapia"}</small></span><span className={`rounded-full px-3 py-1 text-xs font-bold ${TONES[status] || TONES.Agendado}`}>{status}</span></>;
    const askAttendance = needsAttendanceConfirmation(appointment, now);
    return <div className="overflow-hidden rounded-[13px] bg-canvas">
      <button type="button" onClick={() => onOpen(appointment)} className={`${rowClass} cursor-pointer bg-canvas transition-colors hover:bg-primary-soft/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}>{content}</button>
      {askAttendance && <AttendanceActions item={appointment} onAnswer={onAttendance} />}
    </div>;
  }

  if (available && !past) return <button type="button" onClick={() => onBook(time)} aria-label={`Marcar consulta às ${time}`} className={`${rowClass} cursor-pointer border border-dashed border-primary/40 bg-primary-soft/50 transition-colors hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}>{timeLabel}<span className="min-w-0"><strong className="block text-sm text-ink">Horário livre</strong><small className="block text-[13px] text-muted">Sem consulta marcada</small></span><span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-primary"><Plus size={13} aria-hidden="true" /> Marcar</span></button>;

  return <div className={`${rowClass} bg-canvas/70`}>{timeLabel}<span className="min-w-0"><strong className="block text-sm text-ink">Sem consulta marcada</strong><small className="block text-[13px] text-muted">{past ? "Horário já passou" : "Horário indisponível"}</small></span><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-muted">{past ? "Encerrado" : "Indisponível"}</span></div>;
}

function DayView({ day, items, now, onOpen, onBook, onAttendance }) {
  const { user } = useAuth();
  const date = day.format("YYYY-MM-DD");
  const { data: availableTimes = [], isPending: loadingAvailable, isError: availableError } = useQuery({
    queryKey: ["available-times", date, user?.profissional_id],
    enabled: Boolean(user?.profissional_id),
    queryFn: async () => (await api.get("/agendamentos/horarios-disponiveis", { params: { data: date, profissional_id: user.profissional_id } })).data,
  });
  const { data: possibleTimes = [], isPending: loadingPossible, isError: possibleError } = useQuery({
    queryKey: ["dashboard-horarios-da-agenda"],
    enabled: Boolean(user?.profissional_id),
    queryFn: async () => (await api.get("/agendamentos/horarios-da-agenda")).data,
  });
  const byTime = new Map(items.map((item) => [dayjs(item.data_hora).format("HH:mm"), item]));
  const available = new Set(availableTimes);
  const loading = Boolean(user?.profissional_id) && (loadingAvailable || loadingPossible);
  const error = availableError || possibleError;
  const times = [...new Set([...(error ? [] : possibleTimes), ...byTime.keys()])].sort();
  const pastDay = day.isBefore(now, "day");

  return <section className="rounded-2xl border border-border bg-white p-4 sm:p-5">
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-xl font-bold capitalize text-ink">{day.format("dddd, DD [de] MMMM")}</h2><p className="mt-1 text-sm text-muted">Consultas e horários sem agendamento, em ordem.</p></div>
      <span className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary">{items.length} {items.length === 1 ? "consulta" : "consultas"}</span>
    </header>
    {!user?.profissional_id && <p className="rounded-xl bg-canvas p-4 text-sm text-muted">Vincule um profissional à conta para consultar os horários da agenda.</p>}
    {loading && <p role="status" className="rounded-xl bg-canvas p-4 text-sm text-muted">Carregando todos os horários…</p>}
    {error && <p role="alert" className="mb-3 rounded-xl bg-[#f1ddda] p-4 text-sm text-[#75413d]">Não foi possível carregar os horários livres. As consultas marcadas continuam disponíveis abaixo.</p>}
    {!loading && <div className="grid gap-2.5 xl:grid-cols-2">
      {times.map((time) => <DaySlot key={time} time={time} appointment={byTime.get(time)} available={!error && available.has(time)} past={pastDay || (day.isSame(now, "day") && !dayjs(`${date} ${time}`).isAfter(now))} now={now} onOpen={onOpen} onBook={onBook} onAttendance={onAttendance} />)}
    </div>}
    {!loading && times.length === 0 && !error && <p className="rounded-xl bg-canvas p-4 text-sm text-muted">Nenhum horário configurado para este dia.</p>}
  </section>;
}
