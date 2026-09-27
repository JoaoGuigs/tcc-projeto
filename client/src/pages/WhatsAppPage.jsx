import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Info } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import { PageHeader } from "../components/PageHeader";
import {
  useMarcarConversaLida,
  useSendWhatsapp,
  useWhatsappConversa,
  useWhatsappConversas,
  useWhatsappStatus,
} from "../hooks/useWhatsapp";
import { formatPhone, onlyDigits } from "../utils/phone";

dayjs.locale("pt-br");

const MESSAGE_STATUS = {
  enviada: "Enviada",
  sent: "Enviada",
  delivered: "Entregue",
  read: "Lida",
  falhou: "Falhou",
  failed: "Falhou",
};

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function displayName(conversa) {
  return conversa?.paciente?.nome_completo || formatPhone(conversa?.numero || "");
}

function timeLabel(date) {
  const d = dayjs(date);
  if (d.isSame(dayjs(), "day")) return d.format("HH:mm");
  if (d.isSame(dayjs().subtract(1, "day"), "day")) return "Ontem";
  return d.format("DD/MM");
}

function ConversationItem({ conversa, selected, onSelect }) {
  const name = displayName(conversa);
  const unread = Number(conversa.nao_lidas) > 0;
  return (
    <button
      type="button"
      onClick={() => onSelect(conversa.numero)}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-[16px] p-[14px] text-left transition-all duration-150 active:scale-[0.99] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-primary ${selected ? "bg-primary-soft shadow-sm" : "bg-canvas hover:-translate-y-px hover:bg-primary-soft/60 hover:shadow-sm"}`}
    >
      <span className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-surface text-sm font-bold text-primary">
        {initials(conversa.paciente?.nome_completo || formatPhone(conversa.numero))}
      </span>
      <span className="flex min-w-0 grow basis-0 flex-col gap-[2px]">
        <span className="flex items-center justify-between gap-2">
          <strong className="truncate text-[15px] font-bold leading-[18px] text-ink">{name}</strong>
          <small className="shrink-0 text-xs leading-[16px] text-muted">{timeLabel(conversa.ultima_em)}</small>
        </span>
        <span className="flex items-center justify-between gap-2">
          <small className="truncate text-sm leading-[18px] text-muted">
            {conversa.ultima_direcao === "saida" ? "Você: " : ""}
            {conversa.ultimo_texto}
          </small>
          {unread && (
            <span className="flex h-[20px] min-w-[20px] shrink-0 items-center justify-center rounded-full bg-primary px-[6px] text-xs font-bold text-surface">
              {conversa.nao_lidas}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

function MessageBubble({ message }) {
  const fromMe = message.direcao === "saida";
  const failed = ["falhou", "failed"].includes(message.status);
  return (
    <div className={`flex max-w-[72%] flex-col gap-[2px] ${fromMe ? "self-end items-end" : "self-start items-start"}`}>
      <div className={`rounded-[16px] px-[14px] py-[10px] ${fromMe ? "bg-primary-soft" : "bg-canvas"}`}>
        <p className="whitespace-pre-wrap text-[15px] font-medium leading-[22px] text-ink">{message.texto}</p>
      </div>
      <span className="px-[4px] text-[11px] leading-[14px] text-muted">
        {dayjs(message.criado_em).format("DD/MM · HH:mm")}
        {fromMe ? ` · ${MESSAGE_STATUS[message.status] || "Enviada"}` : ""}
      </span>
      {failed && (
        <span className="rounded-[10px] bg-[#FBEAEA] px-[10px] py-[6px] text-[11px] leading-[14px] text-[#C62828]">
          Falha no processamento: {message.erro || "erro desconhecido"}
        </span>
      )}
    </div>
  );
}

export default function WhatsAppPage() {
  const { setPageTitle } = useOutletContext();
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [texto, setTexto] = useState("");
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    setPageTitle("WhatsApp");
  }, [setPageTitle]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const { data: conversas = [], isPending } = useWhatsappConversas();
  const { data: status } = useWhatsappStatus();
  const { data: conversa } = useWhatsappConversa(selected);
  const send = useSendWhatsapp();
  const marcarLida = useMarcarConversaLida();

  const { data: templates = [] } = useQuery({
    queryKey: ["mensagens-padrao"],
    queryFn: async () => (await api.get("/configuracoes/mensagens")).data,
  });

  const selecionada = useMemo(() => conversas.find((c) => c.numero === selected) || null, [conversas, selected]);

  useEffect(() => {
    if (!selected && conversas.length > 0) setSelected(conversas[0].numero);
  }, [conversas, selected]);

  const naoLidasSelecionada = selecionada?.nao_lidas || 0;
  useEffect(() => {
    if (selected && naoLidasSelecionada > 0) marcarLida.mutate(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, naoLidasSelecionada]);

  const mensagens = conversa?.mensagens || [];
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens.length, selected]);

  const filtradas = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversas;
    return conversas.filter((conversa) => {
      const name = conversa.paciente?.nome_completo || "";
      const phone = formatPhone(conversa.numero);
      return name.toLowerCase().includes(term) || phone.toLowerCase().includes(term) || conversa.numero.includes(onlyDigits(term));
    });
  }, [conversas, search]);

  const totalNaoLidas = conversas.reduce((acc, c) => acc + Number(c.nao_lidas || 0), 0);
  const needsActivation = status?.configurado === false;
  const connectionIssue = status?.configurado === true && ["close", "indisponivel"].includes(status.conexao);

  async function handleSend(event) {
    event.preventDefault();
    setFormError("");
    if (needsActivation) {
      setFormError("O envio de mensagens ainda não está disponível nesta clínica.");
      return;
    }
    if (!selected) {
      setFormError("Selecione uma conversa para responder.");
      return;
    }
    if (!texto.trim()) {
      setFormError("Escreva a mensagem que deseja enviar.");
      return;
    }
    try {
      await send.mutateAsync({ numero: selected, texto: texto.trim() });
      setTexto("");
      setToast({ tone: "success", message: "Mensagem enviada." });
    } catch (error) {
      setFormError(error.userMessage || "Não foi possível enviar a mensagem.");
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-[22px] text-[12px] antialiased">
      <PageHeader eyebrow="Conversas da clínica" title="WhatsApp" />

      {(needsActivation || connectionIssue) && (
        <div role="status" className="flex items-start gap-3 rounded-[16px] border border-border bg-surface px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Info size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-bold leading-5 text-ink">
              {needsActivation ? "Envio de mensagens indisponível" : "WhatsApp temporariamente indisponível"}
            </p>
            <p className="mt-1 text-sm leading-5 text-muted">
              {needsActivation
                ? "Você pode ler as conversas. Para responder por aqui, peça à equipe responsável que ative o WhatsApp da clínica."
                : "Pode haver atraso nas mensagens. Tente novamente em alguns minutos."}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-[16px] xl:flex-row">
        {/* Conversas */}
        <section className="flex w-full flex-col gap-[10px] rounded-[20px] border border-solid border-border bg-surface p-[16px] xl:w-[380px] xl:shrink-0">
          <div className="flex items-center justify-between gap-3 px-1 pt-1 pb-[6px]">
            <h2 className="font-display text-[20px] font-semibold leading-[26px] text-ink">Conversas</h2>
            {totalNaoLidas > 0 && (
              <span className="shrink-0 rounded-full bg-warning-soft px-[10px] py-[6px] text-xs font-bold leading-[16px] text-[#7A5A1E]">
                {totalNaoLidas} {totalNaoLidas === 1 ? "mensagem nova" : "mensagens novas"}
              </span>
            )}
          </div>

          <label className="flex h-[42px] shrink-0 items-center gap-[10px] rounded-[12px] border border-solid border-border bg-canvas px-[14px]">
            <svg width="17" height="17" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="7" fill="none" stroke="#66736c" strokeWidth="1.8" />
              <path d="m20 20-4-4" fill="none" stroke="#66736c" strokeWidth="1.8" />
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar conversa"
              className="w-full bg-transparent text-[14px] leading-[18px] text-ink outline-none placeholder:text-muted"
            />
          </label>

          <div className="flex max-h-[320px] min-h-0 flex-col gap-2 overflow-y-auto xl:max-h-none xl:grow xl:basis-0">
            {filtradas.map((conversa) => (
              <ConversationItem
                key={conversa.numero}
                conversa={conversa}
                selected={conversa.numero === selected}
                onSelect={setSelected}
              />
            ))}
            {!isPending && filtradas.length === 0 && (
              <p className="rounded-[16px] bg-canvas p-4 text-center text-sm leading-[20px] text-muted">
                {conversas.length === 0
                  ? needsActivation
                    ? "As conversas aparecerão aqui quando o WhatsApp da clínica estiver disponível."
                    : "Nenhuma conversa ainda. As mensagens dos pacientes aparecerão aqui."
                  : "Nenhuma conversa encontrada para esta busca."}
              </p>
            )}
          </div>
        </section>

        {/* Conversa */}
        <section className="flex min-w-0 grow basis-0 flex-col gap-[14px] rounded-[20px] border border-solid border-border bg-surface p-[22px]">
          {selecionada ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-primary-soft text-base font-bold text-primary">
                    {initials(selecionada.paciente?.nome_completo || formatPhone(selecionada.numero))}
                  </span>
                  <div className="flex flex-col">
                    <strong className="text-[20px] font-semibold leading-[26px] text-ink">{displayName(selecionada)}</strong>
                    <small className="text-xs leading-[16px] text-muted">
                      {formatPhone(selecionada.numero)}
                      {selecionada.paciente ? " · paciente cadastrado" : " · sem cadastro"}
                    </small>
                  </div>
                </div>
                <div className="flex items-center gap-[10px]">
                  <Link
                    to="/pacientes"
                    className="inline-flex h-[44px] items-center rounded-full border border-solid border-border bg-surface px-[18px] text-sm font-semibold leading-[18px] text-ink no-underline transition-all duration-150 hover:-translate-y-px hover:border-primary/40 hover:bg-canvas hover:shadow-sm active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    Ver pacientes
                  </Link>
                  <Link
                    to="/atendimentos/novo"
                    className="inline-flex h-[44px] items-center rounded-full bg-primary px-[18px] text-sm font-semibold leading-[18px] text-surface no-underline shadow-[0_1px_0_rgba(31,42,36,0.08)] transition-all duration-150 hover:-translate-y-px hover:bg-[#245a54] hover:shadow-md active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Abrir ficha
                  </Link>
                </div>
              </div>

              <div className="flex min-h-[180px] max-h-[360px] flex-col gap-[10px] overflow-y-auto rounded-[16px] bg-surface py-2 xl:max-h-none xl:min-h-0 xl:grow xl:basis-0 xl:justify-end">
                {mensagens.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {mensagens.length === 0 && (
                  <p className="self-center rounded-[16px] bg-canvas px-4 py-3 text-center text-sm text-muted">
                    Nenhuma mensagem nesta conversa ainda.
                  </p>
                )}
                <div ref={endRef} />
              </div>

              <form className="flex shrink-0 flex-col gap-[10px]" onSubmit={handleSend}>
                {templates.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {templates.slice(0, 4).map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => {
                          setTexto(template.mensagem);
                          setFormError("");
                        }}
                        className="cursor-pointer rounded-full border border-solid border-border bg-canvas px-[12px] py-[6px] text-xs font-bold text-ink transition-all duration-150 hover:-translate-y-px hover:border-primary/40 hover:bg-primary-soft hover:shadow-sm active:translate-y-0 active:scale-[0.96] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        {template.titulo}
                      </button>
                    ))}
                  </div>
                )}
                {formError && (
                  <p className="rounded-[12px] bg-[#FBEAEA] px-4 py-3 text-sm leading-[20px] text-[#C62828]">{formError}</p>
                )}
                <div className="flex items-end gap-[10px]">
                  <textarea
                    value={texto}
                    onChange={(event) => setTexto(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSend(event);
                      }
                    }}
                    placeholder={needsActivation ? "Envio de mensagens indisponível" : "Escreva uma mensagem... (Enter envia, Shift+Enter quebra linha)"}
                    rows={2}
                    disabled={needsActivation}
                    className="min-h-[52px] w-full resize-y rounded-[16px] border border-solid border-border bg-surface px-4 py-3 text-[15px] leading-[22px] text-ink outline-none placeholder:text-muted focus:border-primary disabled:cursor-not-allowed disabled:bg-canvas"
                  />
                  <button
                    type="submit"
                    disabled={send.isPending || needsActivation}
                    className="inline-flex h-[52px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary px-[22px] text-sm font-bold leading-[18px] text-surface shadow-[0_1px_0_rgba(31,42,36,0.08)] transition-all duration-150 hover:-translate-y-px hover:bg-[#245a54] hover:shadow-md active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    {send.isPending ? "Enviando..." : "Enviar"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex grow basis-0 flex-col items-center justify-center gap-2 text-center">
              <span className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-primary-soft">
                <svg width="26" height="26" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.45L3 20l1.1-5.1A8.5 8.5 0 1 1 21 11.5z" fill="none" stroke="#2f6f68" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="font-display text-[22px] font-semibold leading-[28px] text-ink">Selecione uma conversa</p>
              <p className="max-w-[420px] text-sm leading-[20px] text-muted">
                As mensagens recebidas no WhatsApp da clínica aparecem à esquerda, com o resultado do
                agendamento feito pelo assistente. Escolha uma conversa para responder.
              </p>
            </div>
          )}
        </section>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-[12px] px-4 py-3 text-sm font-bold text-white ${toast.tone === "error" ? "bg-[#C62828]" : "bg-primary"}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
