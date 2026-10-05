"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Search, UserPlus, Package, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Input, Textarea, Label, Aviso } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { mola, suave } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { formatarCentavos } from "@/lib/dinheiro";
import { formatarData, hojeISOemSaoPaulo } from "@/lib/datas";
import { normalizarTexto } from "@/lib/texto";
import { criarAgendamento, buscarSlotsLivresAction } from "@/lib/actions/agendamentos";
import { criarClienteRapidoAction } from "@/lib/actions/clientes";
import { buscarCreditosClienteAction } from "@/lib/actions/pacotes";
import type { Tables } from "@/types/database";

type ClienteResumido = Pick<Tables<"clientes">, "id" | "nome" | "telefone">;
type Servico = Tables<"servicos">;
type Credito = Tables<"vw_creditos_pacote">;

const ETAPAS = ["cliente", "servico", "quando", "confirmar"] as const;
type Etapa = (typeof ETAPAS)[number];

export function NovoAgendamentoWizard({
  clientes,
  servicos,
  clientePreSelecionado,
  horarioSugerido,
  dataInicial,
}: {
  clientes: ClienteResumido[];
  servicos: Servico[];
  clientePreSelecionado: ClienteResumido | null;
  horarioSugerido?: string;
  dataInicial: string;
}) {
  const router = useRouter();

  const [etapa, setEtapaBruta] = useState<Etapa>(clientePreSelecionado ? "servico" : "cliente");
  const [direcao, setDirecao] = useState(1);

  function setEtapa(nova: Etapa) {
    setDirecao(ETAPAS.indexOf(nova) >= ETAPAS.indexOf(etapa) ? 1 : -1);
    setEtapaBruta(nova);
  }
  const [cliente, setCliente] = useState<ClienteResumido | null>(clientePreSelecionado);
  const [creditos, setCreditos] = useState<Credito[]>([]);
  const [servico, setServico] = useState<Servico | null>(null);
  const [usarCredito, setUsarCredito] = useState(false);
  const [dataISO, setDataISO] = useState(dataInicial);
  const [horario, setHorario] = useState<string | null>(null);
  // Cache por dia+duração: trocar de dia e voltar não refaz a busca.
  const [cacheSlots, setCacheSlots] = useState<Record<string, string[]>>({});
  const [horarioSugeridoPendente, setHorarioSugeridoPendente] = useState(Boolean(horarioSugerido));
  const [avisoHorarioIndisponivel, setAvisoHorarioIndisponivel] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (clientePreSelecionado) {
      buscarCreditosClienteAction(clientePreSelecionado.id).then(setCreditos);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chaveSlots = servico ? `${dataISO}|${servico.duracao_min}` : null;
  const slots = chaveSlots ? cacheSlots[chaveSlots] : undefined;

  useEffect(() => {
    if (etapa !== "quando" || !servico || !chaveSlots || cacheSlots[chaveSlots]) return;
    buscarSlotsLivresAction(dataISO, servico.duracao_min).then((novosSlots) => {
      setCacheSlots((atual) => ({ ...atual, [chaveSlots]: novosSlots }));
      if (horarioSugeridoPendente && horarioSugerido) {
        setHorarioSugeridoPendente(false);
        if (novosSlots.includes(horarioSugerido)) {
          setHorario(horarioSugerido);
          setDirecao(1);
          setEtapaBruta("confirmar");
        } else {
          setAvisoHorarioIndisponivel(horarioSugerido);
        }
      }
    });
  }, [etapa, servico, dataISO, chaveSlots, cacheSlots, horarioSugeridoPendente, horarioSugerido]);

  const creditoDoServico = useMemo(
    () => creditos.find((c) => c.servico_id === servico?.id),
    [creditos, servico],
  );

  async function selecionarCliente(selecionado: ClienteResumido) {
    setCliente(selecionado);
    setEtapa("servico");
    const lista = await buscarCreditosClienteAction(selecionado.id);
    setCreditos(lista);
  }

  function selecionarServico(selecionado: Servico) {
    setServico(selecionado);
    const credito = creditos.find((c) => c.servico_id === selecionado.id);
    setUsarCredito(Boolean(credito));
    setEtapa("quando");
  }

  function selecionarData(novaData: string) {
    setDataISO(novaData);
    setHorario(null);
    setAvisoHorarioIndisponivel(null);
  }

  function selecionarHorario(novoHorario: string) {
    setHorario(novoHorario);
    setEtapa("confirmar");
  }

  async function confirmar() {
    if (!cliente || !servico || !horario) return;
    setEnviando(true);
    setErro(null);

    try {
      const inicioISO = `${dataISO}T${horario}:00`;
      await criarAgendamento({
        clienteId: cliente.id,
        servicoId: servico.id,
        inicioISO,
        pacoteItemId: usarCredito ? (creditoDoServico?.pacote_item_id ?? null) : null,
        observacoes,
      });
      router.push(`/agenda?data=${dataISO}`);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível criar o agendamento.");
      setEnviando(false);
    }
  }

  const passo = ETAPAS.indexOf(etapa);

  return (
    <div className="flex flex-1 flex-col px-4 pt-1 pb-4">
      <div className="surgir mb-4 flex gap-1.5" aria-hidden>
        {ETAPAS.map((e, i) => (
          <div key={e} className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-alt">
            <motion.div
              className="h-full origin-left rounded-full bg-primary"
              initial={false}
              animate={{ scaleX: i <= passo ? 1 : 0 }}
              transition={mola}
            />
          </div>
        ))}
      </div>

      <div className="relative flex flex-1 flex-col">
        <AnimatePresence mode="popLayout" initial={false} custom={direcao}>
          <motion.div
            key={etapa}
            custom={direcao}
            variants={{
              entra: (d: number) => ({ opacity: 0, x: 40 * d }),
              centro: { opacity: 1, x: 0 },
              sai: (d: number) => ({ opacity: 0, x: -40 * d }),
            }}
            initial="entra"
            animate="centro"
            exit="sai"
            transition={suave}
            className="flex flex-1 flex-col"
          >
      {etapa === "cliente" && (
        <EtapaCliente clientes={clientes} onSelecionar={selecionarCliente} />
      )}

      {etapa === "servico" && cliente && (
        <EtapaServico
          nomeCliente={cliente.nome}
          servicos={servicos}
          creditos={creditos}
          onSelecionar={selecionarServico}
          onVoltar={() => setEtapa("cliente")}
        />
      )}

      {etapa === "quando" && (
        <EtapaQuando
          dataISO={dataISO}
          slots={slots}
          horarioSelecionado={horario}
          avisoIndisponivel={avisoHorarioIndisponivel}
          onSelecionarData={selecionarData}
          onSelecionarHorario={selecionarHorario}
          onVoltar={() => setEtapa("servico")}
        />
      )}

      {etapa === "confirmar" && cliente && servico && horario && (
        <EtapaConfirmar
          cliente={cliente}
          servico={servico}
          dataISO={dataISO}
          horario={horario}
          usarCredito={usarCredito}
          creditoDisponivel={creditoDoServico}
          observacoes={observacoes}
          onObservacoesChange={setObservacoes}
          onToggleCredito={setUsarCredito}
          erro={erro}
          enviando={enviando}
          onConfirmar={confirmar}
          onVoltar={() => setEtapa("quando")}
        />
      )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function EtapaCliente({
  clientes,
  onSelecionar,
}: {
  clientes: ClienteResumido[];
  onSelecionar: (cliente: ClienteResumido) => void;
}) {
  const [busca, setBusca] = useState("");
  const [criando, setCriando] = useState(false);

  const resultados = useMemo(() => {
    const buscaNormalizada = normalizarTexto(busca);
    if (!buscaNormalizada) return clientes.slice(0, 30);
    return clientes.filter((c) => normalizarTexto(c.nome).includes(buscaNormalizada));
  }, [clientes, busca]);

  async function cadastrarRapido() {
    setCriando(true);
    try {
      const novo = await criarClienteRapidoAction(busca);
      onSelecionar(novo);
    } finally {
      setCriando(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <CabecalhoEtapa titulo="1. Cliente" />
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <Input
          autoFocus
          type="search"
          placeholder="Buscar cliente"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          className="rounded-full pl-11"
        />
      </div>

      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-(--shadow-sm)">
        {resultados.map((c, indice) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelecionar(c)}
            style={{ "--i": indice } as React.CSSProperties}
            className="surgir flex items-center gap-3 px-4 py-3 text-left active:bg-surface-alt"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[14px] font-semibold text-primary">
              {c.nome.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 truncate text-[15px] font-medium text-text">{c.nome}</span>
            <ChevronRight size={17} className="text-text-muted/60" />
          </button>
        ))}

        {resultados.length === 0 && !busca.trim() && (
          <p className="px-4 py-6 text-center text-[13px] text-text-muted">
            Nenhuma cliente cadastrada ainda.
          </p>
        )}

        {resultados.length === 0 && busca.trim() && (
          <button
            type="button"
            disabled={criando}
            onClick={cadastrarRapido}
            className="surgir flex items-center gap-3 px-4 py-3 text-left text-primary active:bg-surface-alt"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
              <UserPlus size={17} />
            </div>
            <span className="text-[15px] font-medium">
              {criando ? "Cadastrando..." : `Cadastrar "${busca.trim()}"`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function EtapaServico({
  nomeCliente,
  servicos,
  creditos,
  onSelecionar,
  onVoltar,
}: {
  nomeCliente: string;
  servicos: Servico[];
  creditos: Credito[];
  onSelecionar: (servico: Servico) => void;
  onVoltar: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <CabecalhoEtapa titulo="2. Serviço" subtitulo={nomeCliente} onVoltar={onVoltar} />
      <div className="flex flex-col gap-2">
        {servicos.map((s, indice) => {
          const credito = creditos.find((c) => c.servico_id === s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelecionar(s)}
              style={{ "--i": indice } as React.CSSProperties}
              className="surgir pressable flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 text-left shadow-(--shadow-sm) active:bg-surface-alt"
            >
              <span
                className="h-10 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.cor }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-text">{s.nome}</p>
                <p className="text-[13px] text-text-muted">{s.duracao_min} min</p>
                {credito && (
                  <p className="mt-0.5 flex items-center gap-1 text-[12px] font-medium text-primary">
                    <Package size={13} /> {credito.disponivel} do pacote disponíveis
                  </p>
                )}
              </div>
              <span className="shrink-0 text-[15px] font-bold text-text">
                {formatarCentavos(s.preco_centavos)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DIAS_NA_FAIXA = 60;
const PERIODOS = [
  { label: "Manhã", ate: "12:00" },
  { label: "Tarde", ate: "18:00" },
  { label: "Noite", ate: "24:00" },
];

// Aritmética de datas de calendário (yyyy-MM-dd) em UTC ao meio-dia, para não
// depender do fuso do aparelho.
function somarDias(dataISO: string, dias: number): string {
  const data = new Date(`${dataISO}T12:00:00Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

function diasEntre(deISO: string, ateISO: string): number {
  return Math.round(
    (Date.parse(`${ateISO}T12:00:00Z`) - Date.parse(`${deISO}T12:00:00Z`)) / 86_400_000,
  );
}

function EtapaQuando({
  dataISO,
  slots,
  horarioSelecionado,
  avisoIndisponivel,
  onSelecionarData,
  onSelecionarHorario,
  onVoltar,
}: {
  dataISO: string;
  slots: string[] | undefined;
  horarioSelecionado: string | null;
  avisoIndisponivel?: string | null;
  onSelecionarData: (data: string) => void;
  onSelecionarHorario: (horario: string) => void;
  onVoltar: () => void;
}) {
  const hoje = hojeISOemSaoPaulo();
  const inicioFaixa = dataISO < hoje ? dataISO : hoje;
  const totalDias = Math.max(DIAS_NA_FAIXA, diasEntre(inicioFaixa, dataISO) + 14);

  const dias = useMemo(
    () => Array.from({ length: totalDias }, (_, i) => somarDias(inicioFaixa, i)),
    [inicioFaixa, totalDias],
  );

  const diaSelecionadoRef = useRef<HTMLButtonElement>(null);
  const primeiraRolagem = useRef(true);
  useEffect(() => {
    diaSelecionadoRef.current?.scrollIntoView({
      behavior: primeiraRolagem.current ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
    primeiraRolagem.current = false;
  }, [dataISO]);

  const periodos = useMemo(() => {
    if (!slots) return [];
    let de = "00:00";
    return PERIODOS.map((periodo) => {
      const doPeriodo = slots.filter((slot) => slot >= de && slot < periodo.ate);
      de = periodo.ate;
      return { label: periodo.label, slots: doPeriodo };
    }).filter((periodo) => periodo.slots.length > 0);
  }, [slots]);

  return (
    <div className="flex flex-1 flex-col gap-3">
      <CabecalhoEtapa
        titulo="3. Quando"
        subtitulo={formatarData(`${dataISO}T12:00:00`, "EEEE, dd 'de' MMMM")}
        onVoltar={onVoltar}
      />

      <div className="surgir -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
        <label className="pressable relative flex h-17 w-13 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-surface text-text-muted">
          <CalendarDays size={18} />
          <span className="text-[10px] font-semibold">Outra</span>
          <input
            type="date"
            aria-label="Escolher outra data"
            min={hoje}
            value={dataISO}
            onClick={(event) => {
              try {
                event.currentTarget.showPicker();
              } catch {
                // Navegador sem showPicker: o toque no input já abre o seletor nativo.
              }
            }}
            onChange={(event) => event.target.value && onSelecionarData(event.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>

        {dias.map((dia) => {
          const ativo = dia === dataISO;
          const data = new Date(`${dia}T12:00:00Z`);
          return (
            <button
              key={dia}
              ref={ativo ? diaSelecionadoRef : undefined}
              type="button"
              onClick={() => onSelecionarData(dia)}
              className={cn(
                "pressable relative flex h-17 w-13 shrink-0 flex-col items-center justify-center rounded-2xl border",
                ativo ? "border-primary text-bg" : "border-border bg-surface text-text",
              )}
            >
              {ativo && (
                <motion.span
                  layoutId="dia-wizard"
                  transition={mola}
                  className="absolute -inset-px rounded-2xl bg-primary"
                />
              )}
              <span className={cn("relative text-[11px] font-semibold", !ativo && "text-text-muted")}>
                {dia === hoje ? "Hoje" : DIAS_SEMANA[data.getUTCDay()]}
              </span>
              <span className="relative text-[19px] leading-tight font-bold">
                {data.getUTCDate()}
              </span>
              <span className={cn("relative text-[10px]", !ativo && "text-text-muted")}>
                {MESES[data.getUTCMonth()]}
              </span>
            </button>
          );
        })}
      </div>

      {avisoIndisponivel && slots && (
        <Aviso tipo="alerta">
          Horário sugerido ({avisoIndisponivel}) não está mais disponível. Escolha outro:
        </Aviso>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={slots ? dataISO : "carregando"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col gap-4"
        >
          {!slots ? (
            <div className="grid grid-cols-4 gap-2 pt-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-11 rounded-full" />
              ))}
            </div>
          ) : periodos.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-center text-sm text-text-muted">Nenhum horário livre nesse dia.</p>
              <button
                type="button"
                onClick={() => onSelecionarData(somarDias(dataISO, 1))}
                className="pressable flex items-center gap-0.5 rounded-full bg-primary-soft py-2 pr-3 pl-4 text-[13px] font-semibold text-primary"
              >
                Ver próximo dia
                <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            periodos.map((periodo) => (
              <div key={periodo.label} className="flex flex-col gap-2">
                <p className="px-1 text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                  {periodo.label}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {periodo.slots.map((slot, indice) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => onSelecionarHorario(slot)}
                      style={{ "--i": indice } as React.CSSProperties}
                      className={cn(
                        "pop pressable h-11 rounded-full border text-center text-[14px] font-semibold shadow-(--shadow-sm) active:border-primary active:bg-primary active:text-bg",
                        slot === horarioSelecionado
                          ? "border-primary bg-primary text-bg"
                          : "border-border bg-surface text-text",
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function EtapaConfirmar({
  cliente,
  servico,
  dataISO,
  horario,
  usarCredito,
  creditoDisponivel,
  observacoes,
  onObservacoesChange,
  onToggleCredito,
  erro,
  enviando,
  onConfirmar,
  onVoltar,
}: {
  cliente: ClienteResumido;
  servico: Servico;
  dataISO: string;
  horario: string;
  usarCredito: boolean;
  creditoDisponivel?: Credito;
  observacoes: string;
  onObservacoesChange: (valor: string) => void;
  onToggleCredito: (valor: boolean) => void;
  erro: string | null;
  enviando: boolean;
  onConfirmar: () => void;
  onVoltar: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <CabecalhoEtapa titulo="4. Confirmar" onVoltar={onVoltar} />

      <Card className="flex flex-col gap-2.5">
        <Linha label="Cliente" valor={cliente.nome} />
        <Linha label="Serviço" valor={servico.nome} />
        <Linha label="Data" valor={formatarData(`${dataISO}T12:00:00`)} />
        <Linha label="Horário" valor={horario} />
        <Linha
          label="Valor"
          valor={usarCredito ? "Incluso no pacote" : formatarCentavos(servico.preco_centavos)}
        />
      </Card>

      {creditoDisponivel && (
        <div
          className="surgir flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary-soft px-4 py-3"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <span className="text-[14px] font-medium text-text">
            Usar 1 crédito do pacote ({creditoDisponivel.disponivel} disponíveis)
          </span>
          <Switch ativo={usarCredito} onChange={onToggleCredito} label="Usar crédito do pacote" />
        </div>
      )}

      <div className="surgir" style={{ "--i": 2 } as React.CSSProperties}>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          rows={2}
          value={observacoes}
          onChange={(event) => onObservacoesChange(event.target.value)}
        />
      </div>

      {erro && <Aviso>{erro}</Aviso>}

      <div className="surgir mt-1" style={{ "--i": 3 } as React.CSSProperties}>
        <Button disabled={enviando} onClick={onConfirmar} className="w-full">
          {enviando ? "Confirmando..." : "Confirmar agendamento"}
        </Button>
      </div>
    </div>
  );
}

function CabecalhoEtapa({
  titulo,
  subtitulo,
  onVoltar,
}: {
  titulo: string;
  subtitulo?: string;
  onVoltar?: () => void;
}) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-text-muted">
          {titulo}
        </p>
        {subtitulo && <p className="truncate text-[14px] font-medium text-text">{subtitulo}</p>}
      </div>
      {onVoltar && (
        <button
          type="button"
          onClick={onVoltar}
          className="pressable flex shrink-0 items-center gap-0.5 rounded-full bg-primary-soft py-1.5 pr-3 pl-2 text-[13px] font-semibold text-primary"
        >
          <ChevronLeft size={16} />
          Voltar
        </button>
      )}
    </div>
  );
}

function Linha({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between text-[14px]">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text">{valor}</span>
    </div>
  );
}
