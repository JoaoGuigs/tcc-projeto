import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { NewPatientModal } from "../components/NewPatientModal";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, CircleAlert, MessageCircleMore, Search, UsersRound } from "lucide-react";
import api from "../services/api";
import { formatPhone } from "../utils/phone";

dayjs.locale("pt-br");

const FILTERS = ["Todos os pacientes", "Em tratamento", "Avaliação", "Reavaliação", "Atenção"];

function initials(nome) {
  const parts = String(nome || "").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "•";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function relativeDay(date) {
  const d = dayjs(date).startOf("day");
  const today = dayjs().startOf("day");
  const diff = d.diff(today, "day");
  if (diff === 0) return "Hoje";
  if (diff === -1) return "Ontem";
  if (diff === 1) return "Amanhã";
  return d.format("DD MMM").replace(".", "");
}

function nextLabel(date) {
  const d = dayjs(date);
  const today = dayjs().startOf("day");
  const diff = d.startOf("day").diff(today, "day");
  if (diff === 0) return `Hoje · ${d.format("HH:mm")}`;
  if (diff === 1) return `Amanhã · ${d.format("HH:mm")}`;
  const weekday = d.format("ddd").replace("-feira", "").replace(".", "");
  const cap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${cap} · ${d.format("HH:mm")}`;
}

function situationOf(next) {
  if (!next) return "Atenção";
  const tipo = String(next.tipo_consulta || "").toLowerCase();
  if (/reavalia/.test(tipo)) return "Reavaliação";
  if (/avalia/.test(tipo)) return "Avaliação";
  return "Em tratamento";
}

function SituationBadge({ patient }) {
  const attention = patient.situacao === "Atenção";
  const tone = attention
    ? "bg-warning-soft text-[#78591d]"
    : patient.situacao === "Avaliação"
      ? "bg-arrived-soft text-[#6b4c89]"
      : "bg-primary-soft text-primary";
  return <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${tone}`}>{patient.situacao}</span>;
}

function PatientRow({ patient, onOpen }) {
  const attention = patient.situacao === "Atenção";
  return (
    <div className="grid min-h-[82px] grid-cols-[minmax(260px,1.55fr)_minmax(135px,.75fr)_minmax(180px,1fr)_150px_145px] items-center gap-4 border-b border-border px-5 transition last:border-b-0 hover:bg-[#fbfaf7]">
      <button type="button" onClick={() => onOpen(patient)} className="flex min-w-0 items-center gap-3 text-left">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold ${attention ? "bg-warning-soft text-[#78591d]" : "bg-primary-soft text-primary"}`}>{initials(patient.nome_completo)}</span>
        <span className="min-w-0"><strong className="block truncate text-[15px] text-ink">{patient.nome_completo}</strong><span className="mt-0.5 block text-xs text-muted">{patient.celular ? formatPhone(patient.celular) : "Telefone não informado"}</span></span>
      </button>
      <span className="text-sm text-ink">{patient.ultimo}</span>
      <span className={patient.proxima_atencao ? "text-sm font-bold text-[#78591d]" : "text-sm text-ink"}>{patient.proxima}</span>
      <span><SituationBadge patient={patient} /></span>
      <span className="flex items-center justify-end gap-2">
        {patient.celular && <a href={`https://wa.me/55${String(patient.celular).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" title="Abrir WhatsApp" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-white text-primary transition hover:bg-primary-soft"><MessageCircleMore size={17} /></a>}
        {attention ? <Link to={`/agendar?pacienteId=${patient.id}`} className="inline-flex h-9 items-center gap-1 rounded-full bg-primary px-3 text-xs font-bold text-white no-underline">Agendar <ArrowRight size={14} /></Link> : <button type="button" onClick={() => onOpen(patient)} className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-white px-3 text-xs font-bold text-primary hover:bg-primary-soft">Ver ficha <ArrowRight size={14} /></button>}
      </span>
    </div>
  );
}

function PatientCard({ patient, onOpen }) {
  return <article className="rounded-2xl border border-border bg-white p-4"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">{initials(patient.nome_completo)}</span><div className="min-w-0 flex-1"><strong className="block truncate text-[15px] text-ink">{patient.nome_completo}</strong><span className="text-xs text-muted">{patient.celular ? formatPhone(patient.celular) : "Telefone não informado"}</span></div><SituationBadge patient={patient} /></div><div className="my-4 grid grid-cols-2 gap-3 rounded-xl bg-canvas p-3"><div><span className="block text-[11px] uppercase text-muted">Último atendimento</span><strong className="text-sm text-ink">{patient.ultimo}</strong></div><div><span className="block text-[11px] uppercase text-muted">Próxima consulta</span><strong className={`text-sm ${patient.proxima_atencao ? "text-[#78591d]" : "text-ink"}`}>{patient.proxima}</strong></div></div><div className="flex gap-2">{patient.situacao === "Atenção" ? <Link to={`/agendar?pacienteId=${patient.id}`} className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-full bg-primary text-sm font-bold text-white no-underline">Agendar retorno <ArrowRight size={15} /></Link> : <button onClick={() => onOpen(patient)} className="h-10 flex-1 rounded-full bg-primary text-sm font-bold text-white">Abrir ficha</button>}{patient.celular && <a href={`https://wa.me/55${String(patient.celular).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary"><MessageCircleMore size={17} /></a>}</div></article>;
}

function ProfileModal({ patient, appointments, onClose }) {
  const { data: history = [], isPending } = useQuery({
    queryKey: ["attendance-history", patient.id],
    queryFn: async () => (await api.get(`/atendimentos/paciente/${patient.id}`)).data,
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-[520px] flex-col gap-3 overflow-auto rounded-[20px] border border-solid border-border bg-surface p-[22px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary">
              {initials(patient.nome_completo)}
            </div>
            <div>
              <h3 className="font-display text-[24px] font-semibold leading-[30px] text-ink">{patient.nome_completo}</h3>
              <p className="text-xs text-muted">{patient.celular || "—"}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm font-bold text-muted hover:bg-canvas">
            Fechar ✕
          </button>
        </div>
        <div className="grid gap-3 rounded-2xl bg-canvas p-4 sm:grid-cols-2">
          <div><span className="text-xs text-muted">Profissão</span><strong className="block text-sm text-ink">{patient.profissao || "Não informada"}</strong></div>
          <div><span className="text-xs text-muted">Convênio</span><strong className="block text-sm text-ink">{patient.nome_convenio || patient.convenio || "Particular"}</strong></div>
          <div className="sm:col-span-2"><span className="text-xs text-muted">Queixa principal</span><strong className="block text-sm text-ink">{patient.descricao_problema || "Não informada"}</strong></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-block rounded-full bg-primary-soft px-[10px] py-[6px] text-xs font-bold text-primary">{patient.situacao}</span>
          {patient.celular && <a href={`https://wa.me/55${String(patient.celular).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-block rounded-full bg-success-soft px-[10px] py-[6px] text-xs font-bold text-primary no-underline">Conversar no WhatsApp</a>}
        </div>
        <h4 className="text-sm font-bold text-ink">Próximas consultas</h4>
        {appointments.length === 0 ? (
          <p className="rounded-[12px] bg-canvas p-4 text-center text-sm text-muted">Sem consultas agendadas.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {appointments.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-[12px] bg-canvas px-4 py-3">
                <span className="w-[52px] shrink-0 text-sm font-bold text-ink">{dayjs(a.data_hora).format("HH:mm")}</span>
                <span className="flex min-w-0 grow flex-col">
                  <strong className="truncate text-sm text-ink">{dayjs(a.data_hora).format("DD [de] MMMM")}</strong>
                  <small className="truncate text-xs text-muted">{a.tipo_consulta || "Consulta de fisioterapia"}</small>
                </span>
                <span className="shrink-0 text-xs font-bold text-primary">{a.status}</span>
              </div>
            ))}
          </div>
        )}
        <h4 className="mt-2 text-sm font-bold text-ink">Histórico clínico</h4>
        {isPending && <p className="text-sm text-muted">Carregando histórico…</p>}
        {!isPending && history.length === 0 && <p className="rounded-[12px] bg-canvas p-4 text-center text-sm text-muted">Nenhum atendimento registrado.</p>}
        <div className="flex flex-col gap-2">
          {history.slice(0, 8).map((item) => (
            <article key={item.atendimento_id} className="rounded-[12px] border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-3"><strong className="text-sm text-ink">{dayjs(item.data_atendimento).format("DD/MM/YYYY")}</strong><span className="text-xs text-muted">{item.tipo_consulta}</span></div>
              {item.evolucao_clinica && <p className="mt-2 text-sm leading-5 text-muted">{item.evolucao_clinica}</p>}
              {item.procedimentos_realizados && <p className="mt-2 text-xs font-semibold text-primary">{item.procedimentos_realizados}</p>}
            </article>
          ))}
        </div>
        <Link
          to={`/agendar?pacienteId=${patient.id}`}
          className="inline-flex h-[46px] items-center justify-center rounded-full bg-primary px-[18px] text-sm font-bold text-surface no-underline hover:bg-[#245a54]"
        >
          + Marcar consulta
        </Link>
      </div>
    </div>
  );
}

export default function PacientesPage() {
  const { setPageTitle } = useOutletContext();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(FILTERS[0]);
  const [profile, setProfile] = useState(null);
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    setPageTitle("Pacientes");
  }, [setPageTitle]);

  const { data: patients = [], isPending: patientsLoading, isError: patientsError } = useQuery({
    queryKey: ["pacientes"],
    queryFn: async () => (await api.get("/pacientes")).data,
  });

  const { data: agenda = [] } = useQuery({
    queryKey: ["pacientes-agenda"],
    queryFn: async () => (await api.get("/agendamentos", {
      params: {
        dataInicio: dayjs().subtract(6, "month").format("YYYY-MM-DD"),
        dataFim: dayjs().add(6, "month").format("YYYY-MM-DD"),
      },
    })).data,
  });

  const rows = useMemo(() => {
    const now = dayjs();
    const active = agenda.filter((a) => a.status !== "Cancelado");
    return patients.map((p) => {
      const mine = active.filter((a) => String(a.paciente_id ?? "") === String(p.id) || (a.paciente_nome || "") === (p.nome_completo || ""));
      const past = mine.filter((a) => dayjs(a.data_hora).isBefore(now)).sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora));
      const future = mine.filter((a) => !dayjs(a.data_hora).isBefore(now) && !a.atendimento_id).sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
      const next = future[0] || null;
      return {
        ...p,
        id: p.id,
        nome_completo: p.nome_completo,
        celular: p.celular || p.telefone || "",
        ultimo: past[0] ? relativeDay(past[0].data_hora) : "—",
        proxima: next ? nextLabel(next.data_hora) : "Sem retorno",
        proxima_atencao: !next,
        situacao: situationOf(next),
        _appointments: future,
      };
    });
  }, [patients, agenda]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== FILTERS[0] && r.situacao !== filter) return false;
      if (!term) return true;
      return (r.nome_completo || "").toLowerCase().includes(term) || (r.celular || "").toLowerCase().includes(term);
    });
  }, [rows, search, filter]);

  const attentionCount = rows.filter((r) => r.situacao === "Atenção").length;
  const scheduledCount = rows.filter((r) => !r.proxima_atencao).length;

  useEffect(() => {
    const profileId = searchParams.get("perfil");
    if (!profileId || rows.length === 0) return;
    const selected = rows.find((row) => String(row.id) === profileId);
    if (selected) setProfile(selected);
  }, [rows, searchParams]);

  return (
    <div className="flex w-full flex-1 flex-col gap-[22px] text-[12px] antialiased">
      {/* Topo padronizado */}
      <PageHeader eyebrow="Busca rápida e acompanhamento contínuo" title="Pacientes" />

      <div className="flex flex-col gap-4">
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><UsersRound size={20} /></span><div><strong className="block text-2xl leading-none text-ink">{rows.length}</strong><span className="mt-1 block text-sm text-muted">Pacientes cadastrados</span></div></div>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-success-soft text-primary"><CalendarClock size={20} /></span><div><strong className="block text-2xl leading-none text-primary">{scheduledCount}</strong><span className="mt-1 block text-sm text-muted">Com próxima consulta</span></div></div>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-warning-soft text-[#78591d]"><CircleAlert size={20} /></span><div><strong className="block text-2xl leading-none text-[#78591d]">{attentionCount}</strong><span className="mt-1 block text-sm text-muted">Precisam de retorno</span></div></div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-canvas px-4 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10"><Search size={18} className="shrink-0 text-muted" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone" className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted" />{search && <button type="button" onClick={() => setSearch("")} className="text-xs font-bold text-primary">Limpar</button>}</label>
            <div className="flex gap-1 overflow-x-auto rounded-xl bg-segment p-1" aria-label="Filtrar pacientes">{FILTERS.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition ${filter === item ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}>{item}</button>)}</div>
          </div>
          <div className="mt-3 flex items-center justify-between px-1 text-xs text-muted"><span>Mostrando <strong className="text-ink">{filtered.length}</strong> de {rows.length} pacientes</span>{(search || filter !== FILTERS[0]) && <button type="button" onClick={() => { setSearch(""); setFilter(FILTERS[0]); }} className="font-bold text-primary">Limpar filtros</button>}</div>
        </section>

        <section className="hidden overflow-hidden rounded-2xl border border-border bg-white lg:block">
          <div className="overflow-x-auto">
            <div className="min-w-[1050px]">
              <div className="grid h-12 grid-cols-[minmax(260px,1.55fr)_minmax(135px,.75fr)_minmax(180px,1fr)_150px_145px] items-center gap-4 border-b border-border bg-table-head px-5 text-[11px] font-bold uppercase tracking-[0.07em] text-muted"><span>Paciente</span><span>Último atendimento</span><span>Próxima consulta</span><span>Situação</span><span className="text-right">Ações</span></div>
              {filtered.map((patient) => <PatientRow key={patient.id} patient={patient} onOpen={setProfile} />)}
            </div>
          </div>
        </section>

        <section className="grid gap-3 lg:hidden">{filtered.map((patient) => <PatientCard key={patient.id} patient={patient} onOpen={setProfile} />)}</section>

        {patientsLoading && <div className="rounded-2xl border border-border bg-white p-10 text-center text-sm text-muted">Carregando pacientes…</div>}
        {patientsError && <div className="rounded-2xl bg-[#f7dfdc] p-5 text-center text-sm font-bold text-[#9a3832]">Não foi possível carregar os pacientes.</div>}
        {!patientsLoading && !patientsError && filtered.length === 0 && <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-white p-10 text-center"><UsersRound size={28} className="text-muted" /><strong className="text-[15px] text-ink">{search || filter !== FILTERS[0] ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}</strong><span className="text-sm text-muted">{search || filter !== FILTERS[0] ? "Tente mudar a busca ou limpar os filtros." : "Cadastre o primeiro paciente para começar."}</span>{!search && filter === FILTERS[0] && <button type="button" onClick={() => setNewPatientOpen(true)} className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white">+ Cadastrar paciente</button>}</div>}
      </div>

      {profile && (
        <ProfileModal
          patient={profile}
          appointments={profile._appointments || []}
          onClose={() => {
            setProfile(null);
            setSearchParams({}, { replace: true });
          }}
        />
      )}

      <NewPatientModal open={newPatientOpen} onClose={() => setNewPatientOpen(false)} />
    </div>
  );
}
