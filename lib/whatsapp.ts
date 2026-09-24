export function linkWhatsApp(telefone: string, mensagem?: string): string {
  const numero = telefone.replace(/\D/g, "");
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : "";
  return `https://wa.me/${numero}${texto}`;
}

export function montarMensagemCobranca(
  template: string,
  dados: { nome: string; valor: string; dias: number; chavePix: string },
): string {
  return template
    .replaceAll("{nome}", dados.nome)
    .replaceAll("{valor}", dados.valor)
    .replaceAll("{dias}", String(dados.dias))
    .replaceAll("{chave_pix}", dados.chavePix || "(chave PIX não configurada)");
}
