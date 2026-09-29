"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { SecaoForm } from "@/components/ui/card";
import { Segmentado } from "@/components/ui/segmentado";
import { Input, Select, Label, Aviso, CampoErro } from "@/components/ui/input";
import { criarDespesaAction } from "@/lib/actions/despesas";
import { suave } from "@/lib/motion";
import type { Tables } from "@/types/database";

type Categoria = Tables<"categorias_despesa">;

const TIPOS = [
  { valor: "ocasional", label: "Ocasional" },
  { valor: "fixa", label: "Fixa (recorrente)" },
] as const;

export function DespesaForm({ categorias }: { categorias: Categoria[] }) {
  const [estado, formAction, pendente] = useActionState(criarDespesaAction, {});
  const [tipo, setTipo] = useState<"fixa" | "ocasional">("ocasional");

  return (
    <form action={formAction} className="flex flex-col gap-4 px-4 py-3">
      {estado.erro && <Aviso>{estado.erro}</Aviso>}

      <Segmentado id="tipo-despesa" opcoes={TIPOS} valor={tipo} onChange={setTipo} className="surgir" />
      <input type="hidden" name="tipo" value={tipo} />

      <SecaoForm indice={1}>
        <div>
          <Label htmlFor="descricao">Descrição *</Label>
          <Input id="descricao" name="descricao" required autoFocus placeholder="Aluguel, óleo..." />
          <CampoErro erros={estado.camposComErro?.descricao} />
        </div>

        <div>
          <Label htmlFor="valor_reais">Valor (R$) *</Label>
          <Input
            id="valor_reais"
            name="valor_reais"
            type="number"
            inputMode="decimal"
            min={0.01}
            step="0.01"
            required
          />
          <CampoErro erros={estado.camposComErro?.valor_reais} />
        </div>

        <div>
          <Label htmlFor="categoria_id">Categoria</Label>
          <Select id="categoria_id" name="categoria_id" defaultValue="">
            <option value="">Sem categoria</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </Select>
        </div>
      </SecaoForm>

      <SecaoForm indice={2} className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tipo}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={suave}
            className="flex flex-col gap-3"
          >
            {tipo === "fixa" ? (
              <>
                <div>
                  <Label htmlFor="dia_vencimento">Dia do vencimento *</Label>
                  <Input
                    id="dia_vencimento"
                    name="dia_vencimento"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={31}
                    required
                    defaultValue={10}
                  />
                  <CampoErro erros={estado.camposComErro?.dia_vencimento} />
                </div>
                <div>
                  <Label htmlFor="recorrencia">Recorrência</Label>
                  <Select id="recorrencia" name="recorrencia" defaultValue="mensal">
                    <option value="mensal">Mensal</option>
                    <option value="bimestral">Bimestral</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="anual">Anual</option>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="data_despesa">Data *</Label>
                  <Input
                    id="data_despesa"
                    name="data_despesa"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().slice(0, 10)}
                  />
                  <CampoErro erros={estado.camposComErro?.data_despesa} />
                </div>
                <div>
                  <Label htmlFor="metodo">Método de pagamento *</Label>
                  <Select id="metodo" name="metodo" required defaultValue="pix">
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao_debito">Cartão de débito</option>
                    <option value="cartao_credito">Cartão de crédito</option>
                    <option value="transferencia">Transferência</option>
                    <option value="outro">Outro</option>
                  </Select>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </SecaoForm>

      <div className="surgir" style={{ "--i": 3 } as React.CSSProperties}>
        <Button type="submit" disabled={pendente} className="w-full">
          {pendente ? "Salvando..." : "Cadastrar despesa"}
        </Button>
      </div>
    </form>
  );
}
