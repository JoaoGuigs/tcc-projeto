import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useOutletContext } from "react-router-dom";
import dayjs from "dayjs";
import { ArrowRight, CalendarDays, CircleAlert, ClipboardCheck, Wallet } from "lucide-react";
import { Card } from "../components/ui/card";
import { PrettyMonthPicker } from "../components/ui/date-picker";
import { PageHeader } from "../components/PageHeader";
import api from "../services/api";

export default function FinanceiroPage() {
  const { setPageTitle } = useOutletContext();
  const [month, setMonth] = useState(() => dayjs().format("YYYY-MM"));
  const range = useMemo(() => {
    const date = dayjs(`${month}-01`);
    return { dataInicio: date.startOf("month").format("YYYY-MM-DD"), dataFim: date.endOf("month").format("YYYY-MM-DD"), limite: 200 };
  }, [month]);
  const { data: appointments = [], isPending, isError, refetch } = useQuery({
    queryKey: ["financeiro-agendamentos", range],
    queryFn: async () => (await api.get("/agendamentos", { params: range })).data,
  });
  useEffect(() => setPageTitle("Financeiro"), [setPageTitle]);

  const completed = appointments.filter((item) => item.atendimento_id || item.status === "Concluído");
  const unregistered = appointments.filter((item) => !item.atendimento_id && dayjs(item.data_hora).isBefore(dayjs()) && item.status !== "Faltou");
  const byInsurance = completed.reduce((groups, item) => {
    const name = item.convenio || "Particular";
    groups[name] = (groups[name] || 0) + 1;
    return groups;
  }, {});

  return <div className="flex w-full flex-col gap-5 pb-4">
    <PageHeader title="Financeiro" eyebrow="Gestão da clínica" showActions={false} />
    <div className="flex flex-wrap items-end justify-between gap-4">
      <p className="max-w-2xl text-sm leading-6 text-muted">Veja a produção clínica do período. Valores recebidos, cobranças e repasses aparecerão quando o controle de pagamentos estiver disponível.</p>
      <label className="flex flex-col gap-1 text-sm font-semibold text-ink">Período
        <PrettyMonthPicker value={month} onChange={(next) => next && setMonth(next)} wrapperClassName="w-[190px]" />
      </label>
    </div>
    {isError && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#f1ddda] p-4 text-[#75413d]">Não foi possível carregar os atendimentos. <button type="button" onClick={() => refetch()} className="cursor-pointer font-bold underline transition-colors hover:text-[#613330] focus-visible:outline-2 focus-visible:outline-primary">Tentar novamente</button></div>}
    <div className="grid gap-4 md:grid-cols-3">
      {[
        { icon: CalendarDays, label: "Consultas no período", value: appointments.length },
        { icon: ClipboardCheck, label: "Atendimentos registrados", value: completed.length },
        { icon: CircleAlert, label: "Registros pendentes", value: unregistered.length },
      ].map(({ icon: Icon, label, value }) => <Card key={label} className="flex min-h-[148px] flex-col justify-between p-5"><Icon size={20} className="text-primary" aria-hidden="true" /><div><p className="text-sm text-muted">{label}</p><strong className="text-3xl tabular-nums text-ink">{isPending ? "—" : value}</strong></div></Card>)}
    </div>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
      <Card className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-bold text-ink">Atendimentos do mês</h3><p className="mt-1 text-sm text-muted">Produção clínica, sem informação de pagamento.</p></div><Link to="/agendar" className="inline-flex items-center gap-1 text-sm font-bold text-primary transition-all duration-150 hover:gap-2 hover:text-[#245a54] hover:underline focus-visible:outline-2 focus-visible:outline-primary">Abrir agenda <ArrowRight size={16} /></Link></div>
        <div className="mt-5 divide-y divide-border">
          {isPending && <p role="status" className="py-8 text-sm text-muted">Carregando atendimentos…</p>}
          {!isPending && !isError && appointments.length === 0 && <p className="py-8 text-sm text-muted">Nenhuma consulta encontrada neste mês. Use a agenda para marcar o primeiro atendimento.</p>}
          {!isPending && !isError && appointments.slice(0, 10).map((item) => <div key={item.id} className="grid gap-1 py-3 text-sm sm:grid-cols-[100px_minmax(0,1fr)_160px_120px] sm:items-center"><time className="font-semibold tabular-nums text-ink" dateTime={item.data_hora}>{dayjs(item.data_hora).format("DD/MM · HH:mm")}</time><span className="truncate font-semibold text-ink">{item.paciente_nome}</span><span className="truncate text-muted">{item.convenio || "Particular"}</span><span className="text-primary">{item.atendimento_id ? "Registrado" : item.status}</span></div>)}
        </div>
        {appointments.length >= 200 && <p className="mt-3 text-xs text-muted">Exibindo as primeiras 200 consultas do período.</p>}
      </Card>
      <div className="flex flex-col gap-4"><Card className="p-5 sm:p-6"><h3 className="text-xl font-bold text-ink">Tipo de atendimento</h3><p className="mt-1 text-sm text-muted">Atendimentos registrados por convênio.</p><div className="mt-5 divide-y divide-border">{Object.entries(byInsurance).length === 0 && <p className="py-5 text-sm text-muted">Sem atendimentos registrados neste período.</p>}{Object.entries(byInsurance).sort((a, b) => b[1] - a[1]).map(([name, count]) => <div key={name} className="flex justify-between gap-3 py-3 text-sm"><span className="text-ink">{name}</span><strong className="tabular-nums text-primary">{count}</strong></div>)}</div></Card>
        <Card className="p-5 sm:p-6"><div className="flex items-center gap-2"><Wallet size={19} className="text-primary" aria-hidden="true" /><h3 className="text-xl font-bold text-ink">Receita e recebimentos</h3></div><p className="mt-3 text-sm leading-6 text-muted">A API ainda não possui lançamentos financeiros. Por isso, esta tela não calcula receita, saldo ou inadimplência a partir das consultas.</p></Card></div>
    </div>
  </div>;
}
