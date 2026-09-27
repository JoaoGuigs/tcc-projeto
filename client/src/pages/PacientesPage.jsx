import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@mui/material";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { ArrowRight, ChevronLeft, ChevronRight, MessageCircleMore, Search, UsersRound, X } from "lucide-react";
import { NewPatientModal } from "../components/NewPatientModal";
import api from "../services/api";
import { formatPhone } from "../utils/phone";

dayjs.locale("pt-br");

const FILTERS = ["Todos", "Em tratamento", "Retorno pendente", "Últimos atendidos"];
const focusClass = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const EMPTY_LIST = [];
const PAGE_SIZE = 10;

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "•";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts.at(-1)[0]).toUpperCase();
}

function dateLabel(value) {
  if (!value) return "—";
  const date = dayjs(value);
  if (date.isSame(dayjs(), "day")) return `Hoje · ${date.format("HH:mm")}`;
  return date.format("DD MMM · HH:mm").replace(".", "");
}

function statusOf(row) {
  if (row.next) return String(row.next.tipo_consulta || "").toLowerCase().includes("avalia") ? "Avaliação" : "Em tratamento";
  return row.last ? "Retorno pendente" : "Sem consulta";
}

function StatusBadge({ status }) {
  const tone = status === "Retorno pendente" ? "bg-warning-soft text-[#78591d]" : status === "Sem consulta" ? "bg-[#f0ddda] text-[#75413d]" : status === "Avaliação" ? "bg-arrived-soft text-[#674781]" : "bg-primary-soft text-primary";
  return <span className={`inline-flex min-h-8 items-center rounded-full px-3 text-[13px] font-bold whitespace-nowrap ${tone}`}>{status}</span>;
}

function Metric({ label, value, detail, attention = false }) {
  return <div className="min-h-[112px] rounded-2xl border border-border bg-white px-5 py-4"><p className="text-[15px] font-bold text-muted">{label}</p><div className="mt-1 flex flex-wrap items-baseline gap-x-3"><strong className={`text-[32px] leading-[46px] tabular-nums ${attention ? "text-[#78591d]" : "text-primary"}`}>{value}</strong><span className="text-[13px] text-muted">{detail}</span></div></div>;
}

function PatientRow({ patient, onOpen }) {
  return <div className="grid min-h-[68px] grid-cols-[minmax(190px,1.4fr)_minmax(135px,.85fr)_minmax(140px,1fr)_minmax(150px,1fr)_minmax(130px,1fr)_92px] items-center gap-4 border-b border-border px-5 last:border-b-0 hover:bg-[#fbfaf7]">
    <button type="button" onClick={() => onOpen(patient)} className={`min-w-0 cursor-pointer text-left text-base font-bold text-ink transition-colors hover:text-primary hover:underline ${focusClass}`}>{patient.nome_completo}</button>
    <span className="text-[15px] text-muted">{patient.celular ? formatPhone(patient.celular) : "—"}</span>
    <span className="text-[15px] font-semibold text-ink">{dateLabel(patient.last?.data_hora)}</span>
    <span className="text-[15px] font-semibold text-ink">{patient.next ? dateLabel(patient.next.data_hora) : "Não agendada"}</span>
    <span><StatusBadge status={patient.status} /></span>
    <button type="button" onClick={() => onOpen(patient)} className={`inline-flex min-h-11 cursor-pointer items-center justify-end gap-1 text-sm font-bold text-primary transition-all duration-150 hover:gap-2 hover:text-[#245a54] active:scale-[0.97] motion-reduce:transform-none ${focusClass}`}>Ver perfil <ArrowRight size={15} aria-hidden="true" /></button>
  </div>;
}

function PatientCard({ patient, onOpen }) {
  return <article className="rounded-2xl border border-border bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-2"><button type="button" onClick={() => onOpen(patient)} className={`text-left text-base font-bold text-ink ${focusClass}`}>{patient.nome_completo}</button><StatusBadge status={patient.status} /></div><p className="mt-1 text-sm text-muted">{patient.celular ? formatPhone(patient.celular) : "Telefone não informado"}</p><dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-canvas p-3 text-sm"><div><dt className="text-muted">Último atendimento</dt><dd className="mt-1 font-semibold text-ink">{dateLabel(patient.last?.data_hora)}</dd></div><div><dt className="text-muted">Próxima consulta</dt><dd className="mt-1 font-semibold text-ink">{patient.next ? dateLabel(patient.next.data_hora) : "Não agendada"}</dd></div></dl><button type="button" onClick={() => onOpen(patient)} className={`mt-3 inline-flex min-h-11 cursor-pointer items-center gap-1 text-sm font-bold text-primary transition-all duration-150 hover:gap-2 hover:text-[#245a54] active:scale-[0.97] motion-reduce:transform-none ${focusClass}`}>Ver perfil <ArrowRight size={16} aria-hidden="true" /></button></article>;
}

function ProfileModal({ patient, onClose }) {
  const history = useQuery({ queryKey: ["attendance-history", patient.id], queryFn: async () => (await api.get(`/atendimentos/paciente/${patient.id}`)).data });
  const phone = String(patient.celular || "").replace(/\D/g, "");
  return <Dialog open onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="patient-profile-title" PaperProps={{ sx: { borderRadius: "16px", border: "1px solid #e6e2da", boxShadow: "none" } }}><DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
    <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-soft font-bold text-primary">{initials(patient.nome_completo)}</span><div className="min-w-0"><h2 id="patient-profile-title" className="text-2xl font-bold text-ink">{patient.nome_completo}</h2><p className="text-sm text-muted">{patient.celular ? formatPhone(patient.celular) : "Telefone não informado"}</p></div></div><button type="button" onClick={onClose} aria-label="Fechar perfil" className={`grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-xl text-muted transition-all duration-150 hover:-translate-y-px hover:bg-canvas hover:text-ink hover:shadow-sm active:translate-y-0 active:scale-[0.95] motion-reduce:transform-none ${focusClass}`}><X size={20} aria-hidden="true" /></button></div>
    <dl className="mt-5 grid gap-4 rounded-xl bg-canvas p-4 text-sm sm:grid-cols-2"><div><dt className="text-muted">Profissão</dt><dd className="font-semibold text-ink">{patient.profissao || "Não informada"}</dd></div><div><dt className="text-muted">Convênio</dt><dd className="font-semibold text-ink">{patient.nome_convenio || "Particular"}</dd></div><div className="sm:col-span-2"><dt className="text-muted">Queixa relatada</dt><dd className="font-semibold text-ink">{patient.descricao_problema || "Não informada"}</dd></div></dl>
    <div className="mt-5 flex flex-wrap gap-2"><StatusBadge status={patient.status} />{phone && <a href={`https://wa.me/55${phone}`} target="_blank" rel="noreferrer" className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm font-bold text-primary no-underline transition-all duration-150 hover:-translate-y-px hover:border-primary/40 hover:bg-primary-soft hover:shadow-sm active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none ${focusClass}`}><MessageCircleMore size={17} aria-hidden="true" /> Abrir WhatsApp</a>}</div>
    <h3 className="mt-6 text-lg font-bold text-ink">Próximas consultas</h3>
    {patient.future.length ? <div className="mt-2 divide-y divide-border rounded-xl border border-border px-4">{patient.future.slice(0, 5).map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><strong className="text-ink">{dateLabel(item.data_hora)}</strong><span className="text-muted">{item.tipo_consulta || "Consulta"} · {item.status}</span></div>)}</div> : <p className="mt-2 rounded-xl bg-canvas p-4 text-sm text-muted">Nenhuma consulta futura agendada.</p>}
    <h3 className="mt-6 text-lg font-bold text-ink">Histórico clínico</h3>
    {history.isPending && <p role="status" className="mt-2 text-sm text-muted">Carregando histórico…</p>}
    {history.isError && <p role="alert" className="mt-2 text-sm text-[#75413d]">Não foi possível carregar o histórico. <button type="button" onClick={() => history.refetch()} className="cursor-pointer font-bold underline transition-colors hover:text-[#613330] focus-visible:outline-2 focus-visible:outline-primary">Tentar novamente</button></p>}
    {history.isSuccess && !history.data?.length && <p className="mt-2 rounded-xl bg-canvas p-4 text-sm text-muted">Nenhum atendimento registrado.</p>}
    {history.isSuccess && <div className="mt-2 divide-y divide-border">{history.data?.slice(0, 8).map((item) => <article key={item.atendimento_id} className="py-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong className="text-ink">{dayjs(item.data_atendimento).format("DD/MM/YYYY")}</strong><span className="text-muted">{item.tipo_consulta || "Atendimento"}</span></div>{item.evolucao_clinica && <p className="mt-2 whitespace-pre-wrap text-muted">{item.evolucao_clinica}</p>}{item.procedimentos_realizados && <p className="mt-2 text-muted">Procedimentos: {item.procedimentos_realizados}</p>}</article>)}</div>}
    <Link to={`/agendar?pacienteId=${patient.id}`} onClick={onClose} className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white no-underline shadow-[0_1px_0_rgba(31,42,36,0.08)] transition-all duration-150 hover:-translate-y-px hover:bg-[#245a54] hover:shadow-md active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none ${focusClass}`}>Marcar consulta <ArrowRight size={16} className="ml-2" aria-hidden="true" /></Link>
  </DialogContent></Dialog>;
}

export default function PacientesPage() {
  const { setPageTitle } = useOutletContext();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(FILTERS[0]);
  const [page, setPage] = useState(1);
  const [profileId, setProfileId] = useState(null);
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => setPageTitle("Pacientes"), [setPageTitle]);

  const patientsQuery = useQuery({ queryKey: ["pacientes"], queryFn: async () => (await api.get("/pacientes")).data });
  const pastQuery = useQuery({ queryKey: ["pacientes-atendimentos-recentes"], queryFn: async () => (await api.get("/agendamentos", { params: { dataInicio: dayjs().subtract(90, "day").format("YYYY-MM-DD"), dataFim: dayjs().format("YYYY-MM-DD"), limite: 200 } })).data });
  const futureQuery = useQuery({ queryKey: ["pacientes-proximas-consultas"], queryFn: async () => (await api.get("/agendamentos", { params: { dataInicio: dayjs().format("YYYY-MM-DD"), dataFim: dayjs().add(180, "day").format("YYYY-MM-DD"), limite: 200 } })).data });
  const patients = patientsQuery.data || EMPTY_LIST;
  const agendaLoading = pastQuery.isPending || futureQuery.isPending;
  const agendaError = pastQuery.isError || futureQuery.isError;
  const agendaLimitReached = (pastQuery.data?.length || 0) >= 200 || (futureQuery.data?.length || 0) >= 200;
  const listLoading = patientsQuery.isPending || agendaLoading;
  const listError = patientsQuery.isError || agendaError;

  const rows = useMemo(() => {
    const appointments = new Map();
    const now = dayjs();
    for (const item of [...(pastQuery.data || []), ...(futureQuery.data || [])]) if (item.id && !appointments.has(item.id)) appointments.set(item.id, item);
    const byPatient = new Map();
    for (const item of appointments.values()) {
      const id = String(item.paciente_id);
      if (!byPatient.has(id)) byPatient.set(id, { last: null, future: [] });
      const group = byPatient.get(id);
      if (item.atendimento_id && dayjs(item.data_hora).isBefore(now) && (!group.last || dayjs(item.data_hora).isAfter(group.last.data_hora))) group.last = item;
      if (!dayjs(item.data_hora).isBefore(now) && !item.atendimento_id) group.future.push(item);
    }
    return patients.map((patient) => {
      const group = byPatient.get(String(patient.id)) || { last: null, future: [] };
      const future = group.future.sort((a, b) => dayjs(a.data_hora).valueOf() - dayjs(b.data_hora).valueOf());
      const row = { ...patient, last: group.last, future, next: future[0] || null };
      return { ...row, status: statusOf(row) };
    });
  }, [patients, pastQuery.data, futureQuery.data]);

  const filtered = useMemo(() => {
    const text = search.trim().toLocaleLowerCase("pt-BR");
    const digits = text.replace(/\D/g, "");
    const result = rows.filter((row) => {
      if (filter === "Em tratamento" && row.status !== "Em tratamento" && row.status !== "Avaliação") return false;
      if (filter === "Retorno pendente" && row.status !== "Retorno pendente") return false;
      if (filter === "Últimos atendidos" && !row.last) return false;
      return !text || row.nome_completo.toLocaleLowerCase("pt-BR").includes(text) || Boolean(digits && String(row.celular || "").replace(/\D/g, "").includes(digits));
    });
    return filter === "Últimos atendidos" ? [...result].sort((a, b) => dayjs(b.last.data_hora).valueOf() - dayjs(a.last.data_hora).valueOf()) : result;
  }, [rows, search, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
  const firstVisible = filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastVisible = Math.min(page * PAGE_SIZE, filtered.length);

  useEffect(() => setPage((current) => Math.min(current, pageCount)), [pageCount]);

  const scheduledCount = rows.filter((row) => Boolean(row.next)).length;
  const pendingRows = rows.filter((row) => row.last && !row.next).sort((a, b) => dayjs(b.last.data_hora).valueOf() - dayjs(a.last.data_hora).valueOf());
  const attendedThisMonth = rows.filter((row) => row.last && dayjs(row.last.data_hora).isSame(dayjs(), "month")).length;
  const profile = rows.find((row) => String(row.id) === String(profileId || searchParams.get("perfil")));

  function closeProfile() {
    setProfileId(null);
    if (searchParams.has("perfil")) setSearchParams((params) => { const next = new URLSearchParams(params); next.delete("perfil"); return next; }, { replace: true });
  }

  return <div className="flex w-full min-w-0 flex-1 flex-col gap-5 pb-4 text-ink">
    <header className="flex flex-wrap items-start justify-between gap-4 pb-1"><div><p className="text-xs font-bold tracking-[.06em] text-primary">FISIOCARE / PACIENTES</p><h1 className="mt-1 text-[38px] font-bold leading-tight tracking-[-.025em]">Pacientes</h1><p className="mt-1 text-base text-muted">Encontre informações, acompanhe retornos e acesse rapidamente o histórico clínico.</p></div><button type="button" onClick={() => setNewPatientOpen(true)} className={`inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-[15px] font-bold text-white shadow-[0_1px_0_rgba(31,42,36,0.08)] transition-all duration-150 hover:-translate-y-px hover:bg-[#245a54] hover:shadow-md active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none ${focusClass}`}>+ Novo paciente</button></header>

    <section aria-label="Indicadores de pacientes" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Pacientes cadastrados" value={patientsQuery.isPending ? "—" : patients.length} detail="base cadastrada" /><Metric label="Em tratamento" value={agendaLoading || agendaError ? "—" : scheduledCount} detail="com próxima consulta" /><Metric label="Retorno pendente" value={agendaLoading || agendaError ? "—" : pendingRows.length} detail="sem próxima consulta" attention /><Metric label="Atendidos no mês" value={agendaLoading || agendaError ? "—" : attendedThisMonth} detail="com registro clínico" /></section>

    <section aria-label="Busca e filtros" className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-3 xl:flex-row xl:items-center xl:justify-between"><label className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl px-3 focus-within:outline-2 focus-within:outline-primary"><Search size={18} className="shrink-0 text-muted" aria-hidden="true" /><span className="sr-only">Buscar paciente por nome ou telefone</span><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar por nome ou telefone" className="w-full min-w-0 bg-transparent text-base text-ink outline-none placeholder:text-muted" /></label><div role="group" aria-label="Filtrar pacientes" className="flex flex-wrap gap-2">{FILTERS.map((item) => <button key={item} type="button" onClick={() => { setFilter(item); setPage(1); }} aria-pressed={filter === item} className={`min-h-10 cursor-pointer rounded-xl px-3 text-[13px] font-bold transition-all duration-150 active:scale-[0.96] motion-reduce:transform-none ${focusClass} ${filter === item ? "bg-primary text-white shadow-sm" : "bg-segment text-muted hover:-translate-y-px hover:bg-canvas hover:text-ink hover:shadow-sm"}`}>{item}</button>)}</div></section>

    {agendaError && <p role="alert" className="rounded-xl bg-[#f1ddda] p-4 text-sm text-[#75413d]">Não foi possível carregar os agendamentos. Alguns indicadores podem estar incompletos. <button type="button" onClick={() => { pastQuery.refetch(); futureQuery.refetch(); }} className="cursor-pointer font-bold underline transition-colors hover:text-[#613330] focus-visible:outline-2 focus-visible:outline-primary">Tentar novamente</button></p>}
    {agendaLimitReached && <p role="status" className="rounded-xl bg-warning-soft p-4 text-sm text-[#78591d]">Há mais agendamentos do que o limite de 200 registros por período. Os indicadores de consultas podem estar incompletos.</p>}
    {patientsQuery.isError && <p role="alert" className="rounded-xl bg-[#f1ddda] p-4 text-sm text-[#75413d]">Não foi possível carregar os pacientes. <button type="button" onClick={() => patientsQuery.refetch()} className="cursor-pointer font-bold underline transition-colors hover:text-[#613330] focus-visible:outline-2 focus-visible:outline-primary">Tentar novamente</button></p>}

    <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(300px,350px)]"><section aria-label="Lista de pacientes" className="min-w-0 overflow-hidden rounded-2xl border border-border bg-white"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3 text-sm text-muted"><span>Mostrando <strong className="text-ink">{firstVisible}–{lastVisible}</strong> de {filtered.length} pacientes</span>{(search || filter !== FILTERS[0]) && <button type="button" onClick={() => { setSearch(""); setFilter(FILTERS[0]); setPage(1); }} className={`min-h-9 cursor-pointer font-bold text-primary transition-colors hover:text-[#245a54] hover:underline ${focusClass}`}>Limpar filtros</button>}</div><div className="hidden overflow-x-auto lg:block"><div className="min-w-[1020px]"><div className="grid min-h-14 grid-cols-[minmax(190px,1.4fr)_minmax(135px,.85fr)_minmax(140px,1fr)_minmax(150px,1fr)_minmax(130px,1fr)_92px] items-center gap-4 border-b border-border bg-table-head px-5 text-xs font-bold uppercase tracking-[.06em] text-muted"><span>Paciente</span><span>Telefone</span><span>Último atendimento</span><span>Próxima consulta</span><span>Status</span><span className="text-right">Ação</span></div>{!listLoading && !listError && pageRows.map((row) => <PatientRow key={row.id} patient={row} onOpen={(item) => setProfileId(item.id)} />)}</div></div><div className="grid gap-3 p-3 lg:hidden">{!listLoading && !listError && pageRows.map((row) => <PatientCard key={row.id} patient={row} onOpen={(item) => setProfileId(item.id)} />)}</div>{listLoading && <p role="status" className="p-8 text-center text-sm text-muted">Carregando dados dos pacientes…</p>}{!listLoading && !listError && !filtered.length && <div className="grid justify-items-center gap-2 p-10 text-center"><UsersRound size={28} className="text-muted" aria-hidden="true" /><strong>{search || filter !== FILTERS[0] ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}</strong><p className="text-sm text-muted">{search || filter !== FILTERS[0] ? "Tente outra busca ou limpe os filtros." : "Cadastre o primeiro paciente para começar."}</p></div>}{!listLoading && !listError && filtered.length > PAGE_SIZE && <nav aria-label="Paginação de pacientes" className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5"><span className="text-sm text-muted">Página <strong className="text-ink">{page}</strong> de {pageCount}</span><div className="flex items-center gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Página anterior" className={`inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-xl border border-border px-3 text-sm font-bold text-ink transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-45 ${focusClass}`}><ChevronLeft size={17} aria-hidden="true" />Anterior</button><button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} aria-label="Próxima página" className={`inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-xl border border-border px-3 text-sm font-bold text-ink transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-45 ${focusClass}`}>Próxima<ChevronRight size={17} aria-hidden="true" /></button></div></nav>}</section>

    <aside aria-labelledby="patient-attention-title" className="h-fit rounded-2xl border border-border bg-white p-5 2xl:min-h-[644px]"><div className="flex flex-wrap items-center justify-between gap-2"><h2 id="patient-attention-title" className="text-[22px] font-bold">Atenções</h2><span className="rounded-full bg-warning-soft px-3 py-1 text-[13px] font-bold text-[#78591d]">{agendaLoading || agendaError ? "—" : pendingRows.length} pendentes</span></div><p className="mt-3 text-sm leading-5 text-muted">Pacientes atendidos recentemente sem próxima consulta marcada.</p>{agendaLoading && <p role="status" className="mt-6 text-sm text-muted">Verificando retornos…</p>}{!agendaLoading && !agendaError && !pendingRows.length && <p className="mt-6 rounded-xl bg-canvas p-4 text-sm text-muted">Nenhum retorno pendente nos registros recentes.</p>}<div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">{!agendaLoading && !agendaError && pendingRows.slice(0, 4).map((row) => <article key={row.id} className="rounded-xl bg-canvas p-4"><h3 className="text-[15px] font-bold text-ink">{row.nome_completo}</h3><p className="mt-1 text-[13px] text-muted">Último atendimento: {dateLabel(row.last.data_hora)}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1"><Link to={`/agendar?pacienteId=${row.id}`} className={`inline-flex min-h-9 items-center text-[13px] font-bold text-primary no-underline transition-colors hover:text-[#245a54] hover:underline ${focusClass}`}>Agendar retorno <ArrowRight size={14} className="ml-1" aria-hidden="true" /></Link>{row.celular && <a href={`https://wa.me/55${String(row.celular).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className={`inline-flex min-h-9 items-center text-[13px] font-bold text-primary no-underline transition-colors hover:text-[#245a54] hover:underline ${focusClass}`}>Abrir WhatsApp</a>}</div></article>)}</div><p className="mt-5 text-xs leading-5 text-muted">Indicadores baseados nos últimos 90 dias de atendimentos e próximos 180 dias de agendamentos.</p></aside></div>

    {!listLoading && !listError && profile && <ProfileModal patient={profile} onClose={closeProfile} />}
    <NewPatientModal open={newPatientOpen} onClose={() => setNewPatientOpen(false)} onCreated={() => { setSearch(""); setFilter(FILTERS[0]); setPage(1); }} />
  </div>;
}
