/// <reference lib="webworker" />
// Fica de fora do type-check principal (ver tsconfig.json `exclude`) porque
// mistura globais de "webworker" com os globais de "dom" do resto do app.

import { defaultCache } from "@serwist/next/worker";
import { NetworkFirst, Serwist } from "serwist";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Leitura offline da agenda (PLANO.md §8, Fase 4): tenta a rede primeiro,
// cai pro último cache se offline/lenta. Escrita ainda exige rede — sincronização
// completa (fila offline) é polimento de Fase 6.
const cacheAgendaOffline: RuntimeCaching = {
  matcher: ({ url, request }) =>
    request.method === "GET" && url.pathname.startsWith("/agenda"),
  handler: new NetworkFirst({
    cacheName: "agenda-offline",
    networkTimeoutSeconds: 4,
  }),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [cacheAgendaOffline, ...defaultCache],
});

serwist.addEventListeners();

// ── Web Push — PLANO.md §8.4 ────────────────────────────────────────────
self.addEventListener("push", (event) => {
  const dados = event.data?.json() ?? {};

  event.waitUntil(
    self.registration.showNotification(dados.titulo ?? "Clínica", {
      body: dados.corpo,
      icon: "/icons/icon-192",
      badge: "/icons/icon-192",
      tag: dados.tag,
      renotify: false,
      data: { url: dados.url ?? "/" },
      vibrate: [80, 40, 80],
    } as NotificationOptions),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino: string = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((lista) => {
        for (const cliente of lista) {
          if ("focus" in cliente) {
            (cliente as WindowClient).navigate(destino);
            return cliente.focus();
          }
        }
        return self.clients.openWindow(destino);
      }),
  );
});
