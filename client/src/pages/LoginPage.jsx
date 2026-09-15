import { ArrowRight, CalendarCheck, Eye, EyeOff, HeartPulse, MessageCircleMore } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/button";

const inputClass = "h-[50px] w-full rounded-[14px] border border-border bg-white px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary-soft";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleLogin(event) {
    event.preventDefault();
    if (!email.trim() || !senha) {
      setError("Preencha o email e a senha.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login({ email: email.trim(), senha });
      navigate("/home", { replace: true });
    } catch (loginError) {
      setError(loginError.userMessage || "Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(420px,0.9fr)_minmax(520px,1.1fr)]">
      <section className="relative hidden overflow-hidden bg-primary p-12 text-surface lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-28 -top-24 h-[360px] w-[360px] rounded-full border border-white/15" />
        <div className="absolute -bottom-36 -left-28 h-[420px] w-[420px] rounded-full bg-white/[0.06]" />

        <div className="relative">
          <p className="font-display text-[34px] font-semibold leading-none tracking-[-0.04em]">FisioCare</p>
          <p className="mt-2 text-sm text-white/70">Clínica de fisioterapia</p>
        </div>

        <div className="relative max-w-[480px]">
          <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.06em]">
            Cuidado organizado
          </span>
          <h1 className="mt-5 font-display text-[48px] font-semibold leading-[1.05] tracking-[-0.045em]">
            Mais tempo para cuidar de cada paciente.
          </h1>
          <p className="mt-5 max-w-[420px] text-base leading-7 text-white/75">
            Agenda, prontuários e conversas com pacientes reunidos em um só lugar.
          </p>
          <div className="mt-9 grid gap-3">
            <Feature icon={CalendarCheck} text="Agenda diária e confirmações" />
            <Feature icon={HeartPulse} text="Acompanhamento clínico organizado" />
            <Feature icon={MessageCircleMore} text="Atendimento integrado ao WhatsApp" />
          </div>
        </div>

        <p className="relative text-xs text-white/55">Uso exclusivo da clínica</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[430px]">
          <div className="mb-10 lg:hidden">
            <p className="font-display text-[30px] font-semibold tracking-[-0.04em] text-ink">FisioCare</p>
            <p className="mt-1 text-sm text-muted">Clínica de fisioterapia</p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-primary">Área profissional</p>
            <h2 className="mt-2 font-display text-[38px] font-semibold leading-tight tracking-[-0.04em] text-ink">Bem-vinda de volta</h2>
            <p className="mt-3 text-[15px] leading-6 text-muted">Entre para acessar a agenda e os dados da clínica.</p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-ink">Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seuemail@clinica.com"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-ink">Senha</span>
              <span className="relative flex">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  placeholder="Digite sua senha"
                  className={inputClass + " pr-12"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-muted hover:bg-canvas"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            {error && (
              <p role="alert" className="rounded-[12px] bg-[#F0DDDA] px-4 py-3 text-sm text-[#873C35]">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="mt-1 h-[50px] w-full rounded-full text-[15px]">
              {loading ? "Entrando..." : <>Entrar <ArrowRight size={18} /></>}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-muted">
            Primeiro acesso?{" "}
            <Link to="/cadastro" className="font-bold text-primary no-underline hover:underline">Criar conta profissional</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function Feature({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold text-white/85">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10"><Icon size={18} /></span>
      {text}
    </div>
  );
}
