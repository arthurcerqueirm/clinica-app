"use client";

import { useState, useTransition } from "react";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { arquivarClienteAction } from "@/lib/actions/clientes";

export function ArquivarClienteButton({ clienteId }: { clienteId: string }) {
  const [aberto, setAberto] = useState(false);
  const [pendente, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="no-select pressable flex w-full items-center justify-center gap-2 rounded-full bg-danger/10 py-3 text-[14px] font-semibold text-danger"
      >
        <Archive size={16} />
        Arquivar cliente
      </button>

      <Sheet
        aberto={aberto}
        onOpenChange={setAberto}
        titulo="Arquivar cliente?"
        descricao="A cliente some das listas, mas todo o histórico financeiro e de atendimentos fica guardado. Dá para restaurar depois."
      >
        <div className="flex flex-col gap-2">
          <Button
            variante="danger"
            disabled={pendente}
            onClick={() =>
              startTransition(async () => {
                await arquivarClienteAction(clienteId);
                setAberto(false);
              })
            }
          >
            {pendente ? "Arquivando..." : "Arquivar"}
          </Button>
          <Button variante="secondary" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
        </div>
      </Sheet>
    </>
  );
}
