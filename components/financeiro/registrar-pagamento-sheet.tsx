"use client";

import { useState, useTransition } from "react";
import { Drawer } from "vaul";
import { HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { formatarCentavos, reaisParaCentavos, centavosParaReais } from "@/lib/dinheiro";
import { registrarPagamentoAction } from "@/lib/actions/pagamentos";
import type { CobrancaComSaldo } from "@/lib/data/pagamentos";
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

export function RegistrarPagamentoSheet({ cobranca }: { cobranca: CobrancaComSaldo }) {
  const [aberto, setAberto] = useState(false);
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function registrar(formData: FormData) {
    setErro(null);
    const valorReais = Number(formData.get("valor_reais"));
    const metodo = String(formData.get("metodo"));

    startTransition(async () => {
      try {
        await registrarPagamentoAction({
          cobrancaId: cobranca.id,
          valorCentavos: reaisParaCentavos(valorReais),
          metodo: metodo as MetodoPagamento,
        });
        setAberto(false);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível registrar.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-[13px] font-medium text-primary"
      >
        <HandCoins size={14} />
        Registrar
      </button>

      <Drawer.Root open={aberto} onOpenChange={setAberto}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-surface p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] outline-none">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
            <Drawer.Title className="text-[17px] font-semibold text-text">
              Registrar pagamento
            </Drawer.Title>
            <Drawer.Description className="mt-1 text-[14px] text-text-muted">
              {cobranca.descricao}
            </Drawer.Description>

            <form action={registrar} className="mt-4 flex flex-col gap-3">
              <div>
                <Label htmlFor="valor_reais">Valor</Label>
                <Input
                  id="valor_reais"
                  name="valor_reais"
                  type="number"
                  step="0.01"
                  min={0.01}
                  required
                  defaultValue={centavosParaReais(cobranca.restanteCentavos)}
                />
                <p className="mt-1 text-[12px] text-text-muted">
                  Em aberto: {formatarCentavos(cobranca.restanteCentavos)}
                </p>
              </div>

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

              {erro && <p className="text-[13px] text-danger">{erro}</p>}

              <Button type="submit" disabled={pendente} className="mt-1 w-full">
                {pendente ? "Registrando..." : "Confirmar pagamento"}
              </Button>
            </form>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
