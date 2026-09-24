"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { salvarFaixaGradeAgendaAction } from "@/lib/actions/configuracoes";
import type { FaixaGradeAgenda } from "@/lib/data/configuracoes";

export function FaixaGradeAgendaForm({ faixa }: { faixa: FaixaGradeAgenda }) {
  const [estado, formAction, pendente] = useActionState(salvarFaixaGradeAgendaAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4 px-4 py-4">
      <p className="text-[13px] text-text-muted">
        Define quais horários aparecem nas visões Dia e Semana da agenda.
      </p>

      {estado.erro && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{estado.erro}</p>
      )}
      {estado.salvo && (
        <p className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
          Horário da grade salvo.
        </p>
      )}

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

      <Button type="submit" disabled={pendente} className="mt-2 w-full">
        {pendente ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
