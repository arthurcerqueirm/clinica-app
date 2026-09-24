import { ImageResponse } from "next/og";

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
          borderRadius: 40,
        }}
      >
        <span
          style={{
            color: "#FAF8F5",
            fontSize: 104,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          C
        </span>
      </div>
    ),
    { width: 192, height: 192 },
  );
}
