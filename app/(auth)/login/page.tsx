"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/cn";
import { EASE_OUT_IOS, toque } from "@/lib/motion";
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
      <div className="pop mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-bg shadow-(--shadow-lg)">
        C
      </div>
      <h1
        className="surgir mb-1 text-2xl font-bold tracking-tight text-text"
        style={{ "--i": 1 } as React.CSSProperties}
      >
        Clínica
      </h1>
      <p
        className="surgir mb-10 text-sm text-text-muted"
        style={{ "--i": 2 } as React.CSSProperties}
      >
        Digite o PIN para entrar
      </p>

      <motion.div
        animate={erro ? { x: [0, -10, 10, -8, 8, -4, 0] } : {}}
        transition={{ duration: 0.45 }}
        className="mb-6 flex gap-3.5"
      >
        {Array.from({ length: TAMANHO_PIN }).map((_, indice) => {
          const preenchido = indice < pin.length;
          return (
            <motion.div
              key={indice}
              animate={{ scale: preenchido ? [1, 1.35, 1] : 1 }}
              transition={{ duration: 0.3, ease: EASE_OUT_IOS }}
              className={cn(
                "h-3.5 w-3.5 rounded-full border-2 transition-colors",
                erro
                  ? "border-danger bg-danger/20"
                  : preenchido
                    ? "border-primary bg-primary"
                    : "border-border bg-transparent",
              )}
            />
          );
        })}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.p
          key={erro ? "erro" : entrando ? "entrando" : "vazio"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className={cn("mb-6 h-5 text-sm", erro ? "text-danger" : "text-text-muted")}
        >
          {erro ? "PIN incorreto" : entrando ? "Entrando..." : ""}
        </motion.p>
      </AnimatePresence>

      <div className="grid w-full max-w-70 grid-cols-3 gap-4">
        {TECLAS.map((digito, indice) => (
          <TeclaPin
            key={digito}
            indice={indice + 3}
            disabled={entrando}
            onClick={() => digitar(digito)}
          >
            {digito}
          </TeclaPin>
        ))}
        <div />
        <TeclaPin indice={13} disabled={entrando} onClick={() => digitar("0")}>
          0
        </TeclaPin>
        <TeclaPin
          indice={14}
          disabled={entrando || pin.length === 0}
          onClick={apagar}
          aria-label="Apagar"
          className="bg-transparent"
        >
          <Delete size={22} />
        </TeclaPin>
      </div>
    </div>
  );
}

function TeclaPin({
  className,
  indice,
  style,
  ...props
}: HTMLMotionProps<"button"> & { indice: number }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      transition={toque}
      style={{ ...style, "--i": indice } as HTMLMotionProps<"button">["style"]}
      className={cn(
        "no-select pop flex h-17 w-17 items-center justify-center justify-self-center rounded-full bg-surface text-2xl font-semibold text-text shadow-(--shadow-sm) active:bg-surface-alt disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}
