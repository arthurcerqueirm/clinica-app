"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import type { EstadoFormularioCliente } from "@/lib/actions/clientes";
import type { Tables } from "@/types/database";

type Cliente = Tables<"clientes">;

export function ClienteForm({
  action,
  cliente,
  textoBotao = "Salvar",
}: {
  action: (
    estadoAnterior: EstadoFormularioCliente,
    formData: FormData,
  ) => Promise<EstadoFormularioCliente>;
  cliente?: Cliente;
  textoBotao?: string;
}) {
  const [estado, formAction, pendente] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-6 px-4 py-4">
      {estado.erro && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{estado.erro}</p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-text-muted">
          Dados básicos
        </h2>
        <div>
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" name="nome" required defaultValue={cliente?.nome} autoFocus />
          <CampoErro erros={estado.camposComErro?.nome} />
        </div>
        <div>
          <Label htmlFor="telefone">WhatsApp</Label>
          <Input
            id="telefone"
            name="telefone"
            type="tel"
            placeholder="+5511987654321"
            defaultValue={cliente?.telefone ?? ""}
          />
          <CampoErro erros={estado.camposComErro?.telefone} />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" defaultValue={cliente?.email ?? ""} />
        </div>
        <div>
          <Label htmlFor="data_nascimento">Data de nascimento</Label>
          <Input
            id="data_nascimento"
            name="data_nascimento"
            type="date"
            defaultValue={cliente?.data_nascimento ?? ""}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning/5 p-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-warning">
          Saúde — importante para o atendimento
        </h2>
        <div>
          <Label htmlFor="restricoes_saude">Restrições de saúde</Label>
          <Textarea
            id="restricoes_saude"
            name="restricoes_saude"
            rows={2}
            placeholder="Hérnia de disco, gestação, hipertensão..."
            defaultValue={cliente?.restricoes_saude ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="alergias">Alergias</Label>
          <Textarea
            id="alergias"
            name="alergias"
            rows={2}
            placeholder="Óleos essenciais, látex..."
            defaultValue={cliente?.alergias ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="preferencias">Preferências</Label>
          <Textarea
            id="preferencias"
            name="preferencias"
            rows={2}
            placeholder="Pressão forte, sem música..."
            defaultValue={cliente?.preferencias ?? ""}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-text-muted">
          Outros
        </h2>
        <div>
          <Label htmlFor="como_conheceu">Como conheceu</Label>
          <Input
            id="como_conheceu"
            name="como_conheceu"
            defaultValue={cliente?.como_conheceu ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            name="observacoes"
            rows={3}
            defaultValue={cliente?.observacoes ?? ""}
          />
        </div>
      </section>

      <Button type="submit" disabled={pendente} className="w-full">
        {pendente ? "Salvando..." : textoBotao}
      </Button>
    </form>
  );
}

function CampoErro({ erros }: { erros?: string[] }) {
  if (!erros?.length) return null;
  return <p className="mt-1 text-[13px] text-danger">{erros[0]}</p>;
}
