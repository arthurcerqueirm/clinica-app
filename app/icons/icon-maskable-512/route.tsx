import { ImageResponse } from "next/og";

// Maskable: fundo precisa cobrir o quadrado inteiro (sem cantos arredondados,
// sem transparência) e o conteúdo tem que caber na "zona segura" central —
// o sistema operacional recorta o resto em formatos variados (círculo, squircle...).
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#7C6A9E",
        }}
      >
        <span
          style={{
            color: "#FAF8F5",
            fontSize: 200,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          C
        </span>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
