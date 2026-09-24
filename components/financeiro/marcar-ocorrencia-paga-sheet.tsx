"use client";

import { useState, useTransition } from "react";
import { Drawer } from "vaul";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-[13px] font-medium text-success"
      >
        <Check size={14} />
        Paguei
      </button>

      <Drawer.Root open={aberto} onOpenChange={setAberto}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-surface p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] outline-none">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
            <Drawer.Title className="text-[17px] font-semibold text-text">
              Marcar como paga
            </Drawer.Title>
            <Drawer.Description className="mt-1 text-[14px] text-text-muted">
              {descricao} · {formatarCentavos(valorCentavos)}
            </Drawer.Description>

            <form action={confirmar} className="mt-4 flex flex-col gap-3">
              <div>
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
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
