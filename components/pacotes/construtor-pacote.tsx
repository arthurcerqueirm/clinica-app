"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { Card } from "@/components/ui/card";
import { formatarCentavos, reaisParaCentavos } from "@/lib/dinheiro";
import { criarPacoteAction } from "@/lib/actions/pacotes";
import type { Tables, Enums } from "@/types/database";

type Cliente = Pick<Tables<"clientes">, "id" | "nome">;
type Servico = Tables<"servicos">;
type Modelo = Tables<"pacote_modelos">;

type ItemBuilder = {
  servicoId: string;
  nome: string;
  precoUnitario: number;
  quantidade: number;
};

export function ConstrutorPacote({
  clientes,
  servicos,
  modelos,
  clientePreSelecionado,
}: {
  clientes: Cliente[];
  servicos: Servico[];
  modelos: Modelo[];
  clientePreSelecionado?: Cliente | null;
}) {
  const router = useRouter();
  const [clienteId, setClienteId] = useState(clientePreSelecionado?.id ?? "");
  const [nome, setNome] = useState("");
  const [itens, setItens] = useState<ItemBuilder[]>([]);
  const [descontoTipo, setDescontoTipo] = useState<Enums<"tipo_desconto">>("percentual");
  const [descontoValor, setDescontoValor] = useState(0);
  const [validade, setValidade] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvarModelo, setSalvarModelo] = useState(false);
  const [nomeModelo, setNomeModelo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const servicosDisponiveis = servicos.filter((s) => !itens.some((i) => i.servicoId === s.id));

  const subtotal = itens.reduce((soma, i) => soma + i.precoUnitario * i.quantidade, 0);
  const descontoBruto =
    descontoTipo === "percentual"
      ? Math.round(subtotal * (descontoValor / 100))
      : reaisParaCentavos(descontoValor || 0);
  const descontoCentavos = Math.min(Math.max(descontoBruto, 0), subtotal);
  const total = subtotal - descontoCentavos;
  const percentualEconomia = subtotal > 0 ? (descontoCentavos / subtotal) * 100 : 0;

  function adicionarServico(servicoId: string) {
    const servico = servicos.find((s) => s.id === servicoId);
    if (!servico) return;
    setItens((atual) => [
      ...atual,
      {
        servicoId: servico.id,
        nome: servico.nome,
        precoUnitario: servico.preco_centavos,
        quantidade: 1,
      },
    ]);
  }

  function mudarQuantidade(servicoId: string, delta: number) {
    setItens((atual) =>
      atual.map((i) =>
        i.servicoId === servicoId ? { ...i, quantidade: Math.max(1, i.quantidade + delta) } : i,
      ),
    );
  }

  function removerItem(servicoId: string) {
    setItens((atual) => atual.filter((i) => i.servicoId !== servicoId));
  }

  function aplicarModelo(modeloId: string) {
    const modelo = modelos.find((m) => m.id === modeloId);
    if (!modelo) return;

    const itensModelo = modelo.itens as { servico_id: string; quantidade: number }[];
    const novosItens: ItemBuilder[] = [];
    for (const item of itensModelo) {
      const servico = servicos.find((s) => s.id === item.servico_id);
      if (servico) {
        novosItens.push({
          servicoId: servico.id,
          nome: servico.nome,
          precoUnitario: servico.preco_centavos,
          quantidade: item.quantidade,
        });
      }
    }

    setItens(novosItens);
    setDescontoTipo(modelo.desconto_tipo);
    setDescontoValor(Number(modelo.desconto_valor));
    setNome(modelo.nome);
  }

  async function confirmar() {
    setErro(null);
    if (!clienteId) {
      setErro("Escolha a cliente.");
      return;
    }
    if (itens.length === 0) {
      setErro("Adicione pelo menos um serviço.");
      return;
    }
    if (!nome.trim()) {
      setErro("Dê um nome para o pacote.");
      return;
    }

    setEnviando(true);
    try {
      await criarPacoteAction({
        clienteId,
        nome,
        itens: itens.map((i) => ({ servicoId: i.servicoId, quantidade: i.quantidade })),
        descontoTipo,
        descontoValor,
        validade: validade || undefined,
        observacoes,
        salvarComoModelo: salvarModelo ? nomeModelo : undefined,
      });
      router.push(`/clientes/${clienteId}`);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível criar o pacote.");
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {modelos.length > 0 && (
        <div>
          <Label>Usar modelo</Label>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {modelos.map((modelo) => (
              <Chip key={modelo.id} onClick={() => aplicarModelo(modelo.id)}>
                {modelo.nome}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {clientePreSelecionado ? (
        <div>
          <Label>Cliente</Label>
          <p className="text-[15px] font-medium text-text">{clientePreSelecionado.nome}</p>
        </div>
      ) : (
        <div>
          <Label htmlFor="cliente">Cliente *</Label>
          <Select id="cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Selecione...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="nome">Nome do pacote *</Label>
        <Input
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Pacote 10 sessões"
        />
      </div>

      <div>
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-text-muted">
          Itens
        </p>
        <div className="flex flex-col gap-2">
          {itens.map((item) => (
            <Card key={item.servicoId} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-text">{item.nome}</p>
                <p className="text-[12px] text-text-muted">
                  {formatarCentavos(item.precoUnitario)} cada
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => mudarQuantidade(item.servicoId, -1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-text-muted"
                >
                  <Minus size={14} />
                </button>
                <span className="w-5 text-center text-[14px] font-medium text-text">
                  {item.quantidade}
                </span>
                <button
                  type="button"
                  onClick={() => mudarQuantidade(item.servicoId, 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-text-muted"
                >
                  <Plus size={14} />
                </button>
              </div>
              <span className="w-20 shrink-0 text-right text-[14px] font-semibold text-text">
                {formatarCentavos(item.precoUnitario * item.quantidade)}
              </span>
              <button
                type="button"
                onClick={() => removerItem(item.servicoId)}
                aria-label="Remover"
                className="text-danger"
              >
                <X size={16} />
              </button>
            </Card>
          ))}

          {itens.length === 0 && (
            <p className="py-4 text-center text-[13px] text-text-muted">
              Nenhum serviço adicionado.
            </p>
          )}
        </div>

        {servicosDisponiveis.length > 0 && (
          <Select
            className="mt-2"
            value=""
            onChange={(e) => {
              if (e.target.value) adicionarServico(e.target.value);
            }}
          >
            <option value="">+ Adicionar serviço</option>
            {servicosDisponiveis.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} — {formatarCentavos(s.preco_centavos)}
              </option>
            ))}
          </Select>
        )}
      </div>

      <Card className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[14px]">
          <span className="text-text-muted">Subtotal</span>
          <span className="text-text">{formatarCentavos(subtotal)}</span>
        </div>

        <div className="flex items-center gap-2 py-1">
          <Chip ativo={descontoTipo === "percentual"} onClick={() => setDescontoTipo("percentual")}>
            %
          </Chip>
          <Chip ativo={descontoTipo === "valor"} onClick={() => setDescontoTipo("valor")}>
            R$
          </Chip>
          <Input
            type="number"
            min={0}
            step={descontoTipo === "percentual" ? 1 : 0.01}
            value={descontoValor || ""}
            onChange={(e) => setDescontoValor(Number(e.target.value))}
            className="flex-1"
          />
        </div>

        <div className="flex justify-between text-[14px]">
          <span className="text-text-muted">Desconto</span>
          <span className="text-danger">− {formatarCentavos(descontoCentavos)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-border pt-2 text-[16px] font-semibold">
          <span className="text-text">Total</span>
          <span className="text-text">{formatarCentavos(total)}</span>
        </div>
        {descontoCentavos > 0 && (
          <p className="text-[12px] text-success">
            Economia de {formatarCentavos(descontoCentavos)} ({percentualEconomia.toFixed(0)}%)
          </p>
        )}
      </Card>

      <div>
        <Label htmlFor="validade">Validade (opcional)</Label>
        <Input
          id="validade"
          type="date"
          value={validade}
          onChange={(e) => setValidade(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          rows={2}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <input
          type="checkbox"
          checked={salvarModelo}
          onChange={(e) => setSalvarModelo(e.target.checked)}
          className="h-5 w-5 accent-primary"
        />
        <span className="text-[14px] text-text">Salvar como modelo reutilizável</span>
      </label>
      {salvarModelo && (
        <Input
          placeholder="Nome do modelo"
          value={nomeModelo}
          onChange={(e) => setNomeModelo(e.target.value)}
        />
      )}

      {erro && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{erro}</p>}

      <Button disabled={enviando} onClick={confirmar} className="w-full">
        {enviando ? "Criando..." : "Criar pacote"}
      </Button>
    </div>
  );
}
