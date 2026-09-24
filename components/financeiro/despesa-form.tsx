"use client";

import { useActionState, useState } from "react";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { criarDespesaAction } from "@/lib/actions/despesas";
import type { Tables } from "@/types/database";

type Categoria = Tables<"categorias_despesa">;

export function DespesaForm({ categorias }: { categorias: Categoria[] }) {
  const [estado, formAction, pendente] = useActionState(criarDespesaAction, {});
  const [tipo, setTipo] = useState<"fixa" | "ocasional">("ocasional");

  return (
    <form action={formAction} className="flex flex-col gap-4 px-4 py-4">
      {estado.erro && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{estado.erro}</p>
      )}

      <div className="flex gap-2">
        <Chip ativo={tipo === "ocasional"} onClick={() => setTipo("ocasional")}>
          Ocasional
        </Chip>
        <Chip ativo={tipo === "fixa"} onClick={() => setTipo("fixa")}>
          Fixa (recorrente)
        </Chip>
      </div>
      <input type="hidden" name="tipo" value={tipo} />

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

      {tipo === "fixa" ? (
        <>
          <div>
            <Label htmlFor="dia_vencimento">Dia do vencimento *</Label>
            <Input
              id="dia_vencimento"
              name="dia_vencimento"
              type="number"
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

      <Button type="submit" disabled={pendente} className="mt-2 w-full">
        {pendente ? "Salvando..." : "Cadastrar despesa"}
      </Button>
    </form>
  );
}

function CampoErro({ erros }: { erros?: string[] }) {
  if (!erros?.length) return null;
  return <p className="mt-1 text-[13px] text-danger">{erros[0]}</p>;
}
