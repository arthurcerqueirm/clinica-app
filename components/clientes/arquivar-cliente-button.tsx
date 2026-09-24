"use client";

import { useState, useTransition } from "react";
import { Drawer } from "vaul";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { arquivarClienteAction } from "@/lib/actions/clientes";

export function ArquivarClienteButton({ clienteId }: { clienteId: string }) {
  const [aberto, setAberto] = useState(false);
  const [pendente, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="no-select flex items-center gap-2 text-[14px] font-medium text-danger"
      >
        <Archive size={16} />
        Arquivar cliente
      </button>

      <Drawer.Root open={aberto} onOpenChange={setAberto}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-surface p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] outline-none">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
            <Drawer.Title className="text-[17px] font-semibold text-text">
              Arquivar cliente?
            </Drawer.Title>
            <Drawer.Description className="mt-1 text-[14px] text-text-muted">
              A cliente some das listas, mas todo o histórico financeiro e de atendimentos fica
              guardado. Dá para restaurar depois.
            </Drawer.Description>
            <div className="mt-5 flex flex-col gap-2">
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
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
