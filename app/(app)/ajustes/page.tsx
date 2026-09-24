import Link from "next/link";
import { Wrench, MessageCircle, Bell, CalendarClock, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SeletorTema } from "@/components/ajustes/seletor-tema";

const ITENS = [
  {
    href: "/ajustes/agenda",
    icone: CalendarClock,
    titulo: "Agenda",
    descricao: "Horário de início e fim da grade",
  },
  {
    href: "/ajustes/servicos",
    icone: Wrench,
    titulo: "Serviços e preços",
    descricao: "Massagens oferecidas, duração e valores",
  },
  {
    href: "/ajustes/cobranca",
    icone: MessageCircle,
    titulo: "Cobrança",
    descricao: "Mensagem padrão e chave PIX",
  },
  {
    href: "/ajustes/notificacoes",
    icone: Bell,
    titulo: "Notificações",
    descricao: "Ativar push e escolher o que avisa",
  },
];

export default function AjustesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader titulo="Ajustes" />

      <p className="px-4 pt-4 pb-1 text-[13px] font-semibold uppercase tracking-wide text-text-muted">
        Aparência
      </p>
      <SeletorTema />

      <div className="mt-2 flex flex-col divide-y divide-border border-t border-border">
        {ITENS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-alt"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <item.icone size={19} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium text-text">{item.titulo}</p>
              <p className="truncate text-[13px] text-text-muted">{item.descricao}</p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-text-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
