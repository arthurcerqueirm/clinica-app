"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type HTMLMotionProps } from "motion/react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/cn";
import { TAMANHO_PIN } from "@/lib/auth/constantes";
import { entrarComPinAction } from "@/lib/actions/auth";

const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState(false);
  const [entrando, setEntrando] = useState(false);

  const tentarEntrar = useCallback(
    async (pinCompleto: string) => {
      setEntrando(true);
      const { ok } = await entrarComPinAction(pinCompleto);

      if (!ok) {
        setErro(true);
        setPin("");
        setEntrando(false);
        return;
      }

      router.push("/agenda");
      router.refresh();
    },
    [router],
  );

  function digitar(digito: string) {
    if (entrando || pin.length >= TAMANHO_PIN) return;
    setErro(false);
    const novoPin = pin + digito;
    setPin(novoPin);
    if (novoPin.length === TAMANHO_PIN) {
      tentarEntrar(novoPin);
    }
  }

  function apagar() {
    if (entrando) return;
    setErro(false);
    setPin((atual) => atual.slice(0, -1));
  }

  return (
    <div className="safe-top flex min-h-dvh flex-col items-center justify-center bg-bg px-6">
      <h1 className="mb-1 text-2xl font-semibold text-text">Clínica</h1>
      <p className="mb-10 text-sm text-text-muted">Digite o PIN para entrar</p>

      <motion.div
        animate={erro ? { x: [0, -8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="mb-6 flex gap-3"
      >
        {Array.from({ length: TAMANHO_PIN }).map((_, indice) => (
          <div
            key={indice}
            className={cn(
              "h-3.5 w-3.5 rounded-full border-2 transition-colors",
              erro
                ? "border-danger"
                : indice < pin.length
                  ? "border-primary bg-primary"
                  : "border-border bg-transparent",
            )}
          />
        ))}
      </motion.div>

      <p className="mb-6 h-5 text-sm text-danger">{erro ? "PIN incorreto" : ""}</p>

      <div className="grid w-full max-w-70 grid-cols-3 gap-4">
        {TECLAS.map((digito) => (
          <TeclaPin key={digito} disabled={entrando} onClick={() => digitar(digito)}>
            {digito}
          </TeclaPin>
        ))}
        <div />
        <TeclaPin disabled={entrando} onClick={() => digitar("0")}>
          0
        </TeclaPin>
        <TeclaPin disabled={entrando || pin.length === 0} onClick={apagar} aria-label="Apagar">
          <Delete size={22} />
        </TeclaPin>
      </div>
    </div>
  );
}

function TeclaPin({ className, ...props }: HTMLMotionProps<"button">) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "no-select flex h-16 w-16 items-center justify-center justify-self-center rounded-full bg-surface-alt text-xl font-medium text-text disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}
