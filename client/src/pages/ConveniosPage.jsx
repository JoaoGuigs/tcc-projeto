import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Building2, Plus, Search, Trash2 } from "lucide-react";
import { useConvenios, useCreateConvenio, useDeleteConvenio } from "../hooks/useConvenios";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { PageHeader } from "../components/PageHeader";

export default function ConveniosPage({ embedded = false }) {
  const { setPageTitle } = useOutletContext();
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [removing, setRemoving] = useState(null);
  const [notice, setNotice] = useState("");
  const { data: convenios = [], isPending, isError, refetch } = useConvenios();
  const createConvenio = useCreateConvenio();
  const deleteConvenio = useDeleteConvenio();
  useEffect(() => { if (!embedded) setPageTitle("Convênios"); }, [embedded, setPageTitle]);

  const filtered = convenios.filter((item) => item.nome_convenio.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));
  async function create(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    setNotice("");
    try {
      await createConvenio.mutateAsync(trimmed);
      setName("");
      setNotice("Convênio cadastrado.");
    } catch { /* O erro da mutação é exibido junto ao formulário. */ }
  }
  async function remove() {
    if (!removing) return;
    setNotice("");
    try {
      await deleteConvenio.mutateAsync(removing.id);
      setNotice(`${removing.nome_convenio} foi removido.`);
      setRemoving(null);
    } catch { /* O servidor impede exclusão quando há pacientes vinculados. */ }
  }

  return <div className={`flex w-full flex-col ${embedded ? "" : "gap-5 pb-4"}`}>
    {!embedded && <PageHeader title="Convênios" eyebrow="Gestão da clínica" showActions={false} />}
    {!embedded && <p className="max-w-2xl text-sm leading-6 text-muted">Cadastre os convênios usados nos pacientes. O tipo de cobertura e os valores de repasse ainda não são armazenados pelo sistema.</p>}
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
      <Card className="p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-bold text-ink">Convênios cadastrados</h3><p className="mt-1 text-sm text-muted">{isPending ? "Carregando…" : `${convenios.length} ${convenios.length === 1 ? "convênio" : "convênios"}`}</p></div><label className="flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-3"><Search size={17} className="text-muted" aria-hidden="true" /><span className="sr-only">Buscar convênio</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar convênio" className="min-w-0 bg-transparent text-sm text-ink outline-none" /></label></div>
        {isError && <p role="alert" className="mt-5 rounded-xl bg-[#f1ddda] p-4 text-sm text-[#75413d]">Não foi possível carregar os convênios. <button type="button" onClick={() => refetch()} className="font-bold underline transition-colors hover:text-[#613330] focus-visible:outline-2 focus-visible:outline-primary">Tentar novamente</button></p>}
        <div className="mt-5 divide-y divide-border">
          {isPending && <p role="status" className="py-8 text-sm text-muted">Carregando convênios…</p>}
          {!isPending && !isError && filtered.length === 0 && <p className="py-8 text-sm text-muted">{search ? "Nenhum convênio corresponde à busca." : "Nenhum convênio cadastrado. Adicione o primeiro no formulário ao lado."}</p>}
          {filtered.map((item) => <div key={item.id} className="flex min-h-16 items-center justify-between gap-3 py-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><Building2 size={18} aria-hidden="true" /></span><span className="truncate font-semibold text-ink">{item.nome_convenio}</span></div><button type="button" onClick={() => { deleteConvenio.reset(); setRemoving(item); }} className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-xl text-muted transition-all duration-150 hover:-translate-y-px hover:bg-[#f1ddda] hover:text-[#75413d] hover:shadow-sm active:translate-y-0 active:scale-[0.95] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-primary" aria-label={`Excluir ${item.nome_convenio}`}><Trash2 size={18} aria-hidden="true" /></button></div>)}
        </div>
      </Card>
      <Card className="h-fit p-5 sm:p-6"><h3 className="text-xl font-bold text-ink">Adicionar convênio</h3><p className="mt-1 text-sm leading-5 text-muted">Use o nome que a clínica reconhece no cadastro do paciente.</p><form onSubmit={create} className="mt-5 flex flex-col gap-4"><label className="flex flex-col gap-2 text-sm font-semibold text-ink">Nome do convênio<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={150} required placeholder="Ex.: Saúde+" className="h-12 rounded-xl border border-border bg-[#fbfaf7] px-3 font-normal focus-visible:outline-2 focus-visible:outline-primary" /></label><Button type="submit" disabled={createConvenio.isPending || name.trim().length < 2}><Plus size={17} aria-hidden="true" />{createConvenio.isPending ? "Salvando…" : "Adicionar convênio"}</Button></form>{createConvenio.isError && <p role="alert" className="mt-4 text-sm text-[#75413d]">{createConvenio.error?.userMessage || "Não foi possível cadastrar. Confira o nome e tente novamente."}</p>}{notice && <p role="status" className="mt-4 text-sm font-semibold text-primary">{notice}</p>}</Card>
    </div>
    {removing && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setRemoving(null); }}><div role="dialog" aria-modal="true" aria-labelledby="remove-convenio-title" className="w-full max-w-md rounded-2xl bg-white p-6"><h3 id="remove-convenio-title" className="text-xl font-bold text-ink">Excluir {removing.nome_convenio}?</h3><p className="mt-3 text-sm leading-6 text-muted">O convênio será removido do cadastro. Pacientes vinculados podem impedir a exclusão.</p>{deleteConvenio.isError && <p role="alert" className="mt-4 text-sm text-[#75413d]">{deleteConvenio.error?.userMessage || "Não foi possível excluir o convênio."}</p>}<div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={() => setRemoving(null)}>Cancelar</Button><Button onClick={remove} disabled={deleteConvenio.isPending} className="bg-[#75413d] hover:bg-[#613330]">{deleteConvenio.isPending ? "Excluindo…" : "Excluir convênio"}</Button></div></div></div>}
  </div>;
}
