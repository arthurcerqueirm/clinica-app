"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus, Package } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

type Etapa = "cliente" | "servico" | "data" | "horario" | "confirmar";

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

  const [etapa, setEtapa] = useState<Etapa>(clientePreSelecionado ? "servico" : "cliente");
  const [cliente, setCliente] = useState<ClienteResumido | null>(clientePreSelecionado);
  const [creditos, setCreditos] = useState<Credito[]>([]);
  const [servico, setServico] = useState<Servico | null>(null);
  const [usarCredito, setUsarCredito] = useState(false);
  const [dataISO, setDataISO] = useState(dataInicial);
  const [horario, setHorario] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [carregandoSlots, setCarregandoSlots] = useState(false);
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

  useEffect(() => {
    if (etapa !== "horario" || !servico) return;
    buscarSlotsLivresAction(dataISO, servico.duracao_min)
      .then((novosSlots) => {
        setSlots(novosSlots);
        if (horarioSugeridoPendente && horarioSugerido) {
          setHorarioSugeridoPendente(false);
          if (novosSlots.includes(horarioSugerido)) {
            setHorario(horarioSugerido);
            setEtapa("confirmar");
          } else {
            setAvisoHorarioIndisponivel(horarioSugerido);
          }
        }
      })
      .finally(() => setCarregandoSlots(false));
  }, [etapa, servico, dataISO, horarioSugeridoPendente, horarioSugerido]);

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
    setEtapa("data");
  }

  function selecionarData(novaData: string) {
    setDataISO(novaData);
    setHorario(null);
    setCarregandoSlots(true);
    setAvisoHorarioIndisponivel(null);
    setEtapa("horario");
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

  return (
    <div className="flex flex-1 flex-col px-4 py-4">
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

      {etapa === "data" && (
        <EtapaData
          dataAtual={dataISO}
          onSelecionar={selecionarData}
          onVoltar={() => setEtapa("servico")}
        />
      )}

      {etapa === "horario" && (
        <EtapaHorario
          dataISO={dataISO}
          slots={slots}
          carregando={carregandoSlots}
          avisoIndisponivel={avisoHorarioIndisponivel}
          onSelecionar={selecionarHorario}
          onVoltar={() => setEtapa("data")}
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
          onVoltar={() => setEtapa("horario")}
        />
      )}
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
      <p className="text-[13px] font-semibold uppercase tracking-wide text-text-muted">
        1. Cliente
      </p>
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <Input
          autoFocus
          placeholder="Buscar cliente"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-1 flex-col divide-y divide-border overflow-y-auto">
        {resultados.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelecionar(c)}
            className="flex items-center gap-3 py-3 text-left active:bg-surface-alt"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-[13px] font-semibold text-primary">
              {c.nome.charAt(0).toUpperCase()}
            </div>
            <span className="text-[15px] text-text">{c.nome}</span>
          </button>
        ))}

        {resultados.length === 0 && busca.trim() && (
          <button
            type="button"
            disabled={criando}
            onClick={cadastrarRapido}
            className="flex items-center gap-3 py-3 text-left text-primary active:bg-surface-alt"
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
        {servicos.map((s) => {
          const credito = creditos.find((c) => c.servico_id === s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelecionar(s)}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left active:bg-surface-alt"
            >
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-text">{s.nome}</p>
                <p className="text-[13px] text-text-muted">{s.duracao_min} min</p>
                {credito && (
                  <p className="mt-0.5 flex items-center gap-1 text-[12px] font-medium text-primary">
                    <Package size={13} /> {credito.disponivel} do pacote disponíveis
                  </p>
                )}
              </div>
              <span className="shrink-0 text-[15px] font-semibold text-text">
                {formatarCentavos(s.preco_centavos)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EtapaData({
  dataAtual,
  onSelecionar,
  onVoltar,
}: {
  dataAtual: string;
  onSelecionar: (data: string) => void;
  onVoltar: () => void;
}) {
  const hoje = hojeISOemSaoPaulo();
  const amanha = new Date(`${hoje}T12:00:00`);
  amanha.setDate(amanha.getDate() + 1);
  const amanhaISO = amanha.toISOString().slice(0, 10);

  return (
    <div className="flex flex-1 flex-col gap-3">
      <CabecalhoEtapa titulo="3. Data" onVoltar={onVoltar} />
      <div className="flex gap-2">
        <Chip ativo={dataAtual === hoje} onClick={() => onSelecionar(hoje)}>
          Hoje
        </Chip>
        <Chip ativo={dataAtual === amanhaISO} onClick={() => onSelecionar(amanhaISO)}>
          Amanhã
        </Chip>
      </div>
      <div>
        <Label htmlFor="data-customizada">Ou escolha uma data</Label>
        <Input
          id="data-customizada"
          type="date"
          min={hoje}
          value={dataAtual}
          onChange={(event) => event.target.value && onSelecionar(event.target.value)}
        />
      </div>
    </div>
  );
}

function EtapaHorario({
  dataISO,
  slots,
  carregando,
  avisoIndisponivel,
  onSelecionar,
  onVoltar,
}: {
  dataISO: string;
  slots: string[];
  carregando: boolean;
  avisoIndisponivel?: string | null;
  onSelecionar: (horario: string) => void;
  onVoltar: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <CabecalhoEtapa
        titulo="4. Horário"
        subtitulo={formatarData(`${dataISO}T12:00:00`)}
        onVoltar={onVoltar}
      />
      {avisoIndisponivel && !carregando && (
        <p className="rounded-xl bg-warning/10 px-4 py-3 text-[13px] text-warning">
          ⚠️ Horário sugerido ({avisoIndisponivel}) não está mais disponível. Escolha outro:
        </p>
      )}
      {carregando ? (
        <p className="py-8 text-center text-sm text-text-muted">Calculando horários livres...</p>
      ) : slots.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">
          Nenhum horário livre nesse dia. Escolha outra data.
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {slots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => onSelecionar(slot)}
              className="rounded-xl border border-border bg-surface py-2.5 text-center text-[14px] font-medium text-text active:bg-primary active:text-bg"
            >
              {slot}
            </button>
          ))}
        </div>
      )}
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
      <CabecalhoEtapa titulo="5. Confirmar" onVoltar={onVoltar} />

      <Card className="flex flex-col gap-1.5">
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
        <label className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary-soft px-4 py-3">
          <input
            type="checkbox"
            checked={usarCredito}
            onChange={(event) => onToggleCredito(event.target.checked)}
            className="h-5 w-5 accent-primary"
          />
          <span className="text-[14px] text-text">
            Usar 1 crédito do pacote ({creditoDisponivel.disponivel} disponíveis)
          </span>
        </label>
      )}

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          rows={2}
          value={observacoes}
          onChange={(event) => onObservacoesChange(event.target.value)}
        />
      </div>

      {erro && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{erro}</p>}

      <Button disabled={enviando} onClick={onConfirmar} className="mt-1 w-full">
        {enviando ? "Confirmando..." : "Confirmar agendamento"}
      </Button>
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
  onVoltar: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-wide text-text-muted">
          {titulo}
        </p>
        {subtitulo && <p className="text-[13px] text-text-muted">{subtitulo}</p>}
      </div>
      <button type="button" onClick={onVoltar} className="text-[13px] font-medium text-primary">
        Voltar
      </button>
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
