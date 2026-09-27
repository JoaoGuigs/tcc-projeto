import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useOutletContext } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import {
  ArrowRight,
  CalendarDays,
  CalendarX,
  ClipboardCheck,
  FileText,
  Minus,
  Phone,
  Printer,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { PrettyMonthPicker } from "../components/ui/date-picker";
import { PageHeader } from "../components/PageHeader";
import api from "../services/api";

dayjs.locale("pt-br");

const BEIGE = "#e9dcc3";

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "•";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts.at(-1)[0]).toUpperCase();
}

function isComplete(item) {
  return Boolean(item.atendimento_id) || item.status === "Concluído";
}

function isConfirmed(item) {
  return item.status === "Confirmado" || item.status === "Chegou";
}

function Delta({ now, prev, suffix }) {
  const diff = now - prev;
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const text = diff === 0 ? `igual a ${suffix}` : `${diff > 0 ? "+" : ""}${diff} vs ${suffix}`;
  return (
    <span className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-muted">
      <Icon size={14} aria-hidden="true" />
      {text}
    </span>
  );
}

function KpiCard({ icon: Icon, label, children, delta }) {
  return (
    <Card className="flex min-w-0 flex-col p-5">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-primary-soft text-primary">
          <Icon size={18} aria-hidden="true" />
        </span>
        <p className="truncate text-sm font-semibold text-muted">{label}</p>
      </div>
      <div className="mt-3">{children}</div>
      {delta}
    </Card>
  );
}

function MovementChart({ entries, max, curLabel, prevLabel, loading, monthLabel }) {
  if (loading) {
    return (
      <Card className="p-5 sm:p-6" aria-label="Movimento do mês">
        <h3 className="text-xl font-bold text-ink">Movimento do mês</h3>
        <p className="mt-1 text-sm text-muted">Consultas por dia.</p>
        <div className="mt-6 flex h-44 items-end gap-2" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="w-full animate-pulse rounded-t-lg bg-canvas" style={{ height: `${25 + ((i * 37) % 60)}%` }} />
          ))}
        </div>
      </Card>
    );
  }
  if (!entries.length) {
    return (
      <Card className="p-5 sm:p-6">
        <h3 className="text-xl font-bold text-ink">Movimento do mês</h3>
        <p className="mt-1 text-sm text-muted">Consultas por dia.</p>
        <div className="mt-6 grid place-items-center gap-2 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="font-bold text-ink">Nenhuma consulta em {monthLabel}</p>
          <p className="text-sm text-muted">Escolha outro período ou marque uma consulta.</p>
          <Link to="/agendar" className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-white no-underline transition-all duration-150 hover:-translate-y-px hover:bg-[#245a54] hover:shadow-md active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Marcar consulta <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </Card>
    );
  }
  const best = entries.reduce((a, b) => (b.cur > a.cur ? b : a), entries[0]);
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-ink">Movimento do mês</h3>
          <p className="mt-1 text-sm text-muted">
            Dia mais cheio: <strong className="text-ink tabular-nums">{String(best.day).padStart(2, "0")}</strong> com{" "}
            <strong className="text-ink">{best.cur} {best.cur === 1 ? "consulta" : "consultas"}</strong>.
          </p>
        </div>
        <ul aria-label="Legenda" className="flex items-center gap-4 text-xs font-bold text-muted">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[4px] bg-primary" />
            {curLabel}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[4px]" style={{ background: BEIGE }} />
            {prevLabel}
          </li>
        </ul>
      </div>
      <div className="mt-6 overflow-x-auto pb-1">
        <div className="min-w-[680px]">
          <ul className="flex items-end gap-[5px]" role="img" aria-label={`Consultas por dia em ${monthLabel}. Dia mais cheio: dia ${best.day} com ${best.cur}.`}>
            {entries.map(({ day, cur, prev }, i) => (
              <li key={day} aria-label={`Dia ${day}: ${cur} neste mês, ${prev} no anterior`} className="flex min-w-0 flex-1 items-end justify-center gap-[3px]">
                <div className="flex h-40 w-full max-w-9 items-end justify-center gap-[3px] border-b border-border pb-0">
                  <div
                    title={`${cur} neste mês`}
                    style={{ height: `${Math.max(4, (cur / max) * 100)}%`, animationDelay: `${Math.min(i * 18, 600)}ms` }}
                    className={`report-bar w-full max-w-3.5 rounded-t-[4px] ${cur > 0 ? "bg-primary" : "bg-border"}`}
                  />
                  <div
                    title={`${prev} no mês anterior`}
                    style={{ height: `${Math.max(4, (prev / max) * 100)}%`, animationDelay: `${Math.min(i * 18, 600)}ms`, background: prev > 0 ? BEIGE : undefined }}
                    className={`report-bar w-full max-w-3.5 rounded-t-[4px] ${prev > 0 ? "" : "bg-border"}`}
                  />
                </div>
              </li>
            ))}
          </ul>
          <ul aria-hidden="true" className="mt-1.5 flex gap-[5px]">
            {entries.map(({ day }) => (
              <li key={day} className="min-w-0 flex-1 text-center text-[11px] font-semibold tabular-nums text-muted">
                {day}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <style>{`@keyframes report-rise { from { transform: scaleY(0.15); opacity: 0.4; } to { transform: scaleY(1); opacity: 1; } } .report-bar { transform-origin: bottom; animation: report-rise 0.55s cubic-bezier(0.16, 1, 0.3, 1) backwards; }`}</style>
      <p className="mt-4 text-xs leading-5 text-muted">A API retorna até 200 consultas por período.</p>
    </Card>
  );
}

const TYPE_COLORS = ["#2f6f68", "#5c948d", "#a8c4be", "#d9a441", "#8a6fa8"];

function TypeBars({ segments, loading }) {
  const max = Math.max(1, ...segments.map(([, count]) => count));
  return (
    <Card className="p-5 sm:p-6">
      <h3 className="text-xl font-bold text-ink">Tipos de consulta</h3>
      <p className="mt-1 text-sm text-muted">Como o mês se dividiu.</p>
      {loading ? (
        <div className="mt-5 space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-canvas" />
          ))}
        </div>
      ) : segments.length ? (
        <ul className="mt-5 space-y-4">
          {segments.map(([label, count], i) => (
            <li key={label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-semibold text-ink">{label}</span>
                <strong className="shrink-0 tabular-nums text-muted">{count}</strong>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(6, (count / max) * 100)}%`, background: TYPE_COLORS[i % TYPE_COLORS.length] }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">Sem consultas neste período.</p>
      )}
    </Card>
  );
}

function InsuranceCard({ entries, loading }) {
  return (
    <Card className="p-5 sm:p-6">
      <h3 className="text-xl font-bold text-ink">Por convênio</h3>
      <p className="mt-1 text-sm text-muted">Registros do mês, sem valores.</p>
      {loading ? (
        <div className="mt-4 space-y-2.5" aria-hidden="true">
          {[0, 1].map((i) => (
            <div key={i} className="h-6 animate-pulse rounded bg-canvas" />
          ))}
        </div>
      ) : entries.length ? (
        <ul className="mt-3 divide-y divide-border">
          {entries.map(([name, count]) => (
            <li key={name} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0 truncate font-semibold text-ink">{name}</span>
              <strong className="tabular-nums text-primary">{count}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">Nenhum registro neste período.</p>
      )}
    </Card>
  );
}

function PendingCard({ items, loading }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-ink">Para registrar</h3>
          <p className="mt-1 text-sm text-muted">Consultas passadas ainda sem atendimento registrado.</p>
        </div>
        {!loading && items.length > 0 && (
          <span className="rounded-full bg-warning-soft px-3 py-1.5 text-xs font-bold text-[#78591d]">
            {items.length} {items.length === 1 ? "pendente" : "pendentes"}
          </span>
        )}
      </div>
      {loading ? (
        <div className="mt-5 space-y-2.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-canvas" />
          ))}
        </div>
      ) : items.length ? (
        <>
          <ul className="mt-4 divide-y divide-border border-t border-border">
            {items.slice(0, 6).map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                <time dateTime={item.data_hora} className="w-[118px] shrink-0 font-bold tabular-nums text-ink">
                  {dayjs(item.data_hora).format("DD/MM · HH:mm")}
                </time>
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">{item.paciente_nome}</span>
                <span className="hidden truncate text-muted md:block md:max-w-44">{item.tipo_consulta}</span>
                <Link
                  to="/atendimentos/novo"
                  className="inline-flex min-h-9 shrink-0 items-center gap-1 text-[13px] font-bold text-primary no-underline transition-colors hover:text-[#245a54] hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  Registrar <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          {items.length > 6 && (
            <p className="mt-3 text-xs font-semibold text-muted">+{items.length - 6} outras na mesma situação.</p>
          )}
        </>
      ) : (
        <p className="mt-4 rounded-xl bg-canvas p-4 text-sm leading-6 text-muted">
          Nada pendente. Todas as consultas passadas já têm atendimento registrado.
        </p>
      )}
    </Card>
  );
}

function AttentionCard({ pendingCount, missedCount, loading }) {
  if (loading) {
    return (
      <Card className="p-5 sm:p-6" aria-hidden="true">
        <div className="h-9 w-24 animate-pulse rounded bg-canvas" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-canvas" />
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-canvas" />
      </Card>
    );
  }
  if (pendingCount === 0 && missedCount === 0) {
    return (
      <Card className="border-primary/25 bg-primary-soft p-5 sm:p-6">
        <p className="font-display text-[40px] font-semibold leading-none tabular-nums text-primary">0</p>
        <h3 className="mt-2 text-xl font-bold text-ink">Tudo em dia</h3>
        <p className="mt-2 text-sm leading-6 text-ink/70">Sem faltas e sem registros pendentes neste mês. Bom ritmo.</p>
      </Card>
    );
  }
  return (
    <Card className="border-[#e3cf9e] bg-warning-soft p-5 sm:p-6">
      <p className="font-display text-[40px] font-semibold leading-none tabular-nums text-[#5f420a]">
        {pendingCount + missedCount}
      </p>
      <h3 className="mt-2 text-xl font-bold text-[#5f420a]">Pede atenção</h3>
      <ul className="mt-2 space-y-1 text-sm font-semibold leading-6 text-[#5f420a]">
        {pendingCount > 0 && <li>{pendingCount} sem registro</li>}
        {missedCount > 0 && <li>{missedCount} {missedCount === 1 ? "falta" : "faltas"} no mês</li>}
      </ul>
      {pendingCount > 0 && (
        <Link
          to="/atendimentos/novo"
          className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#5f420a] px-4 text-sm font-bold text-white no-underline transition-all duration-150 hover:-translate-y-px hover:shadow-md active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5f420a]"
        >
          Registrar agora <ArrowRight size={15} aria-hidden="true" />
        </Link>
      )}
    </Card>
  );
}

function PatientSearchCard({ search, setSearch, results, searching, searchError, empty, selectedId, onPick, onClear }) {
  return (
    <Card className="h-fit p-5 sm:p-6">
      <h3 className="text-xl font-bold text-ink">Buscar paciente</h3>
      <p className="mt-1 text-sm text-muted">Digite pelo menos 3 letras do nome.</p>
      <label className="mt-4 flex h-12 items-center gap-2 rounded-xl border border-border bg-[#fbfaf7] px-3 transition-colors focus-within:border-primary">
        <Search size={17} className="shrink-0 text-muted" aria-hidden="true" />
        <span className="sr-only">Nome do paciente</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Ex.: Maria Oliveira"
          className="w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
        {search && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Limpar busca"
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
          >
            <X size={15} aria-hidden="true" />
          </button>
        )}
      </label>
      {searching && <p role="status" className="mt-4 text-sm text-muted">Buscando pacientes…</p>}
      {searchError && (
        <p role="alert" className="mt-4 rounded-xl bg-[#f1ddda] p-3 text-sm text-[#75413d]">
          Não foi possível buscar. Tente de novo.
        </p>
      )}
      {empty && <p className="mt-4 text-sm text-muted">Nenhum paciente encontrado para essa busca.</p>}
      {results?.length > 0 && (
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {results.map((item) => {
            const active = String(item.id) === String(selectedId);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onPick(item)}
                  aria-current={active || undefined}
                  className={`flex min-h-12 w-full cursor-pointer items-center justify-between gap-2 py-2 text-left text-sm font-semibold transition-all duration-150 active:scale-[0.99] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-primary ${active ? "text-primary" : "text-ink hover:text-primary"}`}
                >
                  <span className="min-w-0 truncate">{item.nome_completo}</span>
                  <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function PatientReport({ patientId, patient, history }) {
  if (!patientId) {
    return (
      <Card className="grid min-h-80 place-content-center p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <FileText size={26} aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-xl font-bold text-ink">Relatório individual</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
          Busque um paciente ao lado para ver cadastro, convênio e toda a evolução clínica em ordem de data.
        </p>
      </Card>
    );
  }
  if (patient.isPending || history.isPending) {
    return (
      <Card className="p-5 sm:p-8" aria-label="Carregando relatório">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 animate-pulse rounded-2xl bg-canvas" />
          <div className="flex-1">
            <div className="h-6 w-56 max-w-full animate-pulse rounded bg-canvas" />
            <div className="mt-2 h-4 w-40 animate-pulse rounded bg-canvas" />
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-canvas" />
          ))}
        </div>
      </Card>
    );
  }
  if (patient.isError || history.isError) {
    return (
      <Card className="p-5 sm:p-8">
        <p role="alert" className="rounded-2xl bg-[#f1ddda] p-4 text-sm leading-6 text-[#75413d]">
          Não foi possível carregar o relatório. Selecione o paciente novamente na busca.
        </p>
      </Card>
    );
  }
  const data = patient.data;
  const records = [...(history.data || [])].sort((a, b) => dayjs(b.data_atendimento).valueOf() - dayjs(a.data_atendimento).valueOf());
  const first = records[records.length - 1];
  const last = records[0];
  return (
    <Card data-report-print className="overflow-hidden">
      <div className="border-b border-border bg-table-head p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary font-display text-xl font-semibold text-white">
              {initials(data.nome_completo)}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-2xl font-bold tracking-[-0.02em] text-ink">{data.nome_completo}</h3>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={14} aria-hidden="true" />
                  {data.celular || "Telefone não informado"}
                </span>
                <span aria-hidden="true">·</span>
                <span>{data.nome_convenio || "Particular"}</span>
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer size={16} aria-hidden="true" /> Imprimir ou salvar PDF
          </Button>
        </div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-white p-3.5">
            <dt className="text-xs font-bold uppercase tracking-[0.05em] text-muted">Profissão</dt>
            <dd className="mt-1 font-semibold text-ink">{data.profissao || "Não informada"}</dd>
          </div>
          <div className="rounded-xl bg-white p-3.5">
            <dt className="text-xs font-bold uppercase tracking-[0.05em] text-muted">Carteirinha</dt>
            <dd className="mt-1 font-semibold text-ink">{data.numero_carteirinha || "Não informada"}</dd>
          </div>
          <div className="rounded-xl bg-white p-3.5">
            <dt className="text-xs font-bold uppercase tracking-[0.05em] text-muted">Atendimentos</dt>
            <dd className="mt-1 font-semibold tabular-nums text-ink">
              {records.length === 0 ? "Nenhum ainda" : `${records.length} · desde ${dayjs(first.data_atendimento).format("MM/YYYY")}`}
            </dd>
          </div>
        </dl>
        {data.descricao_problema && (
          <p className="mt-3 rounded-xl bg-white p-3.5 text-sm leading-6 text-ink">
            <strong>Queixa relatada:</strong> {data.descricao_problema}
          </p>
        )}
      </div>
      <div className="p-5 sm:p-7">
        <h4 className="text-lg font-bold text-ink">Evolução clínica</h4>
        <p className="mt-1 text-sm text-muted">
          {records.length === 0
            ? "Nenhum atendimento registrado para este paciente."
            : last
              ? `Último em ${dayjs(last.data_atendimento).format("DD/MM/YYYY")} · ${records.length} ${records.length === 1 ? "registro" : "registros"} no total.`
              : ""}
        </p>
        {records.length > 0 && (
          <ol className="mt-6">
            {records.map((item, index) => (
              <li key={item.atendimento_id} className="relative flex gap-4 pb-7 last:pb-0">
                {index < records.length - 1 && (
                  <span aria-hidden="true" className="absolute bottom-1 left-[15px] top-9 w-px bg-border" />
                )}
                <span
                  aria-hidden="true"
                  className={`z-10 mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${index === 0 ? "border-primary bg-primary-soft text-primary" : "border-border bg-white text-muted"}`}
                >
                  <ClipboardCheck size={15} />
                </span>
                <article className="min-w-0 flex-1 rounded-2xl border border-border bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <time dateTime={item.data_atendimento} className="text-sm font-bold tabular-nums text-ink">
                      {dayjs(item.data_atendimento).format("DD [de] MMMM [de] YYYY")}
                    </time>
                    <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">
                      {item.tipo_consulta || "Atendimento"}
                    </span>
                  </div>
                  {item.evolucao_clinica && (
                    <p className="mt-2.5 whitespace-pre-wrap text-sm leading-6 text-ink">{item.evolucao_clinica}</p>
                  )}
                  {item.procedimentos_realizados && (
                    <p className="mt-2 border-t border-border pt-2.5 text-sm leading-6 text-muted">
                      <strong className="text-ink">Procedimentos:</strong> {item.procedimentos_realizados}
                    </p>
                  )}
                </article>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Card>
  );
}

function PrintSummary({ monthLabel, total, completed, taxa, confirmed, missed, pending, byType, byInsurance }) {
  return (
    <section data-report-print className="hidden print:block">
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Relatório — {monthLabel}</h1>
      <p>Consultas: {total} · Registradas: {completed} ({taxa}%) · Confirmadas: {confirmed} · Faltas: {missed} · Sem registro: {pending}</p>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 16 }}>Tipos de consulta</h2>
      <ul>
        {byType.map(([label, count]) => (
          <li key={label}>{label}: {count}</li>
        ))}
      </ul>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 16 }}>Por convênio (registros)</h2>
      <ul>
        {byInsurance.map(([name, count]) => (
          <li key={name}>{name}: {count}</li>
        ))}
      </ul>
    </section>
  );
}

export default function RelatorioPacientePage() {
  const { setPageTitle } = useOutletContext();
  const [mode, setMode] = useState("clinica");
  const [month, setMonth] = useState(() => dayjs().format("YYYY-MM"));
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [patientId, setPatientId] = useState(null);
  useEffect(() => setPageTitle("Relatórios"), [setPageTitle]);
  useEffect(() => { const timer = setTimeout(() => setDebounced(search.trim()), 350); return () => clearTimeout(timer); }, [search]);

  const range = useMemo(() => {
    const date = dayjs(`${month}-01`);
    return { dataInicio: date.startOf("month").format("YYYY-MM-DD"), dataFim: date.endOf("month").format("YYYY-MM-DD"), limite: 200 };
  }, [month]);
  const prevRange = useMemo(() => {
    const date = dayjs(`${month}-01`).subtract(1, "month");
    return { dataInicio: date.startOf("month").format("YYYY-MM-DD"), dataFim: date.endOf("month").format("YYYY-MM-DD"), limite: 200 };
  }, [month]);

  const clinic = useQuery({ queryKey: ["relatorios-clinica", range], enabled: mode === "clinica", queryFn: async () => (await api.get("/agendamentos", { params: range })).data });
  const prev = useQuery({ queryKey: ["relatorios-clinica-anterior", prevRange], enabled: mode === "clinica", queryFn: async () => (await api.get("/agendamentos", { params: prevRange })).data });
  const patients = useQuery({ queryKey: ["relatorios-busca", debounced], enabled: mode === "paciente" && debounced.length >= 3, queryFn: async () => (await api.get("/pacientes", { params: { nome: debounced } })).data });
  const patient = useQuery({ queryKey: ["relatorios-paciente", patientId], enabled: Boolean(patientId), queryFn: async () => (await api.get(`/pacientes/${patientId}`)).data });
  const history = useQuery({ queryKey: ["relatorios-historico", patientId], enabled: Boolean(patientId), queryFn: async () => (await api.get(`/atendimentos/paciente/${patientId}`)).data });

  const appointments = useMemo(() => clinic.data || [], [clinic.data]);
  const prevAppointments = useMemo(() => prev.data || [], [prev.data]);
  const completed = appointments.filter(isComplete);
  const confirmed = appointments.filter(isConfirmed);
  const missed = appointments.filter((item) => item.status === "Faltou");
  const prevMissed = prevAppointments.filter((item) => item.status === "Faltou");
  const pending = useMemo(
    () => appointments.filter((item) => !item.atendimento_id && dayjs(item.data_hora).isBefore(dayjs()) && item.status !== "Faltou")
      .sort((a, b) => dayjs(a.data_hora).valueOf() - dayjs(b.data_hora).valueOf()),
    [appointments]
  );
  const prevPending = prevAppointments.filter((item) => !item.atendimento_id && item.status !== "Faltou");
  const taxa = appointments.length ? Math.round((completed.length / appointments.length) * 100) : 0;

  const chartEntries = useMemo(() => {
    const daysInMonth = dayjs(`${month}-01`).daysInMonth();
    const cur = {};
    const prv = {};
    for (const item of appointments) cur[dayjs(item.data_hora).date()] = (cur[dayjs(item.data_hora).date()] || 0) + 1;
    for (const item of prevAppointments) prv[dayjs(item.data_hora).date()] = (prv[dayjs(item.data_hora).date()] || 0) + 1;
    return Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, cur: cur[i + 1] || 0, prev: prv[i + 1] || 0 }));
  }, [appointments, prevAppointments, month]);
  const chartMax = Math.max(1, ...chartEntries.flatMap((d) => [d.cur, d.prev]));

  const byType = useMemo(() => {
    const groups = appointments.reduce((map, item) => {
      const type = item.tipo_consulta || "Consulta";
      map[type] = (map[type] || 0) + 1;
      return map;
    }, {});
    return Object.entries(groups).sort((a, b) => b[1] - a[1]);
  }, [appointments]);

  const byInsurance = useMemo(() => {
    const groups = completed.reduce((map, item) => {
      const name = item.convenio || "Particular";
      map[name] = (map[name] || 0) + 1;
      return map;
    }, {});
    return Object.entries(groups).sort((a, b) => b[1] - a[1]);
  }, [completed]);

  const monthLabel = capitalize(dayjs(`${month}-01`).format("MMMM [de] YYYY"));
  const curShort = capitalize(dayjs(`${month}-01`).format("MMMM"));
  const prevShort = capitalize(dayjs(`${month}-01`).subtract(1, "month").format("MMMM"));
  const prevLabel = dayjs(`${month}-01`).subtract(1, "month").format("MMMM");
  const loading = clinic.isPending || prev.isPending;

  return (
    <div className="flex w-full flex-col gap-5 pb-4">
      <PageHeader title="Relatórios" eyebrow="Visão da clínica" showActions={false} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Tipo de relatório" className="flex rounded-xl bg-segment p-1">
          {[["clinica", "Visão geral"], ["paciente", "Por paciente"]].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={`min-h-10 cursor-pointer rounded-lg px-4 text-sm transition-all duration-150 active:scale-[0.97] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-primary ${mode === id ? "bg-white font-bold text-primary shadow-sm" : "text-muted hover:bg-white/70 hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {mode === "clinica" && (
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
              Período
              <PrettyMonthPicker value={month} onChange={(next) => next && setMonth(next)} wrapperClassName="w-[190px]" />
            </label>
          )}
          <Button
            variant="outline"
            onClick={() => window.print()}
            disabled={mode === "paciente" && !patientId}
            className="mb-px"
            aria-label="Exportar relatório atual"
          >
            <Printer size={16} aria-hidden="true" /> Exportar
          </Button>
        </div>
      </div>

      {mode === "clinica" && (
        <>
          {clinic.isError && (
            <p role="alert" className="rounded-2xl bg-[#f1ddda] p-4 text-sm leading-6 text-[#75413d]">
              Não foi possível carregar os agendamentos deste mês.{" "}
              <button
                type="button"
                onClick={() => { clinic.refetch(); prev.refetch(); }}
                className="cursor-pointer font-bold underline transition-colors hover:text-[#613330] focus-visible:outline-2 focus-visible:outline-primary"
              >
                Tentar novamente
              </button>
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={CalendarDays}
              label={`Consultas em ${curShort.toLowerCase()}`}
              delta={<Delta now={appointments.length} prev={prevAppointments.length} suffix={prevLabel} />}
            >
              <p className="font-display text-[44px] font-semibold leading-none tabular-nums text-primary">
                {loading ? "—" : appointments.length}
              </p>
            </KpiCard>
            <KpiCard icon={ClipboardCheck} label="Taxa de registro">
              <p className="font-display text-[44px] font-semibold leading-none tabular-nums text-[#7b4e0b]">
                {loading ? "—" : `${taxa}%`}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
                <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${taxa}%` }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-muted">
                {loading ? "…" : `${completed.length} de ${appointments.length} registradas`}
              </p>
            </KpiCard>
            <KpiCard
              icon={FileText}
              label="Precisam de registro"
              delta={<Delta now={pending.length} prev={prevPending.length} suffix={prevLabel} />}
            >
              <p className={`font-display text-[44px] font-semibold leading-none tabular-nums ${!loading && pending.length > 0 ? "text-[#7b4e0b]" : "text-ink"}`}>
                {loading ? "—" : pending.length}
              </p>
            </KpiCard>
            <KpiCard
              icon={CalendarX}
              label="Faltas no mês"
              delta={<Delta now={missed.length} prev={prevMissed.length} suffix={prevLabel} />}
            >
              <p className="font-display text-[44px] font-semibold leading-none tabular-nums text-ink">
                {loading ? "—" : missed.length}
              </p>
            </KpiCard>
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
            <MovementChart entries={chartEntries} max={chartMax} curLabel={curShort} prevLabel={prevShort} loading={loading} monthLabel={monthLabel.toLowerCase()} />
            <div className="flex min-w-0 flex-col gap-4">
              <TypeBars segments={byType} loading={loading} />
              <InsuranceCard entries={byInsurance} loading={loading} />
            </div>
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
            <PendingCard items={pending} loading={loading} />
            <AttentionCard pendingCount={pending.length} missedCount={missed.length} loading={loading} />
          </div>

          {!loading && !clinic.isError && (
            <PrintSummary
              monthLabel={monthLabel}
              total={appointments.length}
              completed={completed.length}
              taxa={taxa}
              confirmed={confirmed.length}
              missed={missed.length}
              pending={pending.length}
              byType={byType}
              byInsurance={byInsurance}
            />
          )}
        </>
      )}

      {mode === "paciente" && (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(300px,0.7fr)_minmax(0,1.3fr)]">
          <PatientSearchCard
            search={search}
            setSearch={(value) => { setSearch(value); setPatientId(null); }}
            results={patients.data}
            searching={patients.isPending && debounced.length >= 3}
            searchError={patients.isError}
            empty={debounced.length >= 3 && !patients.isPending && !patients.isError && patients.data?.length === 0}
            selectedId={patientId}
            onPick={(item) => { setPatientId(item.id); setSearch(item.nome_completo); }}
            onClear={() => { setSearch(""); setPatientId(null); }}
          />
          <PatientReport patientId={patientId} patient={patient} history={history} />
        </div>
      )}
    </div>
  );
}
