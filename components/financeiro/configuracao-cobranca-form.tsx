"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { SecaoForm } from "@/components/ui/card";
import { Input, Textarea, Label, Aviso } from "@/components/ui/input";
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
    <form action={formAction} className="flex flex-col gap-4 px-4 py-3">
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      {estado.salvo && <Aviso tipo="sucesso">Configurações salvas.</Aviso>}

      <SecaoForm>
        <div>
          <Label htmlFor="chave_pix">Chave PIX</Label>
          <Input id="chave_pix" name="chave_pix" defaultValue={chavePix} placeholder="seu@email.com" />
        </div>

        <div>
          <Label htmlFor="mensagem">Mensagem de cobrança</Label>
          <Textarea id="mensagem" name="mensagem" rows={6} required defaultValue={mensagem} />
          <p className="mt-2 px-1 text-[12px] text-text-muted">
            Variáveis disponíveis: <code>{"{nome}"}</code> <code>{"{valor}"}</code>{" "}
            <code>{"{dias}"}</code> <code>{"{chave_pix}"}</code>
          </p>
        </div>
      </SecaoForm>

      <div className="surgir" style={{ "--i": 1 } as React.CSSProperties}>
        <Button type="submit" disabled={pendente} className="w-full">
          {pendente ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
