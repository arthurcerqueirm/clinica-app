"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Select, Label } from "@/components/ui/input";
import { formatarCentavos } from "@/lib/dinheiro";
import { marcarOcorrenciaPagaAction } from "@/lib/actions/despesas";
import type { Enums } from "@/types/database";

type MetodoPagamento = Enums<"metodo_pagamento">;

const METODOS: { valor: MetodoPagamento; label: string }[] = [
  { valor: "pix", label: "PIX" },
  { valor: "dinheiro", label: "Dinheiro" },
  { valor: "cartao_debito", label: "Cartão de débito" },
  { valor: "cartao_credito", label: "Cartão de crédito" },
  { valor: "transferencia", label: "Transferência" },
  { valor: "outro", label: "Outro" },
];

export function MarcarOcorrenciaPagaSheet({
  ocorrenciaId,
  descricao,
  valorCentavos,
}: {
  ocorrenciaId: string;
  descricao: string;
  valorCentavos: number;
}) {
  const [aberto, setAberto] = useState(false);
  const [pendente, startTransition] = useTransition();

  function confirmar(formData: FormData) {
    const metodo = formData.get("metodo") as MetodoPagamento;
    startTransition(async () => {
      await marcarOcorrenciaPagaAction(ocorrenciaId, metodo);
      setAberto(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="pressable flex shrink-0 items-center gap-1.5 rounded-full bg-success/10 px-3.5 py-2 text-[13px] font-semibold text-success"
      >
        <Check size={14} />
        Paguei
      </button>

      <Sheet
        aberto={aberto}
        onOpenChange={setAberto}
        titulo="Marcar como paga"
        descricao={`${descricao} · ${formatarCentavos(valorCentavos)}`}
      >
        <form action={confirmar} className="flex flex-col gap-3">
          <div className="surgir" style={{ "--i": 1 } as React.CSSProperties}>
            <Label htmlFor="metodo">Método</Label>
            <Select id="metodo" name="metodo" required defaultValue="pix">
              {METODOS.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>

          <Button type="submit" disabled={pendente} className="mt-1 w-full">
            {pendente ? "Salvando..." : "Confirmar"}
          </Button>
        </form>
      </Sheet>
    </>
  );
}
