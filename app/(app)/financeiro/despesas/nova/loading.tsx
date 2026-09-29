import { TelaCarregando } from "@/components/ui/tela-carregando";

export default function Loading() {
  return <TelaCarregando titulo="Nova despesa" voltarPara="/financeiro/despesas" tipo="form" />;
}
