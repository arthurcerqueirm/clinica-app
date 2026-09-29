import { TelaCarregando } from "@/components/ui/tela-carregando";

export default function Loading() {
  return <TelaCarregando titulo="Novo agendamento" voltarPara="/agenda" tipo="lista" />;
}
