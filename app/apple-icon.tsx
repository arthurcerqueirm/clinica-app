import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS aplica o mascaramento arredondado por conta própria — o ícone-fonte
// deve ser um quadrado cheio, sem cantos já arredondados.
export default function AppleIcon() {
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
            fontSize: 96,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          C
        </span>
      </div>
    ),
    size,
  );
}
