"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea, Aviso } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { SecaoForm } from "@/components/ui/card";
import { Segmentado } from "@/components/ui/segmentado";
import { Switch } from "@/components/ui/switch";
import { CentavosAnimados } from "@/components/ui/numero-animado";
import { cn } from "@/lib/cn";
import { formatarCentavos, reaisParaCentavos, centavosParaReais } from "@/lib/dinheiro";
import { mola, suave } from "@/lib/motion";
import { criarPacoteAction } from "@/lib/actions/pacotes";
import type { Tables, Enums } from "@/types/database";

type Cliente = Pick<Tables<"clientes">, "id" | "nome">;
type Servico = Tables<"servicos">;
type Modelo = Tables<"pacote_modelos">;

const TIPOS_DESCONTO = [
  { valor: "percentual", label: "%" },
  { valor: "valor", label: "R$" },
] as const;

// Padrão da clínica: cada sessão do pacote sai R$ 20 mais barata que a avulsa.
const DESCONTO_PADRAO_POR_SESSAO_CENTAVOS = 2000;

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
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [descontoPersonalizado, setDescontoPersonalizado] = useState(false);
  const [descontoTipo, setDescontoTipo] = useState<Enums<"tipo_desconto">>("valor");
  const [descontoValor, setDescontoValor] = useState(0);
  const [validade, setValidade] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvarModelo, setSalvarModelo] = useState(false);
  const [nomeModelo, setNomeModelo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const itens = servicos
    .filter((s) => (quantidades[s.id] ?? 0) > 0)
    .map((s) => ({ servico: s, quantidade: quantidades[s.id] }));

  const totalSessoes = itens.reduce((soma, i) => soma + i.quantidade, 0);
  const subtotal = itens.reduce((soma, i) => soma + i.servico.preco_centavos * i.quantidade, 0);
  const descontoPadrao = itens.reduce(
    (soma, i) =>
      soma + Math.min(DESCONTO_PADRAO_POR_SESSAO_CENTAVOS, i.servico.preco_centavos) * i.quantidade,
    0,
  );
  const descontoBruto = !descontoPersonalizado
    ? descontoPadrao
    : descontoTipo === "percentual"
      ? Math.round(subtotal * (descontoValor / 100))
      : reaisParaCentavos(descontoValor || 0);
  const descontoCentavos = Math.min(Math.max(descontoBruto, 0), subtotal);
  const total = subtotal - descontoCentavos;
  const percentualEconomia = subtotal > 0 ? (descontoCentavos / subtotal) * 100 : 0;

  function mudarQuantidade(servicoId: string, delta: number) {
    setQuantidades((atual) => ({
      ...atual,
      [servicoId]: Math.max(0, (atual[servicoId] ?? 0) + delta),
    }));
  }

  function personalizarDesconto() {
    setDescontoTipo("valor");
    setDescontoValor(centavosParaReais(descontoPadrao));
    setDescontoPersonalizado(true);
  }

  function aplicarModelo(modeloId: string) {
    const modelo = modelos.find((m) => m.id === modeloId);
    if (!modelo) return;

    const itensModelo = modelo.itens as { servico_id: string; quantidade: number }[];
    setQuantidades(
      Object.fromEntries(itensModelo.map((item) => [item.servico_id, item.quantidade])),
    );
    setDescontoTipo(modelo.desconto_tipo);
    setDescontoValor(Number(modelo.desconto_valor));
    setDescontoPersonalizado(true);
  }

  async function confirmar() {
    setErro(null);
    if (!clienteId) {
      setErro("Escolha a cliente.");
      return;
    }
    if (itens.length === 0) {
      setErro("Adicione pelo menos uma massagem.");
      return;
    }

    setEnviando(true);
    try {
      await criarPacoteAction({
        clienteId,
        itens: itens.map((i) => ({ servicoId: i.servico.id, quantidade: i.quantidade })),
        descontoTipo: descontoPersonalizado ? descontoTipo : "valor",
        descontoValor: descontoPersonalizado ? descontoValor : centavosParaReais(descontoPadrao),
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
    <div className="flex flex-col gap-4 px-4 py-3">
      {modelos.length > 0 && (
        <div className="surgir">
          <Label>Usar modelo</Label>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
            {modelos.map((modelo) => (
              <Chip key={modelo.id} onClick={() => aplicarModelo(modelo.id)}>
                {modelo.nome}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <SecaoForm indice={1}>
        {clientePreSelecionado ? (
          <div>
            <Label>Cliente</Label>
            <p className="px-1 text-[15px] font-semibold text-text">{clientePreSelecionado.nome}</p>
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
      </SecaoForm>

      <SecaoForm titulo="Massagens" indice={2}>
        <div className="flex flex-col gap-2">
          {servicos.map((servico) => {
            const quantidade = quantidades[servico.id] ?? 0;
            const selecionado = quantidade > 0;
            return (
              <div
                key={servico.id}
                role={selecionado ? undefined : "button"}
                tabIndex={selecionado ? undefined : 0}
                onClick={selecionado ? undefined : () => mudarQuantidade(servico.id, 1)}
                onKeyDown={
                  selecionado
                    ? undefined
                    : (e) => {
                        if (e.key === "Enter" || e.key === " ") mudarQuantidade(servico.id, 1);
                      }
                }
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition-colors",
                  selecionado
                    ? "border-primary/40 bg-primary-soft"
                    : "pressable cursor-pointer border-border bg-surface-alt",
                )}
              >
                <span
                  className="h-9 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: servico.cor }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-text">{servico.nome}</p>
                  <p className="text-[12px] text-text-muted">
                    {selecionado
                      ? `${quantidade} × ${formatarCentavos(servico.preco_centavos)} = ${formatarCentavos(servico.preco_centavos * quantidade)}`
                      : `${formatarCentavos(servico.preco_centavos)} avulsa`}
                  </p>
                </div>

                {selecionado ? (
                  <div className="flex items-center gap-1.5">
                    <BotaoQuantidade
                      aria-label={`Diminuir ${servico.nome}`}
                      onClick={() => mudarQuantidade(servico.id, -1)}
                    >
                      <Minus size={14} />
                    </BotaoQuantidade>
                    <span className="relative flex w-6 justify-center overflow-hidden text-[15px] font-bold text-text">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={quantidade}
                          initial={{ y: -12, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: 12, opacity: 0 }}
                          transition={mola}
                        >
                          {quantidade}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                    <BotaoQuantidade
                      aria-label={`Aumentar ${servico.nome}`}
                      onClick={() => mudarQuantidade(servico.id, 1)}
                    >
                      <Plus size={14} />
                    </BotaoQuantidade>
                  </div>
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Plus size={16} />
                  </span>
                )}
              </div>
            );
          })}

          {servicos.length === 0 && (
            <p className="py-4 text-center text-[13px] text-text-muted">
              Nenhuma massagem cadastrada em Ajustes → Serviços.
            </p>
          )}
        </div>
      </SecaoForm>

      <SecaoForm titulo="Valores" indice={3}>
        <div className="flex justify-between px-1 text-[14px]">
          <span className="text-text-muted">
            Subtotal{totalSessoes > 0 && ` · ${totalSessoes} ${totalSessoes === 1 ? "sessão" : "sessões"}`}
          </span>
          <CentavosAnimados valor={subtotal} className="text-text" />
        </div>

        <div className="flex items-start justify-between gap-3 px-1 text-[14px]">
          <div className="flex flex-col">
            <span className="text-text-muted">Desconto</span>
            <button
              type="button"
              onClick={
                descontoPersonalizado ? () => setDescontoPersonalizado(false) : personalizarDesconto
              }
              className="self-start text-[12px] font-semibold text-primary"
            >
              {descontoPersonalizado ? "Voltar ao padrão (R$ 20/sessão)" : "R$ 20 por sessão · Alterar"}
            </button>
          </div>
          <span className="text-danger">
            − <CentavosAnimados valor={descontoCentavos} />
          </span>
        </div>

        <AnimatePresence initial={false}>
          {descontoPersonalizado && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={suave}
              className="-m-1 overflow-hidden p-1"
            >
              <div className="flex items-center gap-2">
                <Segmentado
                  id="tipo-desconto"
                  opcoes={TIPOS_DESCONTO}
                  valor={descontoTipo}
                  onChange={setDescontoTipo}
                  className="w-28 shrink-0"
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={descontoTipo === "percentual" ? 1 : 0.01}
                  value={descontoValor || ""}
                  onChange={(e) => setDescontoValor(Number(e.target.value))}
                  placeholder="Desconto"
                  className="flex-1"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between border-t border-border px-1 pt-3 text-[18px] font-bold">
          <span className="text-text">Total</span>
          <CentavosAnimados valor={total} className="text-text" />
        </div>
        <AnimatePresence>
          {descontoCentavos > 0 && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={suave}
              className="overflow-hidden rounded-full bg-success/10 px-3 py-1 text-center text-[12px] font-semibold text-success"
            >
              Economia de {formatarCentavos(descontoCentavos)} ({percentualEconomia.toFixed(0)}%)
            </motion.p>
          )}
        </AnimatePresence>
      </SecaoForm>

      <SecaoForm indice={4}>
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

        <div className="flex items-center justify-between gap-3 px-1">
          <span className="text-[14px] font-medium text-text">Salvar como modelo reutilizável</span>
          <Switch ativo={salvarModelo} onChange={setSalvarModelo} label="Salvar como modelo" />
        </div>
        <AnimatePresence initial={false}>
          {salvarModelo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={suave}
              className="-m-1 overflow-hidden p-1"
            >
              <Input
                placeholder="Nome do modelo"
                value={nomeModelo}
                onChange={(e) => setNomeModelo(e.target.value)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </SecaoForm>

      {erro && <Aviso>{erro}</Aviso>}

      <div className="surgir" style={{ "--i": 5 } as React.CSSProperties}>
        <Button disabled={enviando} onClick={confirmar} className="w-full">
          {enviando ? "Criando..." : "Criar pacote"}
        </Button>
      </div>
    </div>
  );
}

function BotaoQuantidade(props: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className="pressable flex h-8 w-8 items-center justify-center rounded-full bg-surface text-text-muted shadow-(--shadow-sm)"
      {...props}
    />
  );
}
