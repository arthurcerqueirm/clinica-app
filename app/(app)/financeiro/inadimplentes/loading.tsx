import { TelaCarregando } from "@/components/ui/tela-carregando";

export default function Loading() {
  return <TelaCarregando titulo="Quem está devendo" voltarPara="/financeiro" tipo="lista" />;
}
