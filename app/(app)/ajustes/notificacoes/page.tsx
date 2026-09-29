import { Tela } from "@/components/ui/tela";
import { PageHeader } from "@/components/ui/page-header";
import { NotificacoesConfig } from "@/components/ajustes/notificacoes-config";
import { buscarPrefsNotificacao } from "@/lib/data/configuracoes";

export default async function NotificacoesPage() {
  const prefs = await buscarPrefsNotificacao();

  return (
    <Tela>
      <PageHeader titulo="Notificações" voltarPara="/ajustes" />
      <NotificacoesConfig prefsIniciais={prefs} />
    </Tela>
  );
}
