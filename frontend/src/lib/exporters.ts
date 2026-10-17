import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";

/**
 * Converts a GLB 3D model into OBJ or STL format on the client side.
 * Allows instant, zero-cost exports even when only GLB was produced.
 */
export async function convertGlbToFormat(
  glbUrl: string,
  format: "obj" | "stl"
): Promise<Blob> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(glbUrl);

  if (format === "obj") {
    const exporter = new OBJExporter();
    const result = exporter.parse(gltf.scene);
    return new Blob([result], { type: "text/plain" });
  }

  if (format === "stl") {
    const exporter = new STLExporter();
    const result = exporter.parse(gltf.scene, { binary: true });
    return new Blob([result], { type: "application/octet-stream" });
  }

  throw new Error(`Unsupported conversion format: ${format}`);
}
