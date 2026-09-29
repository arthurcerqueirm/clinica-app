import { TelaCarregando } from "@/components/ui/tela-carregando";

export default function Loading() {
  return <TelaCarregando titulo="Novo pacote" voltarPara="/financeiro/pacotes" tipo="form" />;
}
