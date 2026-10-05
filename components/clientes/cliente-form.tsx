"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { SecaoForm } from "@/components/ui/card";
import { Input, Textarea, Label, Aviso, CampoErro } from "@/components/ui/input";
import type { EstadoFormularioCliente } from "@/lib/actions/clientes";
import type { Tables } from "@/types/database";

type Cliente = Tables<"clientes">;

export function ClienteForm({
  action,
  cliente,
  textoBotao = "Salvar",
}: {
  action: (
    estadoAnterior: EstadoFormularioCliente,
    formData: FormData,
  ) => Promise<EstadoFormularioCliente>;
  cliente?: Cliente;
  textoBotao?: string;
}) {
  const [estado, formAction, pendente] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4 px-4 py-3">
      {estado.erro && <Aviso>{estado.erro}</Aviso>}

      <SecaoForm titulo="Dados básicos">
        <div>
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" name="nome" required defaultValue={cliente?.nome} autoFocus />
          <CampoErro erros={estado.camposComErro?.nome} />
        </div>
        <div>
          <Label htmlFor="telefone">WhatsApp</Label>
          <Input
            id="telefone"
            name="telefone"
            type="tel"
            inputMode="tel"
            placeholder="+5511987654321"
            defaultValue={cliente?.telefone ?? ""}
          />
          <CampoErro erros={estado.camposComErro?.telefone} />
        </div>
      </SecaoForm>

      <SecaoForm indice={1}>
        <div>
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            name="observacoes"
            rows={3}
            defaultValue={cliente?.observacoes ?? ""}
          />
        </div>
      </SecaoForm>

      <div className="surgir" style={{ "--i": 2 } as React.CSSProperties}>
        <Button type="submit" disabled={pendente} className="w-full">
          {pendente ? "Salvando..." : textoBotao}
        </Button>
      </div>
    </form>
  );
}
