"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { salvarConfiguracaoCobrancaAction } from "@/lib/actions/configuracoes";

export function ConfiguracaoCobrancaForm({
  mensagem,
  chavePix,
}: {
  mensagem: string;
  chavePix: string;
}) {
  const [estado, formAction, pendente] = useActionState(salvarConfiguracaoCobrancaAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4 px-4 py-4">
      {estado.erro && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{estado.erro}</p>
      )}
      {estado.salvo && (
        <p className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
          Configurações salvas.
        </p>
      )}

      <div>
        <Label htmlFor="chave_pix">Chave PIX</Label>
        <Input id="chave_pix" name="chave_pix" defaultValue={chavePix} placeholder="seu@email.com" />
      </div>

      <div>
        <Label htmlFor="mensagem">Mensagem de cobrança</Label>
        <Textarea id="mensagem" name="mensagem" rows={6} required defaultValue={mensagem} />
        <p className="mt-2 text-[12px] text-text-muted">
          Variáveis disponíveis: <code>{"{nome}"}</code> <code>{"{valor}"}</code>{" "}
          <code>{"{dias}"}</code> <code>{"{chave_pix}"}</code>
        </p>
      </div>

      <Button type="submit" disabled={pendente} className="mt-2 w-full">
        {pendente ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
