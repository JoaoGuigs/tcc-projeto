import { LogOut, Menu, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button } from "./ui/button";

export function Header({ title }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleLogout = async () => { await logout(); navigate("/", { replace: true }); };

  return (
    <header className="mb-7 flex items-start justify-between gap-4 md:mb-9">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.04em] text-brand">Visão geral da clínica</p>
        <h1 className="mt-1 font-display text-[34px] font-bold leading-none tracking-[-0.04em] text-ink md:text-[40px]">{title || "Início"}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={handleLogout} className="hidden sm:inline-flex" aria-label="Sair"><LogOut size={17} />Sair</Button>
        <Button onClick={() => navigate("/agendar")}><Plus size={18} /> <span className="hidden sm:inline">Marcar consulta</span><span className="sm:hidden"><Menu size={18} /></span></Button>
      </div>
    </header>
  );
}
