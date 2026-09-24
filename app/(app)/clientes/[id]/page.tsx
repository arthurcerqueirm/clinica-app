import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, MessageCircle, CalendarPlus, Pencil } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FichaClienteTabs } from "@/components/clientes/ficha-cliente-tabs";
import { ArquivarClienteButton } from "@/components/clientes/arquivar-cliente-button";
import { buscarFichaCliente } from "@/lib/data/clientes";
import { linkWhatsApp } from "@/lib/whatsapp";

export default async function FichaClientePage({ params }: PageProps<"/clientes/[id]">) {
  const { id } = await params;
  const ficha = await buscarFichaCliente(id);

  if (!ficha.cliente) notFound();

  const { cliente } = ficha;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader titulo={cliente.nome} voltarPara="/clientes" />

      <div className="flex items-center justify-around border-b border-border px-4 py-3">
        <AcaoTopo
          icone={Phone}
          label="Ligar"
          href={cliente.telefone ? `tel:${cliente.telefone}` : undefined}
        />
        <AcaoTopo
          icone={MessageCircle}
          label="WhatsApp"
          href={cliente.telefone ? linkWhatsApp(cliente.telefone) : undefined}
        />
        <AcaoTopo icone={CalendarPlus} label="Agendar" href={`/agenda/novo?cliente=${id}`} />
        <AcaoTopo icone={Pencil} label="Editar" href={`/clientes/${id}/editar`} />
      </div>

      <FichaClienteTabs ficha={ficha} />

      <div className="border-t border-border px-4 py-4">
        <ArquivarClienteButton clienteId={id} />
      </div>
    </div>
  );
}

function AcaoTopo({
  icone: Icone,
  label,
  href,
}: {
  icone: typeof Phone;
  label: string;
  href?: string;
}) {
  const conteudo = (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icone size={19} />
      </div>
      <span className="text-[12px] text-text-muted">{label}</span>
    </div>
  );

  if (!href) {
    return <div className="opacity-40">{conteudo}</div>;
  }

  return (
    <Link href={href} className="no-select">
      {conteudo}
    </Link>
  );
}
