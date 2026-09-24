import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Clínica — Gestão",
    short_name: "Clínica",
    description: "Agenda, clientes e financeiro da clínica",
    start_url: "/agenda?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf8f5",
    theme_color: "#7c6a9e",
    lang: "pt-BR",
    dir: "ltr",
    categories: ["business", "productivity", "health"],
    icons: [
      { src: "/icons/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Novo agendamento",
        url: "/agenda/novo",
      },
      {
        name: "Quem está devendo",
        url: "/financeiro/inadimplentes",
      },
    ],
  };
}
