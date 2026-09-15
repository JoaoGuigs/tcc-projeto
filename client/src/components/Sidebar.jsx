import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { cn } from "../lib/utils";

function Icon({ d }) {
  return (
    <span className="flex shrink-0 items-center justify-center">
      <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        <path d={d} fill="none" stroke="#1f2a24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

const navigation = [
  { label: "Início", to: "/home", d: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" },
  { label: "Agenda", to: "/agendar", d: "M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1z" },
  { label: "Pacientes", to: "/pacientes", d: "M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m6.5-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8.5 10v-2a4 4 0 0 0-3-3.87" },
  { label: "Atendimentos", to: "/atendimentos/novo", d: "M9 3h6l1 2h3v16H5V5h3zm0 7h6m-6 4h6m-6 4h4" },
  { label: "WhatsApp", to: "/whatsapp", d: "M21 11.5a8.5 8.5 0 0 1-12.6 7.45L3 20l1.1-5.1A8.5 8.5 0 1 1 21 11.5z" },
  { label: "Financeiro", to: "/financeiro", d: "M4 6h16v12H4zm0 4h16m-5 4h2" },
  { label: "Relatórios", to: "/relatorios", d: "M5 20V10m7 10V4m7 16v-7" },
  { label: "Configurações", to: "/configuracoes", d: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm7.4-3.5a7.3 7.3 0 0 0-.1-1l2-1.6-2-3.4-2.5 1a8 8 0 0 0-1.8-1L14.6 3h-4l-.4 3a8 8 0 0 0-1.8 1L6 6 4 9.4 6 11a7.3 7.3 0 0 0 0 2l-2 1.6L6 18l2.4-1a8 8 0 0 0 1.8 1l.4 3h4l.4-3a8 8 0 0 0 1.8-1l2.5 1 2-3.4-2-1.6a7.3 7.3 0 0 0 .1-1z" },
];

function initials(nome) {
  if (!nome) return "AS";
  const parts = String(nome).split(/\s+/).filter((p) => !/^(dra?\.?)$/i.test(p));
  if (parts.length === 0) return "AS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-solid border-border bg-surface px-4 py-[28px] lg:flex">
      <div className="flex flex-col gap-[2px] px-2 pb-[24px]">
        <p className="font-display text-[30px] font-semibold leading-[34px] tracking-[-0.04em] text-ink">
          FisioCare
        </p>
        <p className="text-sm leading-[20px] text-muted">Clínica de fisioterapia</p>
      </div>

      <nav className="flex grow basis-0 flex-col gap-[6px]" aria-label="Navegação principal">
        {navigation.map(({ label, to, d }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex h-[48px] shrink-0 items-center gap-3 rounded-[14px] px-[14px] text-[15px] leading-[20px] no-underline transition-colors",
                isActive ? "bg-primary-soft font-semibold text-primary" : "font-medium text-muted hover:bg-canvas",
              )
            }
          >
            <Icon d={d} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-3 rounded-[16px] bg-canvas p-[14px]">
        <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold leading-[18px] text-surface">
          {initials(user?.nome)}
        </div>
        <div className="flex min-w-0 flex-col gap-px">
          <p className="truncate text-[15px] font-semibold leading-[20px] text-ink">
            {user?.nome || "Dra. Ana Souza"}
          </p>
          <p className="text-xs leading-[18px] text-muted">Fisioterapeuta</p>
        </div>
      </div>
    </aside>
  );
}

const mobilePaths = new Set(["/home", "/agendar", "/pacientes", "/whatsapp", "/atendimentos/novo"]);

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[68px] items-center justify-around border-t border-solid border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Navegação mobile">
      {navigation.filter((item) => mobilePaths.has(item.to)).map(({ label, to, d }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => cn(
            "flex min-w-[58px] flex-col items-center gap-1 rounded-[10px] px-2 py-1.5 text-[11px] font-semibold text-muted no-underline",
            isActive && "bg-primary-soft text-primary",
          )}
        >
          <Icon d={d} />
          <span>{label === "Atendimentos" ? "Atender" : label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
