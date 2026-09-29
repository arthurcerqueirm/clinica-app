"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { SecaoForm } from "@/components/ui/card";
import { Input, Textarea, Label, Aviso, CampoErro } from "@/components/ui/input";
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
    <form action={formAction} className="flex flex-col gap-4 px-4 py-3">
      {estado.erro && <Aviso>{estado.erro}</Aviso>}

      <SecaoForm>
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
              inputMode="numeric"
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
              inputMode="decimal"
              min={0}
              step="0.01"
              required
              defaultValue={servico ? centavosParaReais(servico.preco_centavos) : undefined}
            />
            <CampoErro erros={estado.camposComErro?.preco_reais} />
          </div>
        </div>
      </SecaoForm>

      <SecaoForm indice={1}>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="cor" className="mb-0">
            Cor na agenda
          </Label>
          <input
            id="cor"
            name="cor"
            type="color"
            defaultValue={servico?.cor ?? "#8B7CF6"}
            className="h-11 w-11 cursor-pointer appearance-none overflow-hidden rounded-full border-2 border-border bg-transparent p-0 [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
          />
        </div>

        <div>
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea id="descricao" name="descricao" rows={2} defaultValue={servico?.descricao ?? ""} />
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
