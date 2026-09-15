import { useState } from "react";
import { Link } from "react-router-dom";
import { NewPatientModal } from "./NewPatientModal";

/**
 * Cabeçalho padronizado de todas as telas (padrão do Paper):
 * eyebrow + título grande + ações "Novo paciente" / "+ Marcar consulta".
 * O botão "Novo paciente" abre o modal de cadastro.
 */
export function PageHeader({ eyebrow, title, showActions = true, onNewAppointment }) {
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const scheduleClass =
    "inline-flex h-[46px] flex-1 items-center justify-center rounded-full bg-primary px-[18px] text-sm font-bold leading-[18px] text-surface transition-colors hover:bg-[#245a54] sm:flex-none";

  return (
    <>
      <div className="flex min-h-[70px] shrink-0 flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-[4px]">
          <span className="text-xs font-bold uppercase leading-[18px] tracking-[0.06em] text-primary">
            {eyebrow}
          </span>
          <h2 className="font-display text-[34px] font-semibold leading-none tracking-[-0.04em] text-ink sm:text-[40px]">
            {title}
          </h2>
        </div>
        {showActions && (
          <div className="flex w-full items-center gap-[10px] sm:w-auto">
            <button
              type="button"
              onClick={() => setNewPatientOpen(true)}
              className="inline-flex h-[46px] flex-1 cursor-pointer items-center justify-center rounded-full border border-solid border-border bg-surface px-[18px] text-sm font-semibold leading-[18px] text-ink transition-colors hover:bg-canvas sm:flex-none"
            >
              Novo paciente
            </button>
            {onNewAppointment ? (
              <button type="button" onClick={onNewAppointment} className={`${scheduleClass} cursor-pointer`}>
                + Marcar consulta
              </button>
            ) : (
              <Link to="/agendar" className={`${scheduleClass} no-underline`}>
                + Marcar consulta
              </Link>
            )}
          </div>
        )}
      </div>

      <NewPatientModal open={newPatientOpen} onClose={() => setNewPatientOpen(false)} />
    </>
  );
}
