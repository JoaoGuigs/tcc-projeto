import { useEffect, useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  MessageCircleMore,
  Plus,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../auth/AuthContext";
import api from "../services/api";
import { getDateRange } from "../utils/dateRanges";
import { getDashboardSummary } from "../utils/dashboard";

dayjs.locale("pt-br");

function formatToday() {
  return dayjs().format("dddd, DD [de] MMMM").replace("-feira", "");
}

function greetingForHour(hour) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function firstName(nome, fallback = "Ana") {
  if (!nome) return fallback;
  const parts = String(nome).split(/\s+/).filter(Boolean);
  const clean = parts.filter((part) => !/^(dra?\.?)$/i.test(part));
  return clean[0] || parts[0] || fallback;
}

function pillStyle(status, hasAtendimento) {
  if (hasAtendimento) return "bg-done-soft text-primary";
  const normalized = String(status || "").toLowerCase();
  if (/chegou/.test(normalized)) return "bg-arrived-soft text-[#6B4C89]";
  if (/confirm/.test(normalized)) return "bg-success-soft text-primary";
  if (/vago|dispon|livre|encaixe/.test(normalized)) return "bg-primary-soft text-primary";
  return "bg-warning-soft text-[#7A5A1E]";
}

function pillLabel(status, hasAtendimento) {
  if (hasAtendimento) return "Concluído";
  const normalized = String(status || "").toLowerCase();
  if (/chegou/.test(normalized)) return "Chegou";
  if (/confirm/.test(normalized)) return "Confirmada";
  if (/vago|dispon|livre|encaixe/.test(normalized)) return "Vago";
  return status || "Aguardando";
}

function StatusPill({ status, hasAtendimento }) {
  return (
    <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${pillStyle(status, hasAtendimento)}`}>
      {pillLabel(status, hasAtendimento)}
    </span>
  );
}

function AgendaRow({ appointment }) {
  const hasAtendimento = Boolean(appointment.atendimento_id);
  return (
    <Link
      to={`/pacientes?perfil=${appointment.paciente_id}`}
      className="group grid min-h-[70px] grid-cols-[58px_minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] border border-transparent bg-canvas px-3.5 py-2.5 no-underline transition-all hover:border-border hover:bg-primary-soft/60 sm:grid-cols-[70px_minmax(0,1fr)_auto_20px] sm:px-4"
    >
      <span className="font-display text-[18px] font-semibold leading-none text-ink">
        {dayjs(appointment.data_hora).format("HH:mm")}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <strong className="truncate text-[15px] font-bold leading-5 text-ink">
          {appointment.paciente_nome || "Paciente sem nome"}
        </strong>
        <small className="truncate text-xs leading-[18px] text-muted">
          {appointment.tipo_consulta || "Consulta de fisioterapia"}
        </small>
      </span>
      <StatusPill status={appointment.status} hasAtendimento={hasAtendimento} />
      <ArrowRight size={16} className="hidden text-muted transition-transform group-hover:translate-x-0.5 sm:block" />
    </Link>
  );
}

function AvailableRow({ time }) {
  return (
    <Link
      to="/agendar"
      className="group grid min-h-[70px] grid-cols-[58px_minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] border border-dashed border-[#9BBDB7] bg-primary-soft/60 px-3.5 py-2.5 no-underline transition-colors hover:bg-primary-soft sm:grid-cols-[70px_minmax(0,1fr)_auto_20px] sm:px-4"
    >
      <span className="font-display text-[18px] font-semibold leading-none text-primary">{time}</span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <strong className="truncate text-[15px] font-bold leading-5 text-ink">Horário disponível</strong>
        <small className="truncate text-xs leading-[18px] text-muted">Bom horário para um encaixe</small>
      </span>
      <StatusPill status="Vago" />
      <Plus size={16} className="hidden text-primary transition-transform group-hover:rotate-90 sm:block" />
    </Link>
  );
}

const metricStyles = {
  success: { icon: "bg-success-soft text-primary", value: "text-primary" },
  warning: { icon: "bg-warning-soft text-[#7A5A1E]", value: "text-[#8C6A28]" },
  neutral: { icon: "bg-canvas text-ink", value: "text-ink" },
};

function Metric({ icon: Icon, label, value, detail, tone = "success" }) {
  const styles = metricStyles[tone];
  return (
    <article className="flex min-h-[158px] flex-col justify-between rounded-[20px] border border-border bg-surface p-[18px] shadow-[0_1px_0_rgba(31,42,36,0.02)] xl:col-span-2">
      <div className={`grid h-9 w-9 place-items-center rounded-[11px] ${styles.icon}`}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="mt-5">
        <strong className={`font-display text-[36px] font-semibold leading-none tracking-[-0.04em] ${styles.value}`}>
          {value}
        </strong>
        <p className="mt-2 text-sm font-semibold leading-[18px] text-ink">{label}</p>
        <p className="mt-0.5 text-xs leading-[18px] text-muted">{detail}</p>
      </div>
    </article>
  );
}

const priorityStyles = {
  primary: { icon: "bg-primary text-white", action: "bg-primary text-white hover:bg-[#245a54]" },
  warning: { icon: "bg-warning-soft text-[#7A5A1E]", action: "bg-warning-soft text-[#7A5A1E] hover:bg-[#eadab6]" },
  soft: { icon: "bg-primary-soft text-primary", action: "bg-primary-soft text-primary hover:bg-[#cce0db]" },
};

function PriorityCard({ icon: Icon, title, detail, label, tone = "primary", to = "/agendar" }) {
  const styles = priorityStyles[tone];
  return (
    <article className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 rounded-[16px] bg-canvas p-3.5">
      <span className={`grid h-10 w-10 place-items-center rounded-[12px] ${styles.icon}`}>
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <strong className="block text-[15px] font-bold leading-5 text-ink">{title}</strong>
        <p className="mt-0.5 text-xs leading-[18px] text-muted">{detail}</p>
        <Link
          to={to}
          className={`mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold no-underline transition-colors ${styles.action}`}
        >
          {label} <ArrowRight size={13} />
        </Link>
      </div>
    </article>
  );
}

export default function HomePage() {
  const { setPageTitle } = useOutletContext();
  const { user } = useAuth();
  const range = useMemo(() => getDateRange("hoje"), []);

  const { data: fetched = [], isLoading, isError } = useQuery({
    queryKey: ["dashboard-agendamentos", range],
    queryFn: async () => (await api.get("/agendamentos", { params: range })).data,
  });

  const appointments = useMemo(() => {
    const active = fetched.filter((item) => item.status !== "Cancelado");
    return [...active].sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
  }, [fetched]);

  const { data: availableTimes = [] } = useQuery({
    queryKey: ["dashboard-horarios-disponiveis", range, user?.profissional_id],
    queryFn: async () => (await api.get("/agendamentos/horarios-disponiveis", {
      params: { data: range.dataInicio, profissional_id: user.profissional_id },
    })).data,
    enabled: Boolean(user?.profissional_id),
  });

  const usefulAvailableTimes = useMemo(() => availableTimes.filter((time) => {
    const slot = dayjs(`${range.dataInicio} ${time}`);
    return slot.isAfter(dayjs());
  }), [availableTimes, range.dataInicio]);

  const summary = getDashboardSummary(appointments);
  const pending = useMemo(
    () => [...summary.pending].sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora)),
    [summary],
  );
  const next = pending.find((item) => dayjs(item.data_hora).isAfter(dayjs())) || pending[0] || null;
  const nextIsPast = next ? dayjs(next.data_hora).isBefore(dayjs()) : false;

  const confirmed = appointments.filter((item) => /confirm/i.test(item.status || "")).length;
  const waiting = appointments.filter(
    (item) => !/confirm/i.test(item.status || "") && !item.atendimento_id,
  ).length;
  const completed = appointments.filter((item) => Boolean(item.atendimento_id)).length;
  const total = appointments.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const visible = appointments.slice(0, 5);

  const waitingAppointment = appointments.find(
    (item) => !item.atendimento_id && !/confirm|chegou/i.test(item.status || ""),
  );
  const readyForRecord = appointments.find(
    (item) => !item.atendimento_id && /confirm|chegou/i.test(item.status || "") && dayjs(item.data_hora).isBefore(dayjs()),
  );
  const priorities = [
    waitingAppointment && {
      icon: MessageCircleMore,
      title: `Confirmar presença de ${firstName(waitingAppointment.paciente_nome, "paciente")}`,
      detail: `Consulta marcada para ${dayjs(waitingAppointment.data_hora).format("HH:mm")}`,
      label: "Abrir WhatsApp",
      tone: "primary",
      to: "/whatsapp",
    },
    readyForRecord && {
      icon: FileText,
      title: `Registrar atendimento de ${firstName(readyForRecord.paciente_nome, "paciente")}`,
      detail: `Atendimento de hoje às ${dayjs(readyForRecord.data_hora).format("HH:mm")}`,
      label: "Registrar agora",
      tone: "warning",
      to: `/atendimentos/novo?pacienteId=${readyForRecord.paciente_id}&agendamentoId=${readyForRecord.id}`,
    },
    usefulAvailableTimes[0] && {
      icon: CalendarDays,
      title: `Aproveitar o horário das ${usefulAvailableTimes[0]}`,
      detail: "Este horário ainda está livre na agenda de hoje",
      label: "Marcar consulta",
      tone: "soft",
      to: "/agendar",
    },
  ].filter(Boolean);

  const greeting = `${greetingForHour(dayjs().hour())}, ${firstName(user?.nome)}`;

  useEffect(() => {
    setPageTitle(greeting);
  }, [setPageTitle, greeting]);

  return (
    <div className="flex w-full flex-col gap-6 pb-2 text-[12px] antialiased">
      <PageHeader eyebrow={`Hoje · ${formatToday()}`} title={greeting} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-12">
        <article className="relative isolate flex min-h-[158px] flex-col justify-between overflow-hidden rounded-[24px] bg-primary p-5 text-surface sm:col-span-2 sm:p-6 xl:col-span-6">
          <span className="absolute -right-12 -top-24 -z-10 h-64 w-64 rounded-full border border-white/15" />
          <span className="absolute -bottom-28 right-20 -z-10 h-52 w-52 rounded-full bg-white/[0.05]" />

          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.07em] text-white/80">
              <span className="h-2 w-2 rounded-full bg-[#B7E1D5]" />
              {nextIsPast ? "Atendimento pendente" : "Próxima paciente"}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90">
              {next ? dayjs(next.data_hora).format("HH:mm") : "Agenda livre"}
            </span>
          </div>

          <div className="mt-5 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <h3 className="truncate font-display text-[30px] font-semibold leading-[34px] tracking-[-0.035em] sm:text-[34px]">
                {isLoading ? "Carregando…" : next?.paciente_nome || "Tudo tranquilo por aqui"}
              </h3>
              <p className="mt-1.5 truncate text-sm leading-5 text-white/75">
                {next?.tipo_consulta || "Nenhum atendimento pendente para hoje"}
              </p>
            </div>
            {next && (
              <Link
                to={`/pacientes?perfil=${next.paciente_id}`}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 text-sm font-bold text-white no-underline transition-colors hover:bg-white/20"
              >
                Abrir ficha <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </article>

        <Metric icon={CheckCircle2} label="Confirmados" value={isLoading ? "—" : confirmed} detail={`${total} consultas no dia`} />
        <Metric
          icon={Clock3}
          label="Aguardando"
          value={isLoading ? "—" : waiting}
          detail={waiting === 1 ? "precisa de confirmação" : "precisam de confirmação"}
          tone="warning"
        />
        <Metric
          icon={CalendarDays}
          label="Horários livres"
          value={user?.profissional_id ? usefulAvailableTimes.length : "—"}
          detail="ainda disponíveis hoje"
          tone="neutral"
        />
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(380px,0.8fr)]">
        <article className="flex min-w-0 flex-col rounded-[24px] border border-border bg-surface p-4 sm:p-[22px]">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-[25px] font-semibold leading-[30px] tracking-[-0.025em] text-ink">Agenda de hoje</h3>
                {!isLoading && (
                  <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-bold text-muted">
                    {total} {total === 1 ? "consulta" : "consultas"}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted">Acompanhe o andamento dos atendimentos.</p>
            </div>
            <Link to="/agendar" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary no-underline hover:underline">
              Ver agenda completa <ArrowRight size={15} />
            </Link>
          </header>

          <div className="flex flex-col gap-2.5">
            {visible.slice(0, 2).map((appointment) => <AgendaRow key={appointment.id} appointment={appointment} />)}
            {usefulAvailableTimes[0] && <AvailableRow time={usefulAvailableTimes[0]} />}
            {visible.slice(2).map((appointment) => <AgendaRow key={appointment.id} appointment={appointment} />)}

            {!isLoading && !isError && visible.length === 0 && (
              <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[18px] bg-canvas p-6 text-center">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary"><CalendarDays size={21} /></span>
                <strong className="mt-3 text-[15px] text-ink">Nenhuma consulta para hoje</strong>
                <span className="mt-1 text-sm text-muted">A agenda está livre para novos atendimentos.</span>
                <Link to="/agendar" className="mt-4 inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-bold text-white no-underline">Marcar consulta</Link>
              </div>
            )}
            {isError && <div className="rounded-[16px] bg-[#F0DDDA] p-5 text-sm text-[#873C35]">Não foi possível carregar a agenda. Tente atualizar a página.</div>}
          </div>
        </article>

        <aside className="flex min-w-0 flex-col rounded-[24px] border border-border bg-surface p-4 sm:p-[22px]">
          <header className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-[25px] font-semibold leading-[30px] tracking-[-0.025em] text-ink">Prioridades</h3>
              <p className="mt-1 text-sm text-muted">O que pede sua atenção agora.</p>
            </div>
            <span className="shrink-0 rounded-full bg-warning-soft px-2.5 py-1.5 text-xs font-bold text-[#7A5A1E]">
              {priorities.length} {priorities.length === 1 ? "pendente" : "pendentes"}
            </span>
          </header>

          <div className="flex flex-col gap-2.5">
            {priorities.map((priority) => <PriorityCard key={priority.title} {...priority} />)}
            {priorities.length === 0 && (
              <div className="flex min-h-[180px] flex-col items-center justify-center rounded-[16px] bg-canvas p-6 text-center">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-success-soft text-primary"><Check size={20} /></span>
                <strong className="mt-3 text-[15px] text-ink">Tudo em dia</strong>
                <span className="mt-1 text-sm text-muted">Nenhuma prioridade pendente agora.</span>
              </div>
            )}
          </div>

          <div className="pt-5">
            <div className="rounded-[16px] border border-border bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink">Andamento do dia</span>
                <span className="text-xs font-bold text-primary">{completed} de {total}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-soft">
                <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs leading-[18px] text-muted">
                {total ? `${progress}% dos atendimentos foram registrados.` : "A agenda ainda não possui atendimentos."}
              </p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
