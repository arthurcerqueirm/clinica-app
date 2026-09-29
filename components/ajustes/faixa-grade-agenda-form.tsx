"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { SecaoForm } from "@/components/ui/card";
import { Input, Label, Aviso } from "@/components/ui/input";
import { salvarFaixaGradeAgendaAction } from "@/lib/actions/configuracoes";
import type { FaixaGradeAgenda } from "@/lib/data/configuracoes";

export function FaixaGradeAgendaForm({ faixa }: { faixa: FaixaGradeAgenda }) {
  const [estado, formAction, pendente] = useActionState(salvarFaixaGradeAgendaAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4 px-4 py-3">
      <p className="surgir px-1 text-[13px] text-text-muted">
        Define quais horários aparecem nas visões Dia e Semana da agenda.
      </p>

      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      {estado.salvo && <Aviso tipo="sucesso">Horário da grade salvo.</Aviso>}

      <SecaoForm indice={1}>
        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="inicio">Começa</Label>
            <Input id="inicio" name="inicio" type="time" required defaultValue={faixa.inicio} />
          </div>
          <div className="flex-1">
            <Label htmlFor="fim">Termina</Label>
            <Input id="fim" name="fim" type="time" required defaultValue={faixa.fim} />
          </div>
        </div>
      </SecaoForm>

      <div className="surgir" style={{ "--i": 2 } as React.CSSProperties}>
        <Button type="submit" disabled={pendente} className="w-full">
          {pendente ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
