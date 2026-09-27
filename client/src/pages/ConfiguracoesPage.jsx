import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useOutletContext } from "react-router-dom";
import { ArrowRight, Building2, MessageSquareText, Plus, Settings2, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { PageHeader } from "../components/PageHeader";
import ConveniosPage from "./ConveniosPage";
import api from "../services/api";

const emptyClinic = { nome_clinica: "", cnpj: "", telefone: "", email: "" };
const emptyMessage = { titulo: "", mensagem: "" };
const fieldClass = "h-12 w-full rounded-xl border border-border bg-[#fbfaf7] px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-primary";

export default function ConfiguracoesPage() {
  const { setPageTitle } = useOutletContext();
  const queryClient = useQueryClient();
  const [section, setSection] = useState("clinica");
  const [clinic, setClinic] = useState(emptyClinic);
  const [message, setMessage] = useState(emptyMessage);
  const [editingId, setEditingId] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [notice, setNotice] = useState("");
  useEffect(() => setPageTitle("Configurações"), [setPageTitle]);

  const clinicQuery = useQuery({ queryKey: ["settings-clinic"], queryFn: async () => (await api.get("/configuracoes/clinica")).data });
  const messagesQuery = useQuery({ queryKey: ["settings-messages"], queryFn: async () => (await api.get("/configuracoes/mensagens")).data });
  useEffect(() => { if (clinicQuery.data) setClinic({ ...emptyClinic, ...clinicQuery.data }); }, [clinicQuery.data]);
  const saveClinic = useMutation({ mutationFn: async (value) => api.put("/configuracoes/clinica", value), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings-clinic"] }) });
  const saveMessage = useMutation({ mutationFn: async ({ id, value }) => id ? api.put(`/configuracoes/mensagens/${id}`, value) : api.post("/configuracoes/mensagens", value), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings-messages"] }) });
  const deleteMessage = useMutation({ mutationFn: async (id) => api.delete(`/configuracoes/mensagens/${id}`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings-messages"] }) });

  async function submitClinic(event) {
    event.preventDefault();
    setNotice("");
    try { await saveClinic.mutateAsync(clinic); setNotice("Dados da clínica salvos."); } catch { /* Erro exibido abaixo do formulário. */ }
  }
  async function submitMessage(event) {
    event.preventDefault();
    setNotice("");
    try {
      await saveMessage.mutateAsync({ id: editingId, value: { titulo: message.titulo.trim(), mensagem: message.mensagem.trim() } });
      setMessage(emptyMessage); setEditingId(null); setNotice("Mensagem salva.");
    } catch { /* Erro exibido abaixo do formulário. */ }
  }
  async function confirmDelete() {
    if (!removing) return;
    try { await deleteMessage.mutateAsync(removing.id); setRemoving(null); setNotice("Mensagem excluída."); } catch { /* Erro exibido no diálogo. */ }
  }

  return <div className="flex w-full flex-col gap-5 pb-4">
    <PageHeader title="Configurações" eyebrow="Preferências da clínica" showActions={false} />
    <p className="max-w-2xl text-sm leading-6 text-muted">Gerencie os dados da clínica, os convênios usados nos cadastros e as mensagens para conversar com pacientes.</p>
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <nav aria-label="Seções de configurações" className="flex h-fit gap-2 overflow-x-auto rounded-2xl border border-border bg-white p-3 lg:flex-col">{[["clinica", "Dados da clínica", Building2], ["mensagens", "Mensagens", MessageSquareText], ["convenios", "Convênios", ShieldCheck], ["integracoes", "Integrações", Settings2]].map(([id, label, Icon]) => <button key={id} type="button" onClick={() => { setSection(id); setNotice(""); }} aria-current={section === id ? "page" : undefined} className={`flex min-h-11 shrink-0 cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-all duration-150 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-primary ${section === id ? "bg-primary-soft text-primary shadow-sm" : "text-muted hover:-translate-y-px hover:bg-canvas hover:text-ink hover:shadow-sm"}`}><Icon size={18} aria-hidden="true" />{label}</button>)}</nav>
      <div className="min-w-0">
        {section === "clinica" && <Card className="p-5 sm:p-7"><div className="border-b border-border pb-5"><h3 className="text-2xl font-bold text-ink">Dados da clínica</h3><p className="mt-1 text-sm text-muted">Informações de contato do espaço.</p></div>{clinicQuery.isPending ? <p role="status" className="py-8 text-sm text-muted">Carregando dados…</p> : clinicQuery.isError ? <p role="alert" className="py-6 text-sm text-[#75413d]">Não foi possível carregar os dados da clínica. <button type="button" className="font-bold underline transition-colors hover:text-[#613330] focus-visible:outline-2 focus-visible:outline-primary" onClick={() => clinicQuery.refetch()}>Tentar novamente</button></p> : <form onSubmit={submitClinic} className="mt-6 flex flex-col gap-5"><div className="grid gap-5 sm:grid-cols-2">{[["nome_clinica", "Nome da clínica", "text", true], ["cnpj", "CNPJ ou CPF", "text", false], ["telefone", "Telefone", "tel", false], ["email", "E-mail", "email", true]].map(([key, label, type, required]) => <label key={key} className="flex flex-col gap-2 text-sm font-semibold text-ink">{label}<input type={type} value={clinic[key]} onChange={(event) => setClinic((value) => ({ ...value, [key]: event.target.value }))} required={required} maxLength={key === "nome_clinica" ? 180 : key === "email" ? 255 : 20} className={fieldClass} /></label>)}</div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"><Link to="/convenios" className="inline-flex items-center gap-1 text-sm font-bold text-primary transition-all duration-150 hover:gap-2 hover:text-[#245a54] hover:underline focus-visible:outline-2 focus-visible:outline-primary">Gerenciar convênios <ArrowRight size={16} /></Link><Button type="submit" disabled={saveClinic.isPending || !clinic.nome_clinica.trim() || !clinic.email.trim()}>{saveClinic.isPending ? "Salvando…" : "Salvar alterações"}</Button></div>{saveClinic.isError && <p role="alert" className="text-sm text-[#75413d]">{saveClinic.error?.userMessage || "Não foi possível salvar. Revise os campos e tente novamente."}</p>}</form>}</Card>}
        {section === "mensagens" && <div className="flex flex-col gap-4"><Card className="p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-2xl font-bold text-ink">Mensagens padrão</h3><p className="mt-1 text-sm text-muted">Textos de apoio para a comunicação da clínica.</p></div><Button variant="outline" onClick={() => { setEditingId(null); setMessage(emptyMessage); saveMessage.reset(); document.getElementById("message-title")?.focus(); }}><Plus size={16} aria-hidden="true" /> Nova mensagem</Button></div>{messagesQuery.isPending ? <p role="status" className="py-8 text-sm text-muted">Carregando mensagens…</p> : messagesQuery.isError ? <p role="alert" className="py-6 text-sm text-[#75413d]">Não foi possível carregar as mensagens. <button type="button" className="font-bold underline transition-colors hover:text-[#613330] focus-visible:outline-2 focus-visible:outline-primary" onClick={() => messagesQuery.refetch()}>Tentar novamente</button></p> : <div className="mt-5 divide-y divide-border">{messagesQuery.data?.length === 0 && <p className="py-6 text-sm text-muted">Nenhuma mensagem cadastrada. Crie uma para começar.</p>}{messagesQuery.data?.map((item) => <div key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-4"><div className="min-w-0 flex-1"><strong className="text-ink">{item.titulo}</strong><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted">{item.mensagem}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => { setEditingId(item.id); setMessage({ titulo: item.titulo, mensagem: item.mensagem }); }}>Editar</Button><button type="button" aria-label={`Excluir ${item.titulo}`} onClick={() => { deleteMessage.reset(); setRemoving(item); }} className="grid h-11 w-11 cursor-pointer place-items-center rounded-xl text-muted transition-all duration-150 hover:-translate-y-px hover:bg-[#f1ddda] hover:text-[#75413d] hover:shadow-sm active:translate-y-0 active:scale-[0.95] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-primary"><Trash2 size={17} aria-hidden="true" /></button></div></div>)}</div>}</Card><Card className="p-5 sm:p-7"><h4 className="text-xl font-bold text-ink">{editingId ? "Editar mensagem" : "Criar mensagem"}</h4><form onSubmit={submitMessage} className="mt-5 flex flex-col gap-4"><label className="flex flex-col gap-2 text-sm font-semibold text-ink">Título<input id="message-title" value={message.titulo} onChange={(event) => setMessage((value) => ({ ...value, titulo: event.target.value }))} required minLength={2} maxLength={150} className={fieldClass} /></label><label className="flex flex-col gap-2 text-sm font-semibold text-ink">Texto<textarea value={message.mensagem} onChange={(event) => setMessage((value) => ({ ...value, mensagem: event.target.value }))} required minLength={2} maxLength={2000} rows={5} className="w-full rounded-xl border border-border bg-[#fbfaf7] p-3 font-normal focus-visible:outline-2 focus-visible:outline-primary" /></label><div className="flex flex-wrap justify-end gap-2">{editingId && <Button variant="outline" onClick={() => { setEditingId(null); setMessage(emptyMessage); }}>Cancelar edição</Button>}<Button type="submit" disabled={saveMessage.isPending || message.titulo.trim().length < 2 || message.mensagem.trim().length < 2}>{saveMessage.isPending ? "Salvando…" : "Salvar mensagem"}</Button></div>{saveMessage.isError && <p role="alert" className="text-sm text-[#75413d]">{saveMessage.error?.userMessage || "Não foi possível salvar a mensagem."}</p>}</form></Card></div>}
        {section === "convenios" && <ConveniosPage embedded />}
        {section === "integracoes" && <Card className="p-5 sm:p-7"><h3 className="text-2xl font-bold text-ink">Integrações</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">A conexão e o envio pelo WhatsApp são gerenciados na área de conversas. Abra essa tela para consultar o estado atual da integração.</p><Link to="/whatsapp" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white no-underline shadow-[0_1px_0_rgba(31,42,36,0.08)] transition-all duration-150 hover:-translate-y-px hover:bg-[#245a54] hover:shadow-md active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Abrir WhatsApp <ArrowRight size={17} /></Link></Card>}
        {notice && <p role="status" className="mt-4 text-sm font-semibold text-primary">{notice}</p>}
      </div>
    </div>
    {removing && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setRemoving(null); }}><div role="dialog" aria-modal="true" aria-labelledby="remove-message-title" className="w-full max-w-md rounded-2xl bg-white p-6"><h3 id="remove-message-title" className="text-xl font-bold text-ink">Excluir “{removing.titulo}”?</h3><p className="mt-3 text-sm leading-6 text-muted">Essa mensagem será removida das opções da clínica.</p>{deleteMessage.isError && <p role="alert" className="mt-4 text-sm text-[#75413d]">{deleteMessage.error?.userMessage || "Não foi possível excluir a mensagem."}</p>}<div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={() => setRemoving(null)}>Cancelar</Button><Button onClick={confirmDelete} disabled={deleteMessage.isPending} className="bg-[#75413d] hover:bg-[#613330]">{deleteMessage.isPending ? "Excluindo…" : "Excluir mensagem"}</Button></div></div></div>}
  </div>;
}
