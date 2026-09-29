"use client";

import { useState, useTransition } from "react";
import { HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Input, Select, Label, Aviso } from "@/components/ui/input";
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
        className="pressable flex shrink-0 items-center gap-1.5 rounded-full bg-primary-soft px-3.5 py-2 text-[13px] font-semibold text-primary"
      >
        <HandCoins size={14} />
        Registrar
      </button>

      <Sheet
        aberto={aberto}
        onOpenChange={setAberto}
        titulo="Registrar pagamento"
        descricao={cobranca.descricao}
      >
        <form action={registrar} className="flex flex-col gap-3">
          <div className="surgir" style={{ "--i": 1 } as React.CSSProperties}>
            <Label htmlFor="valor_reais">Valor</Label>
            <Input
              id="valor_reais"
              name="valor_reais"
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0.01}
              required
              defaultValue={centavosParaReais(cobranca.restanteCentavos)}
            />
            <p className="mt-1 px-1 text-[12px] text-text-muted">
              Em aberto: {formatarCentavos(cobranca.restanteCentavos)}
            </p>
          </div>

          <div className="surgir" style={{ "--i": 2 } as React.CSSProperties}>
            <Label htmlFor="metodo">Método</Label>
            <Select id="metodo" name="metodo" required defaultValue="pix">
              {METODOS.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>

          {erro && <Aviso>{erro}</Aviso>}

          <Button type="submit" disabled={pendente} className="mt-1 w-full">
            {pendente ? "Registrando..." : "Confirmar pagamento"}
          </Button>
        </form>
      </Sheet>
    </>
  );
}
