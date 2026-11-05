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
import { Suspense, useRef, useState, useCallback, useEffect, useMemo } from "react";
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
          color="#FF6A1A"
          wireframe={wireframe}
          roughness={0.32}
          metalness={0.55}
          emissive="#E85A0C"
          emissiveIntensity={0.08}
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
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0 && isFinite(maxDim)) {
      const targetScale = 2.4 / maxDim;
      clone.scale.setScalar(targetScale);
    }
    return clone;
  }, [scene]);

  // Compute and report stats after mounting/updating
  useEffect(() => {
    let totalFaces = 0;
    let totalVertices = 0;
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geometry = child.geometry;
        if (geometry) {
          totalFaces += geometry.index
            ? geometry.index.count / 3
            : (geometry.attributes?.position ? geometry.attributes.position.count / 3 : 0);
          totalVertices += geometry.attributes?.position ? geometry.attributes.position.count : 0;
        }
      }
    });

    onStats({ faces: Math.round(totalFaces), vertices: totalVertices });
  }, [clonedScene, onStats]);

  // Handle wireframe toggle without destroying original material properties
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            if ("wireframe" in mat) (mat as THREE.MeshStandardMaterial).wireframe = wireframe;
          });
        } else {
          if ("wireframe" in child.material) {
            (child.material as THREE.MeshStandardMaterial).wireframe = wireframe;
          }
        }
      }
    });
  }, [clonedScene, wireframe]);

  return (
    <Center>
      <primitive object={clonedScene} />
    </Center>
  );
}

interface ModelViewerProps {
  modelUrl?: string | null;
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
    <div className={`relative rounded-xl overflow-hidden bg-[#EDEFF2] border border-[#141413]/20 ${className}`}>
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [3, 2, 3], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        className="!bg-transparent"
      >
        {/* Daylight Studio Lighting */}
        <ambientLight intensity={0.95} />
        <hemisphereLight args={["#ffffff", "#D8D2C5", 1.1]} />
        <directionalLight position={[5, 6, 5]} intensity={1.45} castShadow />
        <directionalLight position={[-5, 4, -4]} intensity={0.75} color="#ffffff" />
        <pointLight position={[0, 4, 3]} intensity={0.45} color="#FF6A1A" />

        <Suspense fallback={<PlaceholderModel wireframe={wireframe} />}>
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
              cellThickness={0.6}
              cellColor="#CBD5E1"
              sectionSize={2}
              sectionThickness={1.1}
              sectionColor="#94A3B8"
              fadeDistance={14}
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
              axisColors={["#FF6A1A", "#16A34A", "#2563EB"]}
              labelColor="#141413"
            />
          </GizmoHelper>

          {/* Performance Stats */}
          {showStats && <Stats className="!absolute !left-2 !top-2" />}
        </Suspense>
      </Canvas>

      {/* Controls Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[#FAF8F2]/95 border-[1.5px] border-[#141413] shadow-[3px_3px_0px_#141413]">
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
          <div className="px-2.5 py-1 rounded-lg bg-[#FAF8F2]/95 border border-[#141413]/25 text-xs">
            <span className="text-[#6E6C65]">Faces: </span>
            <span className="text-[#141413] font-mono font-bold">{modelStats.faces.toLocaleString()}</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-[#FAF8F2]/95 border border-[#141413]/25 text-xs">
            <span className="text-[#6E6C65]">Vertices: </span>
            <span className="text-[#141413] font-mono font-bold">{modelStats.vertices.toLocaleString()}</span>
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
      className={`p-2 rounded-lg transition-all duration-200 cursor-pointer
        ${active
          ? "bg-[#141413] text-[#FAF8F2]"
          : "text-[#6E6C65] hover:text-[#141413] hover:bg-[#EDEFF2]"
        }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
