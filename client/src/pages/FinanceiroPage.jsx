import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

export default function FinanceiroPage() {
  const { setPageTitle } = useOutletContext();
  useEffect(() => {
    setPageTitle("Financeiro");
  }, [setPageTitle]);

  return (
    <div className="flex w-full flex-col gap-[22px]">
      <PageHeader eyebrow="Gestão da clínica" title="Financeiro" />
      <section className="flex flex-col gap-[14px] rounded-[20px] border border-solid border-border bg-surface p-[22px]">
        <h3 className="font-display text-[24px] font-semibold leading-[30px] text-ink">
          Recebimentos e repasses
        </h3>
        <p className="text-sm leading-[20px] text-muted">
          Esta área vai concentrar os recebimentos, convênios e repasses da clínica. Em breve.
        </p>
      </section>
    </div>
  );
}
