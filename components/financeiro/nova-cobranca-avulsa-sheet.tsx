"use client";

import { useState, useTransition } from "react";
import { Drawer } from "vaul";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
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
        className="flex items-center gap-1.5 text-[13px] font-medium text-primary"
      >
        <Plus size={15} />
        Nova cobrança
      </button>

      <Drawer.Root open={aberto} onOpenChange={setAberto}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-surface p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] outline-none">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
            <Drawer.Title className="text-[17px] font-semibold text-text">
              Nova cobrança
            </Drawer.Title>

            <form action={criar} className="mt-4 flex flex-col gap-3">
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input id="descricao" name="descricao" required autoFocus />
              </div>
              <div>
                <Label htmlFor="valor_reais">Valor *</Label>
                <Input
                  id="valor_reais"
                  name="valor_reais"
                  type="number"
                  min={0.01}
                  step="0.01"
                  required
                />
              </div>
              <div>
                <Label htmlFor="vencimento">Vencimento</Label>
                <Input id="vencimento" name="vencimento" type="date" />
              </div>

              {erro && <p className="text-[13px] text-danger">{erro}</p>}

              <Button type="submit" disabled={pendente} className="mt-1 w-full">
                {pendente ? "Criando..." : "Criar cobrança"}
              </Button>
            </form>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
