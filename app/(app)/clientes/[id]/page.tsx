import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, MessageCircle, CalendarPlus, Pencil } from "lucide-react";
import { Tela } from "@/components/ui/tela";
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
    <Tela>
      <PageHeader titulo={cliente.nome} voltarPara="/clientes" />

      <div className="surgir mx-4 mt-1 flex items-center justify-around rounded-2xl border border-border bg-surface px-2 py-3.5 shadow-(--shadow-sm)">
        <AcaoTopo
          indice={1}
          icone={Phone}
          label="Ligar"
          href={cliente.telefone ? `tel:${cliente.telefone}` : undefined}
        />
        <AcaoTopo
          indice={2}
          icone={MessageCircle}
          label="WhatsApp"
          href={cliente.telefone ? linkWhatsApp(cliente.telefone) : undefined}
        />
        <AcaoTopo
          indice={3}
          icone={CalendarPlus}
          label="Agendar"
          href={`/agenda/novo?cliente=${id}`}
          interno
        />
        <AcaoTopo indice={4} icone={Pencil} label="Editar" href={`/clientes/${id}/editar`} interno />
      </div>

      <FichaClienteTabs ficha={ficha} />

      <div className="px-4 pt-2 pb-4">
        <ArquivarClienteButton clienteId={id} />
      </div>
    </Tela>
  );
}

function AcaoTopo({
  icone: Icone,
  label,
  href,
  interno,
  indice,
}: {
  icone: typeof Phone;
  label: string;
  href?: string;
  interno?: boolean;
  indice: number;
}) {
  const conteudo = (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="pop flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary"
        style={{ "--i": indice } as React.CSSProperties}
      >
        <Icone size={20} />
      </div>
      <span className="text-[12px] font-medium text-text-muted">{label}</span>
    </div>
  );

  if (!href) {
    return <div className="opacity-40">{conteudo}</div>;
  }

  return (
    <Link
      href={href}
      transitionTypes={interno ? ["avancar"] : undefined}
      className="no-select pressable rounded-2xl px-2 py-1"
    >
      {conteudo}
    </Link>
  );
}
