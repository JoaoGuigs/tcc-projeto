import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
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

const CONNECTION = {
  open: { label: "Conectado", dot: "bg-primary" },
  connecting: { label: "Conectando", dot: "bg-[#8C6A28]" },
  close: { label: "Desconectado", dot: "bg-[#C62828]" },
  unknown: { label: "Conexão indefinida", dot: "bg-muted" },
  indisponivel: { label: "Serviço indisponível", dot: "bg-[#C62828]" },
  nao_configurado: { label: "Não configurado", dot: "bg-[#8C6A28]" },
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
      className={`flex w-full cursor-pointer items-center gap-3 rounded-[16px] p-[14px] text-left transition-colors ${selected ? "bg-primary-soft" : "bg-canvas hover:bg-primary-soft/60"}`}
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
  const failed = message.status === "falhou";
  return (
    <div className={`flex max-w-[72%] flex-col gap-[2px] ${fromMe ? "self-end items-end" : "self-start items-start"}`}>
      <div className={`rounded-[16px] px-[14px] py-[10px] ${fromMe ? "bg-primary-soft" : "bg-canvas"}`}>
        <p className="whitespace-pre-wrap text-[15px] font-medium leading-[22px] text-ink">{message.texto}</p>
      </div>
      <span className="px-[4px] text-[11px] leading-[14px] text-muted">
        {dayjs(message.criado_em).format("DD/MM · HH:mm")}
        {fromMe ? " · Enviada" : ""}
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
  const connection = CONNECTION[status?.conexao] || CONNECTION.unknown;

  async function handleSend(event) {
    event.preventDefault();
    setFormError("");
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

      <div className="flex flex-1 flex-col gap-[16px] xl:flex-row">
        {/* Conversas */}
        <section className="flex w-full flex-col gap-[10px] rounded-[20px] border border-solid border-border bg-surface p-[16px] xl:w-[380px] xl:shrink-0">
          <div className="flex flex-col gap-[8px] px-1 pt-1 pb-[6px]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-[20px] font-semibold leading-[26px] text-ink">Conversas</h3>
              <span className={`inline-block rounded-full px-[10px] py-[6px] text-xs font-bold leading-[16px] ${totalNaoLidas > 0 ? "bg-warning-soft text-[#7A5A1E]" : "bg-canvas text-muted"}`}>
                {totalNaoLidas > 0 ? `${totalNaoLidas} não lidas` : "Tudo lido"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-[6px] text-xs font-bold leading-[16px] text-muted">
                <span className={`h-[7px] w-[7px] rounded-full ${connection.dot}`} />
                {connection.label}
              </span>
              {!status?.configurado && (
                <Link to="/configuracoes" className="text-xs font-bold leading-[16px] text-primary no-underline hover:underline">
                  Configurar →
                </Link>
              )}
            </div>
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

          <div className="flex min-h-0 grow basis-0 flex-col gap-2 overflow-y-auto">
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
                  ? "Nenhuma conversa ainda. As mensagens do número autorizado aparecem aqui."
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
                    className="inline-flex h-[44px] items-center rounded-full border border-solid border-border bg-surface px-[18px] text-sm font-semibold leading-[18px] text-ink no-underline hover:bg-canvas"
                  >
                    Ver pacientes
                  </Link>
                  <Link
                    to="/atendimentos/novo"
                    className="inline-flex h-[44px] items-center rounded-full bg-primary px-[18px] text-sm font-semibold leading-[18px] text-surface no-underline transition-colors hover:bg-[#245a54]"
                  >
                    Abrir ficha
                  </Link>
                </div>
              </div>

              <div className="flex min-h-0 grow basis-0 flex-col justify-end gap-[10px] overflow-y-auto rounded-[16px] bg-surface py-2">
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
                        className="cursor-pointer rounded-full border border-solid border-border bg-canvas px-[12px] py-[6px] text-xs font-bold text-ink hover:bg-primary-soft"
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
                    placeholder="Escreva uma mensagem... (Enter envia, Shift+Enter quebra linha)"
                    rows={2}
                    className="min-h-[52px] w-full resize-y rounded-[16px] border border-solid border-border bg-surface px-4 py-3 text-[15px] leading-[22px] text-ink outline-none placeholder:text-muted focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={send.isPending}
                    className="inline-flex h-[52px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary px-[22px] text-sm font-bold leading-[18px] text-surface transition-colors hover:bg-[#245a54] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {send.isPending ? "Enviando..." : "Enviar"}
                  </button>
                </div>
                {!status?.configurado && (
                  <span className="text-xs leading-[16px] text-muted">
                    Envio indisponível: configure a Evolution API em Configurações.
                  </span>
                )}
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
                As mensagens recebidas no número autorizado aparecem à esquerda, com o resultado do
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
