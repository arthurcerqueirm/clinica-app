import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  // O Serwist injeta uma config de webpack mesmo com `disable: true` em dev.
  // Isso avisa ao Next que usar Turbopack em dev é intencional (build de
  // produção continua forçado em webpack via `npm run build`, que é quando
  // o Serwist realmente monta o service worker).
  turbopack: {},
  // Sem isso, o Next bloqueia os recursos internos de dev (HMR) quando o app
  // é acessado por outro dispositivo na rede (ex: celular via IP do Wi-Fi) —
  // a página carrega mas o JavaScript nunca termina de "ligar" no navegador.
  // Ajustar se o IP do Wi-Fi do computador mudar (`ipconfig` / Configurações → Wi-Fi).
  allowedDevOrigins: ["192.168.40.54", "192.168.*.*"],
};

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
