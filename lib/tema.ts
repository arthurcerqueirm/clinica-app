const CHAVE_TEMA = "clinica-tema";

export type Tema = "sistema" | "claro" | "escuro";

export const CORES_TEMA = { claro: "#faf8f5", escuro: "#17151a" } as const;

export function lerTemaSalvo(): Tema {
  try {
    const valor = localStorage.getItem(CHAVE_TEMA);
    if (valor === "claro" || valor === "escuro") return valor;
  } catch {
    // localStorage indisponível (modo privado etc.) — cai no padrão "sistema".
  }
  return "sistema";
}

export function salvarTema(tema: Tema) {
  try {
    if (tema === "sistema") localStorage.removeItem(CHAVE_TEMA);
    else localStorage.setItem(CHAVE_TEMA, tema);
  } catch {
    // idem — sem persistência, só não lembra na próxima visita.
  }
}

export function aplicarTema(tema: Tema) {
  const root = document.documentElement;
  if (tema === "sistema") delete root.dataset.theme;
  else root.dataset.theme = tema === "escuro" ? "dark" : "light";
  atualizarCorStatusBar(tema);
}

export function atualizarCorStatusBar(tema: Tema) {
  const escuro =
    tema === "escuro" ||
    (tema === "sistema" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", escuro ? CORES_TEMA.escuro : CORES_TEMA.claro);
}

// Injetado cru em app/layout.tsx (script síncrono, antes do primeiro paint) —
// não pode importar módulo, senão o navegador desenha o tema errado por um
// instante. Mantido aqui só pra ficar perto da lógica que ele duplica.
export const SCRIPT_TEMA_INICIAL = `(function(){try{
var t=localStorage.getItem('${CHAVE_TEMA}');
var tema=(t==='claro'||t==='escuro')?t:'sistema';
if(tema!=='sistema')document.documentElement.dataset.theme=tema==='escuro'?'dark':'light';
var escuro=tema==='escuro'||(tema==='sistema'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
var m=document.querySelector('meta[name="theme-color"]');
if(m)m.setAttribute('content',escuro?'${CORES_TEMA.escuro}':'${CORES_TEMA.claro}');
}catch(e){}})();`;
