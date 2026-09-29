"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Input, Label, Aviso } from "@/components/ui/input";
import { reaisParaCentavos } from "@/lib/dinheiro";
import { criarCobrancaAvulsaAction } from "@/lib/actions/pagamentos";

export function NovaCobrancaAvulsaSheet({ clienteId }: { clienteId: string }) {
  const [aberto, setAberto] = useState(false);
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function criar(formData: FormData) {
    setErro(null);
    const descricao = String(formData.get("descricao") ?? "");
    const valorReais = Number(formData.get("valor_reais"));
    const vencimento = String(formData.get("vencimento") ?? "");

    startTransition(async () => {
      try {
        await criarCobrancaAvulsaAction({
          clienteId,
          descricao,
          valorCentavos: reaisParaCentavos(valorReais),
          vencimento: vencimento || undefined,
        });
        setAberto(false);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível criar.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="pressable flex items-center gap-1.5 rounded-full bg-primary-soft px-3.5 py-2 text-[13px] font-semibold text-primary"
      >
        <Plus size={15} />
        Nova cobrança
      </button>

      <Sheet aberto={aberto} onOpenChange={setAberto} titulo="Nova cobrança">
        <form action={criar} className="flex flex-col gap-3">
          <div className="surgir" style={{ "--i": 1 } as React.CSSProperties}>
            <Label htmlFor="descricao">Descrição *</Label>
            <Input id="descricao" name="descricao" required autoFocus />
          </div>
          <div className="surgir" style={{ "--i": 2 } as React.CSSProperties}>
            <Label htmlFor="valor_reais">Valor *</Label>
            <Input
              id="valor_reais"
              name="valor_reais"
              type="number"
              inputMode="decimal"
              min={0.01}
              step="0.01"
              required
            />
          </div>
          <div className="surgir" style={{ "--i": 3 } as React.CSSProperties}>
            <Label htmlFor="vencimento">Vencimento</Label>
            <Input id="vencimento" name="vencimento" type="date" />
          </div>

          {erro && <Aviso>{erro}</Aviso>}

          <Button type="submit" disabled={pendente} className="mt-1 w-full">
            {pendente ? "Criando..." : "Criar cobrança"}
          </Button>
        </form>
      </Sheet>
    </>
  );
}
