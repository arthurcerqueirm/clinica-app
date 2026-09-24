"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { centavosParaReais } from "@/lib/dinheiro";
import type { EstadoFormularioServico } from "@/lib/actions/servicos";
import type { Tables } from "@/types/database";

type Servico = Tables<"servicos">;

export function ServicoForm({
  action,
  servico,
  textoBotao = "Salvar",
}: {
  action: (
    estadoAnterior: EstadoFormularioServico,
    formData: FormData,
  ) => Promise<EstadoFormularioServico>;
  servico?: Servico;
  textoBotao?: string;
}) {
  const [estado, formAction, pendente] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4 px-4 py-4">
      {estado.erro && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{estado.erro}</p>
      )}

      <div>
        <Label htmlFor="nome">Nome *</Label>
        <Input id="nome" name="nome" required defaultValue={servico?.nome} autoFocus />
        <CampoErro erros={estado.camposComErro?.nome} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="duracao_min">Duração (min) *</Label>
          <Input
            id="duracao_min"
            name="duracao_min"
            type="number"
            min={1}
            max={480}
            required
            defaultValue={servico?.duracao_min ?? 60}
          />
          <CampoErro erros={estado.camposComErro?.duracao_min} />
        </div>
        <div>
          <Label htmlFor="preco_reais">Preço (R$) *</Label>
          <Input
            id="preco_reais"
            name="preco_reais"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={servico ? centavosParaReais(servico.preco_centavos) : undefined}
          />
          <CampoErro erros={estado.camposComErro?.preco_reais} />
        </div>
      </div>

      <div>
        <Label htmlFor="cor">Cor na agenda</Label>
        <input
          id="cor"
          name="cor"
          type="color"
          defaultValue={servico?.cor ?? "#8B7CF6"}
          className="h-11 w-16 rounded-xl border border-border bg-surface"
        />
      </div>

      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" name="descricao" rows={2} defaultValue={servico?.descricao ?? ""} />
      </div>

      <Button type="submit" disabled={pendente} className="mt-2 w-full">
        {pendente ? "Salvando..." : textoBotao}
      </Button>
    </form>
  );
}

function CampoErro({ erros }: { erros?: string[] }) {
  if (!erros?.length) return null;
  return <p className="mt-1 text-[13px] text-danger">{erros[0]}</p>;
}
