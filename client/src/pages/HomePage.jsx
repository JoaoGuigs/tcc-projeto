import { Fragment, useEffect, useMemo } from "react";
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

function insuranceName(appointment) {
  const name = String(appointment.convenio || "").trim();
  return !name || name.toLocaleLowerCase("pt-BR") === "particular" ? "Particular" : name;
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
      className="group grid min-h-[70px] grid-cols-[58px_minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] border border-transparent bg-canvas px-3.5 py-2.5 no-underline transition-all duration-150 hover:-translate-y-px hover:border-border hover:bg-primary-soft/60 hover:shadow-sm active:translate-y-0 motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-primary sm:grid-cols-[70px_minmax(0,1fr)_auto_20px] sm:px-4"
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
        <small className="text-xs leading-[18px] text-muted">
          {insuranceName(appointment) === "Particular" ? "Particular" : `Convênio: ${insuranceName(appointment)}`}
        </small>
      </span>
      <StatusPill status={appointment.status} hasAtendimento={hasAtendimento} />
      <ArrowRight size={16} className="hidden text-muted transition-transform group-hover:translate-x-0.5 sm:block" />
    </Link>
  );
}

function AvailableRow({ time, date }) {
  return (
    <Link
      to={`/agendar?data=${date}&horario=${encodeURIComponent(time)}`}
      className="group grid min-h-[70px] grid-cols-[58px_minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] border border-dashed border-[#9BBDB7] bg-primary-soft/60 px-3.5 py-2.5 no-underline transition-all duration-150 hover:-translate-y-px hover:bg-primary-soft hover:shadow-sm active:translate-y-0 motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-primary sm:grid-cols-[70px_minmax(0,1fr)_auto_20px] sm:px-4"
    >
      <span className="font-display text-[18px] font-semibold leading-none text-primary">{time}</span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <strong className="truncate text-[15px] font-bold leading-5 text-ink">Horário livre</strong>
        <small className="truncate text-xs leading-[18px] text-muted">Selecione para agendar</small>
      </span>
      <StatusPill status="Vago" />
      <Plus size={16} className="hidden text-primary transition-transform group-hover:rotate-90 sm:block" />
    </Link>
  );
}

function UnavailableRow({ time, past = false }) {
  return (
    <div className="grid min-h-[70px] grid-cols-[58px_minmax(0,1fr)] items-center gap-3 rounded-[16px] bg-canvas px-3.5 py-2.5 sm:grid-cols-[70px_minmax(0,1fr)_auto_20px] sm:px-4">
      <span className="font-display text-[18px] font-semibold leading-none text-muted">{time}</span>
      <span className="min-w-0">
        <strong className="block truncate text-[15px] font-bold text-ink">Sem agendamento</strong>
        <small className="block truncate text-xs text-muted">{past ? "Horário já passou" : "Horário indisponível"}</small>
      </span>
      <span className="hidden rounded-full bg-white px-3 py-1.5 text-xs font-bold text-muted sm:inline-flex">{past ? "Encerrado" : "Indisponível"}</span>
    </div>
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
  primary: "bg-primary-soft text-primary",
  warning: "bg-warning-soft text-[#7A5A1E]",
  soft: "bg-primary-soft text-primary",
};

function PriorityCard({ icon: Icon, title, detail, label, tone = "primary", to = "/agendar", featured = false }) {
  return (
    <article className={`rounded-[16px] p-4 ${featured ? "bg-[#FBF7ED]" : "bg-canvas"}`}>
      <div className="flex items-start gap-3">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[11px] ${priorityStyles[tone]}`}>
        <Icon size={19} strokeWidth={2} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <strong className="block text-[15px] font-bold leading-5 text-ink">{title}</strong>
        <p className="mt-1 text-sm leading-5 text-muted">{detail}</p>
      </div>
      </div>
      {featured ? (
        <Link to={to} className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-[11px] bg-primary px-4 text-sm font-bold text-white no-underline transition-colors hover:bg-[#245a54] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          {label} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      ) : (
        <Link to={to} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          {label} <ArrowRight size={15} aria-hidden="true" />
        </Link>
      )}
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

  const insuranceCounts = useMemo(() => {
    const counts = new Map();
    for (const appointment of appointments) {
      const name = insuranceName(appointment);
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"));
  }, [appointments]);

  const { data: availableTimes = [], isPending: loadingAvailableTimes, isError: availableTimesError } = useQuery({
    queryKey: ["dashboard-horarios-disponiveis", range, user?.profissional_id],
    queryFn: async () => (await api.get("/agendamentos/horarios-disponiveis", {
      params: { data: range.dataInicio, profissional_id: user.profissional_id },
    })).data,
    enabled: Boolean(user?.profissional_id),
  });

  const { data: possibleTimes = [], isPending: loadingPossibleTimes, isError: possibleTimesError } = useQuery({
    queryKey: ["dashboard-horarios-da-agenda"],
    queryFn: async () => (await api.get("/agendamentos/horarios-da-agenda")).data,
    enabled: Boolean(user?.profissional_id),
  });

  const usefulAvailableTimes = useMemo(() => availableTimes.filter((time) => {
    const slot = dayjs(`${range.dataInicio} ${time}`);
    return slot.isAfter(dayjs());
  }), [availableTimes, range.dataInicio]);

  const agendaSlots = useMemo(() => {
    const byTime = new Map(appointments.map((item) => [dayjs(item.data_hora).format("HH:mm"), item]));
    const available = new Set(availableTimes);
    return [...new Set([...possibleTimes, ...byTime.keys()])].sort().map((time) => ({
      time,
      appointment: byTime.get(time),
      available: available.has(time),
      past: !dayjs(`${range.dataInicio} ${time}`).isAfter(dayjs()),
    }));
  }, [appointments, availableTimes, possibleTimes, range.dataInicio]);

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
      tone: "warning",
      to: "/whatsapp",
    },
    readyForRecord && {
      icon: FileText,
      title: `Registrar atendimento de ${firstName(readyForRecord.paciente_nome, "paciente")}`,
      detail: `Atendimento de hoje às ${dayjs(readyForRecord.data_hora).format("HH:mm")}`,
      label: "Registrar agora",
      tone: "primary",
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
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 text-sm font-bold text-white no-underline transition-all duration-150 hover:-translate-y-px hover:bg-white/20 hover:shadow-md active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-white"
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
              <p className="mt-1 text-sm text-muted">Todos os horários do dia, com consultas e vagas livres.</p>
            </div>
            <Link to="/agendar" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary no-underline transition-all duration-150 hover:gap-2.5 hover:text-[#245a54] hover:underline focus-visible:outline-2 focus-visible:outline-primary">
              Ver agenda completa <ArrowRight size={15} />
            </Link>
          </header>

          <div className="flex flex-col gap-2.5" aria-label="Horários da agenda de hoje">
            {(isLoading || loadingPossibleTimes || loadingAvailableTimes) && user?.profissional_id && (
              <p role="status" className="col-span-full rounded-[16px] bg-canvas p-5 text-sm text-muted">Carregando horários de hoje…</p>
            )}
            {(isError || possibleTimesError || availableTimesError) && (
              <p role="alert" className="col-span-full rounded-[16px] bg-[#F0DDDA] p-5 text-sm text-[#873C35]">Não foi possível carregar todos os horários. Tente atualizar a página.</p>
            )}
            {!user?.profissional_id && (
              <p className="col-span-full rounded-[16px] bg-canvas p-5 text-sm text-muted">Vincule um profissional à conta para consultar a agenda.</p>
            )}
            {!isLoading && !loadingPossibleTimes && !loadingAvailableTimes && !isError && !possibleTimesError && !availableTimesError && agendaSlots.map(({ time, appointment, available, past }, index) => (
              <Fragment key={time}>
                {(index === 0 || (time >= "12:00" && agendaSlots[index - 1].time < "12:00")) && (
                  <div className="flex items-center gap-3 px-1 pb-0.5 pt-2" aria-hidden="true">
                    <span className="text-xs font-bold uppercase tracking-[0.06em] text-muted">
                      {time < "12:00" ? "Manhã" : "Tarde"}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                )}
                {appointment ? <AgendaRow appointment={appointment} />
                  : available && !past ? <AvailableRow time={time} date={range.dataInicio} />
                    : <UnavailableRow time={time} past={past} />}
              </Fragment>
            ))}
          </div>
        </article>

        <div className="flex min-w-0 flex-col gap-4">
        <aside className="flex min-w-0 flex-col rounded-[24px] border border-border bg-surface p-4 sm:p-[22px]">
          <header className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-[25px] font-semibold leading-[30px] tracking-[-0.025em] text-ink">Prioridades</h3>
              <p className="mt-1 text-sm text-muted">O que pede sua atenção agora.</p>
            </div>
            <span className="shrink-0 rounded-full bg-warning-soft px-2.5 py-1.5 text-xs font-bold text-[#7A5A1E]">
              {priorities.length} {priorities.length === 1 ? "ação" : "ações"}
            </span>
          </header>

          <div className="flex flex-col gap-2.5">
            {priorities.map((priority, index) => <PriorityCard key={priority.title} {...priority} featured={index === 0} />)}
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

        <section aria-labelledby="insurance-today-title" className="rounded-[24px] border border-border bg-surface p-4 sm:p-[22px]">
          <header className="flex items-start justify-between gap-3">
            <div>
              <h3 id="insurance-today-title" className="font-display text-2xl font-semibold leading-[31px] tracking-[-0.025em] text-ink">Convênios de hoje</h3>
              <p className="mt-1 text-sm text-muted">Consultas marcadas por convênio.</p>
            </div>
            {!isLoading && !isError && <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1.5 text-xs font-bold text-primary">{total} {total === 1 ? "consulta" : "consultas"}</span>}
          </header>
          {isLoading && <p role="status" className="mt-5 text-sm text-muted">Carregando convênios de hoje…</p>}
          {isError && <p role="alert" className="mt-5 text-sm text-[#75413D]">Não foi possível carregar os convênios. Atualize a página para tentar novamente.</p>}
          {!isLoading && !isError && insuranceCounts.length === 0 && <p className="mt-5 rounded-[13px] bg-canvas p-4 text-sm text-muted">Nenhuma consulta marcada para hoje.</p>}
          {!isLoading && !isError && insuranceCounts.length > 0 && <dl className="mt-4 divide-y divide-border">
            {insuranceCounts.map(([name, count]) => <div key={name} className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <dt className="min-w-0 break-words text-sm font-semibold text-ink">{name}</dt>
              <dd className="shrink-0 font-display text-lg font-bold tabular-nums text-primary">{count}</dd>
            </div>)}
          </dl>}
        </section>
        </div>
      </section>
    </div>
  );
}
