import type { Transition } from "motion/react";

export const EASE_OUT_IOS = [0.16, 1, 0.3, 1] as const;

export const mola: Transition = { type: "spring", stiffness: 520, damping: 38, mass: 0.8 };

export const suave: Transition = { duration: 0.32, ease: EASE_OUT_IOS };

export const toque: Transition = { duration: 0.15, ease: EASE_OUT_IOS };
