import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Morphix 3D — Unified AI 3D Engine for Mechanical CAD, Architecture & Creative 3D";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#F4F1E6",
          color: "#141413",
          padding: "56px 64px",
          border: "12px solid #141413",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "2px solid #141413",
            paddingBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                backgroundColor: "#141413",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  backgroundColor: "#FF6A1A",
                }}
              />
            </div>
            <span style={{ fontSize: "34px", fontWeight: 800, letterSpacing: "-0.02em" }}>
              Morphix 3D
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                padding: "4px 10px",
                backgroundColor: "#EFECE0",
                border: "1.5px solid #141413",
              }}
            >
              3DMORPHIX.COM
            </span>
          </div>
          <div
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "#FF6A1A",
              letterSpacing: "0.06em",
            }}
          >
            200 FREE STUDIO CREDITS
          </div>
        </div>

        {/* Center Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", margin: "24px 0" }}>
          <div
            style={{
              fontSize: "68px",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "#141413",
            }}
          >
            Type it / See it — Just Morphix it.
          </div>
          <div style={{ fontSize: "24px", color: "#575652", maxWidth: "960px", lineHeight: 1.4 }}>
            One unified drafting table for precision Mechanical B-Rep CAD, Architectural Floor-to-3D BIM, and 4K PBR Rigged Meshes.
          </div>
        </div>

        {/* Bottom 3 Engine Cards */}
        <div style={{ display: "flex", gap: "20px", width: "100%" }}>
          <div
            style={{
              flex: 1,
              backgroundColor: "#FAF8F2",
              border: "2px solid #141413",
              padding: "18px 22px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#FF6A1A" }}>
              01 // MECHANICAL CAD
            </span>
            <span style={{ fontSize: "20px", fontWeight: 800 }}>STEP · STL · DXF · GLB</span>
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: "#FAF8F2",
              border: "2px solid #141413",
              padding: "18px 22px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#2F5BFF" }}>
              02 // ARCHITECTURE BIM
            </span>
            <span style={{ fontSize: "20px", fontWeight: 800 }}>2D Floor Plan → 3D Cutaway</span>
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: "#FAF8F2",
              border: "2px solid #141413",
              padding: "18px 22px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#6D4AFF" }}>
              03 // CREATIVE 3D ATELIER
            </span>
            <span style={{ fontSize: "20px", fontWeight: 800 }}>4K PBR Mesh + 65-Bone Rig</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
