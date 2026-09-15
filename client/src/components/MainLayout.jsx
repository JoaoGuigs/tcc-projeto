import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { MobileNav, Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function MainLayout() {
  const [pageTitle, setPageTitle] = useState("Início");
  const { pathname } = useLocation();
  // Páginas com cabeçalho próprio no padrão do Paper — o Header genérico
  // não pode aparecer nelas para não duplicar.
  const OWN_HEADER_PATHS = ["/home", "/agendar", "/pacientes", "/whatsapp", "/financeiro"];
  const hasOwnHeader = OWN_HEADER_PATHS.includes(pathname);

  return (
    <div className="flex min-h-screen bg-canvas font-sans">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col px-4 pb-[88px] pt-6 lg:px-[36px] lg:py-[30px]">
        {!hasOwnHeader && <Header title={pageTitle} />}
        <Outlet context={{ setPageTitle }} />
      </main>
      <MobileNav />
    </div>
  );
}
