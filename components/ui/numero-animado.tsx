"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";
import { formatarCentavos } from "@/lib/dinheiro";
import { EASE_OUT_IOS } from "@/lib/motion";

export function CentavosAnimados({ valor, className }: { valor: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const anterior = useRef(0);
  const reduzir = useReducedMotion();

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;
    if (reduzir) {
      elemento.textContent = formatarCentavos(valor);
      anterior.current = valor;
      return;
    }
    const controle = animate(anterior.current, valor, {
      duration: 0.9,
      ease: EASE_OUT_IOS,
      onUpdate: (atual) => {
        elemento.textContent = formatarCentavos(Math.round(atual));
      },
    });
    anterior.current = valor;
    return () => controle.stop();
  }, [valor, reduzir]);

  return (
    <span ref={ref} className={className}>
      {formatarCentavos(valor)}
    </span>
  );
}
