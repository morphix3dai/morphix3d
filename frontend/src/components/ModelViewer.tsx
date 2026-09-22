"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  Environment,
  Stats,
  GizmoHelper,
  GizmoViewport,
  Center,
  useGLTF,
} from "@react-three/drei";
import { Suspense, useRef, useState, useCallback } from "react";
import {
  RotateCcw,
  Box,
  Grid3x3,
  Sun,
  Maximize2,
  Eye,
  Info,
  Play,
  Pause,
} from "lucide-react";
import * as THREE from "three";

// Placeholder spinning cube when no model is loaded
function PlaceholderModel({ wireframe }: { wireframe: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.2;
    }
  });

  return (
    <Center>
      <mesh ref={meshRef}>
        <dodecahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color="#6366f1"
          wireframe={wireframe}
          roughness={0.3}
          metalness={0.7}
          emissive="#4338ca"
          emissiveIntensity={0.1}
        />
      </mesh>
    </Center>
  );
}

// Loaded GLB model
function LoadedModel({
  url,
  wireframe,
  onStats,
}: {
  url: string;
  wireframe: boolean;
  onStats: (stats: { faces: number; vertices: number }) => void;
}) {
  const { scene } = useGLTF(url);
  const clonedScene = scene.clone();

  // Count faces and vertices
  let totalFaces = 0;
  let totalVertices = 0;
  clonedScene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const geometry = child.geometry;
      totalFaces += geometry.index
        ? geometry.index.count / 3
        : geometry.attributes.position.count / 3;
      totalVertices += geometry.attributes.position.count;

      if (wireframe) {
        child.material = new THREE.MeshStandardMaterial({
          wireframe: true,
          color: "#6366f1",
        });
      }
    }
  });

  // Report stats
  onStats({ faces: Math.round(totalFaces), vertices: totalVertices });

  return (
    <Center>
      <primitive object={clonedScene} />
    </Center>
  );
}

interface ModelViewerProps {
  modelUrl?: string;
  className?: string;
}

export default function ModelViewer({ modelUrl, className = "" }: ModelViewerProps) {
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [modelStats, setModelStats] = useState({ faces: 0, vertices: 0 });

  const handleStats = useCallback(
    (stats: { faces: number; vertices: number }) => {
      setModelStats(stats);
    },
    []
  );

  return (
    <div className={`relative rounded-xl overflow-hidden bg-[#0a0a12] border border-[rgba(148,163,184,0.08)] ${className}`}>
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [3, 2, 3], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        className="!bg-transparent"
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
          <pointLight position={[-5, 3, -5]} intensity={0.3} color="#8b5cf6" />
          <Environment preset="city" background={false} />

          {/* Model */}
          {modelUrl ? (
            <LoadedModel url={modelUrl} wireframe={wireframe} onStats={handleStats} />
          ) : (
            <PlaceholderModel wireframe={wireframe} />
          )}

          {/* Grid */}
          {showGrid && (
            <Grid
              args={[20, 20]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#1a1a2e"
              sectionSize={2}
              sectionThickness={1}
              sectionColor="#2a2a4e"
              fadeDistance={12}
              fadeStrength={1}
              followCamera={false}
              infiniteGrid
            />
          )}

          {/* Controls */}
          <OrbitControls
            autoRotate={autoRotate}
            autoRotateSpeed={2}
            enableDamping
            dampingFactor={0.05}
            minDistance={1}
            maxDistance={20}
          />

          {/* Gizmo */}
          <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
            <GizmoViewport
              axisColors={["#ef4444", "#22c55e", "#3b82f6"]}
              labelColor="white"
            />
          </GizmoHelper>

          {/* Performance Stats */}
          {showStats && <Stats className="!absolute !left-2 !top-2" />}
        </Suspense>
      </Canvas>

      {/* Controls Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 rounded-xl glass">
        <ControlButton
          icon={autoRotate ? Pause : Play}
          label={autoRotate ? "Pause" : "Rotate"}
          active={autoRotate}
          onClick={() => setAutoRotate(!autoRotate)}
        />
        <ControlButton
          icon={Box}
          label="Wireframe"
          active={wireframe}
          onClick={() => setWireframe(!wireframe)}
        />
        <ControlButton
          icon={Grid3x3}
          label="Grid"
          active={showGrid}
          onClick={() => setShowGrid(!showGrid)}
        />
        <ControlButton
          icon={Info}
          label="Stats"
          active={showStats}
          onClick={() => setShowStats(!showStats)}
        />
      </div>

      {/* Model Stats Overlay */}
      {modelUrl && (
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          <div className="px-2.5 py-1 rounded-lg glass text-xs">
            <span className="text-[#64748b]">Faces: </span>
            <span className="text-[#f1f5f9] font-mono">{modelStats.faces.toLocaleString()}</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg glass text-xs">
            <span className="text-[#64748b]">Vertices: </span>
            <span className="text-[#f1f5f9] font-mono">{modelStats.vertices.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ControlButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-2 rounded-lg transition-all duration-200
        ${active
          ? "bg-[rgba(99,102,241,0.2)] text-[#818cf8]"
          : "text-[#64748b] hover:text-[#94a3b8] hover:bg-[rgba(148,163,184,0.05)]"
        }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
