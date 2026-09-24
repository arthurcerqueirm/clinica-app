// Dinheiro sempre em centavos (inteiro). Nunca float — ver PLANO.md §5.1.

const formatador = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatarCentavos(centavos: number): string {
  return formatador.format(centavos / 100);
}

export function reaisParaCentavos(reais: number): number {
  return Math.round(reais * 100);
}

export function centavosParaReais(centavos: number): number {
  return centavos / 100;
}

export function aplicarDescontoPercentual(centavos: number, percentual: number): number {
  return Math.round(centavos * (1 - percentual / 100));
}

/**
 * Rateia um desconto total entre itens proporcionalmente ao valor de cada um
 * (PLANO.md §6.4, regra 1) e corrige a sobra do arredondamento no último item,
 * para a soma bater exatamente com `descontoTotalCentavos`.
 */
export function ratearDesconto(
  itens: { valorCentavos: number }[],
  descontoTotalCentavos: number,
): number[] {
  const totalCentavos = itens.reduce((soma, item) => soma + item.valorCentavos, 0);
  if (totalCentavos === 0) return itens.map(() => 0);

  const descontosRateados = itens.map((item) =>
    Math.round((item.valorCentavos / totalCentavos) * descontoTotalCentavos),
  );

  const somaRateada = descontosRateados.reduce((soma, valor) => soma + valor, 0);
  const diferenca = descontoTotalCentavos - somaRateada;
  if (diferenca !== 0 && descontosRateados.length > 0) {
    descontosRateados[descontosRateados.length - 1] += diferenca;
  }

  return descontosRateados;
}
