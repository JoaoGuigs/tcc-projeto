import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas p-6">
      <div className="max-w-md rounded-2xl border border-border bg-white p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Erro 404</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted">O endereço acessado não existe.</p>
        <Link to="/home" className="mt-4 inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-white no-underline">
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
