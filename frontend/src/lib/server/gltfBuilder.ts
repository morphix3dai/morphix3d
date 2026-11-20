/**
 * Pure-TypeScript Binary glTF 2.0 (.glb) and ASCII STL (.stl) Builder for Vercel Serverless
 */

export interface BoxPrimitive {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color: [number, number, number];
}

export function buildGlbFromBoxes(boxes: BoxPrimitive[]): Buffer {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  let vertexOffset = 0;

  for (const b of boxes) {
    const hx = b.w / 2;
    const hy = b.h / 2;
    const hz = b.d / 2;
    const [cr, cg, cb] = b.color;

    const faces: Array<{ n: [number, number, number]; v: Array<[number, number, number]> }> = [
      {
        n: [0, 0, 1],
        v: [
          [b.x - hx, b.y - hy, b.z + hz],
          [b.x + hx, b.y - hy, b.z + hz],
          [b.x + hx, b.y + hy, b.z + hz],
          [b.x - hx, b.y + hy, b.z + hz],
        ],
      },
      {
        n: [0, 0, -1],
        v: [
          [b.x + hx, b.y - hy, b.z - hz],
          [b.x - hx, b.y - hy, b.z - hz],
          [b.x - hx, b.y + hy, b.z - hz],
          [b.x + hx, b.y + hy, b.z - hz],
        ],
      },
      {
        n: [0, 1, 0],
        v: [
          [b.x - hx, b.y + hy, b.z + hz],
          [b.x + hx, b.y + hy, b.z + hz],
          [b.x + hx, b.y + hy, b.z - hz],
          [b.x - hx, b.y + hy, b.z - hz],
        ],
      },
      {
        n: [0, -1, 0],
        v: [
          [b.x - hx, b.y - hy, b.z - hz],
          [b.x + hx, b.y - hy, b.z - hz],
          [b.x + hx, b.y - hy, b.z + hz],
          [b.x - hx, b.y - hy, b.z + hz],
        ],
      },
      {
        n: [1, 0, 0],
        v: [
          [b.x + hx, b.y - hy, b.z + hz],
          [b.x + hx, b.y - hy, b.z - hz],
          [b.x + hx, b.y + hy, b.z - hz],
          [b.x + hx, b.y + hy, b.z + hz],
        ],
      },
      {
        n: [-1, 0, 0],
        v: [
          [b.x - hx, b.y - hy, b.z - hz],
          [b.x - hx, b.y - hy, b.z + hz],
          [b.x - hx, b.y + hy, b.z + hz],
          [b.x - hx, b.y + hy, b.z - hz],
        ],
      },
    ];

    for (const f of faces) {
      for (const vert of f.v) {
        positions.push(vert[0], vert[1], vert[2]);
        normals.push(f.n[0], f.n[1], f.n[2]);
        colors.push(cr, cg, cb);
      }
      indices.push(
        vertexOffset,
        vertexOffset + 1,
        vertexOffset + 2,
        vertexOffset,
        vertexOffset + 2,
        vertexOffset + 3
      );
      vertexOffset += 4;
    }
  }

  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    if (positions[i] < minX) minX = positions[i];
    if (positions[i + 1] < minY) minY = positions[i + 1];
    if (positions[i + 2] < minZ) minZ = positions[i + 2];
    if (positions[i] > maxX) maxX = positions[i];
    if (positions[i + 1] > maxY) maxY = positions[i + 1];
    if (positions[i + 2] > maxZ) maxZ = positions[i + 2];
  }
  if (!isFinite(minX)) {
    minX = minY = minZ = -1;
    maxX = maxY = maxZ = 1;
  }

  const posBuf = Buffer.from(new Float32Array(positions).buffer);
  const normBuf = Buffer.from(new Float32Array(normals).buffer);
  const colBuf = Buffer.from(new Float32Array(colors).buffer);
  const idxBuf = Buffer.from(new Uint32Array(indices).buffer);

  const rawBin = Buffer.concat([posBuf, normBuf, colBuf, idxBuf]);
  const binPadding = (4 - (rawBin.length % 4)) % 4;
  const binChunkData = binPadding > 0 ? Buffer.concat([rawBin, Buffer.alloc(binPadding, 0)]) : rawBin;

  const gltfJson = {
    asset: { version: "2.0", generator: "Morphix 3D Engine (3dmorphix.com)" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: "Morphix3DModel" }],
    materials: [
      {
        name: "MorphixMaterial",
        pbrMetallicRoughness: {
          baseColorFactor: [1, 1, 1, 1],
          metallicFactor: 0.15,
          roughnessFactor: 0.55,
        },
        doubleSided: true,
      },
    ],
    meshes: [
      {
        name: "MorphixMesh",
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1, COLOR_0: 2 },
            indices: 3,
            material: 0,
          },
        ],
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: positions.length / 3,
        type: "VEC3",
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: normals.length / 3,
        type: "VEC3",
      },
      {
        bufferView: 2,
        componentType: 5126,
        count: colors.length / 3,
        type: "VEC3",
      },
      {
        bufferView: 3,
        componentType: 5125,
        count: indices.length,
        type: "SCALAR",
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: posBuf.length, target: 34962 },
      { buffer: 0, byteOffset: posBuf.length, byteLength: normBuf.length, target: 34962 },
      { buffer: 0, byteOffset: posBuf.length + normBuf.length, byteLength: colBuf.length, target: 34962 },
      { buffer: 0, byteOffset: posBuf.length + normBuf.length + colBuf.length, byteLength: idxBuf.length, target: 34963 },
    ],
    buffers: [{ byteLength: binChunkData.length }],
  };

  const rawJsonBuf = Buffer.from(JSON.stringify(gltfJson), "utf8");
  const jsonPadding = (4 - (rawJsonBuf.length % 4)) % 4;
  const jsonChunkData =
    jsonPadding > 0 ? Buffer.concat([rawJsonBuf, Buffer.alloc(jsonPadding, 0x20)]) : rawJsonBuf;

  const totalLength = 12 + 8 + jsonChunkData.length + 8 + binChunkData.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonChunkData.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4);

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(binChunkData.length, 0);
  binChunkHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonChunkHeader, jsonChunkData, binChunkHeader, binChunkData]);
}

export function buildStlFromBoxes(boxes: BoxPrimitive[], name = "Morphix3DPart"): string {
  const lines: string[] = [`solid ${name}`];
  for (const b of boxes) {
    const hx = b.w / 2,
      hy = b.h / 2,
      hz = b.d / 2;
    const faces: Array<{ n: [number, number, number]; v: Array<[number, number, number]> }> = [
      { n: [0, 0, 1], v: [[b.x - hx, b.y - hy, b.z + hz], [b.x + hx, b.y - hy, b.z + hz], [b.x + hx, b.y + hy, b.z + hz], [b.x - hx, b.y + hy, b.z + hz]] },
      { n: [0, 0, -1], v: [[b.x + hx, b.y - hy, b.z - hz], [b.x - hx, b.y - hy, b.z - hz], [b.x - hx, b.y + hy, b.z - hz], [b.x + hx, b.y + hy, b.z - hz]] },
      { n: [0, 1, 0], v: [[b.x - hx, b.y + hy, b.z + hz], [b.x + hx, b.y + hy, b.z + hz], [b.x + hx, b.y + hy, b.z - hz], [b.x - hx, b.y + hy, b.z - hz]] },
      { n: [0, -1, 0], v: [[b.x - hx, b.y - hy, b.z - hz], [b.x + hx, b.y - hy, b.z - hz], [b.x + hx, b.y - hy, b.z + hz], [b.x - hx, b.y - hy, b.z + hz]] },
      { n: [1, 0, 0], v: [[b.x + hx, b.y - hy, b.z + hz], [b.x + hx, b.y - hy, b.z - hz], [b.x + hx, b.y + hy, b.z - hz], [b.x + hx, b.y + hy, b.z + hz]] },
      { n: [-1, 0, 0], v: [[b.x - hx, b.y - hy, b.z - hz], [b.x - hx, b.y - hy, b.z + hz], [b.x - hx, b.y + hy, b.z + hz], [b.x - hx, b.y + hy, b.z - hz]] },
    ];
    for (const f of faces) {
      const [v0, v1, v2, v3] = f.v;
      for (const tri of [[v0, v1, v2], [v0, v2, v3]]) {
        lines.push(`  facet normal ${f.n[0]} ${f.n[1]} ${f.n[2]}`);
        lines.push(`    outer loop`);
        for (const pt of tri) {
          lines.push(`      vertex ${pt[0].toFixed(4)} ${pt[1].toFixed(4)} ${pt[2].toFixed(4)}`);
        }
        lines.push(`    endloop`);
        lines.push(`  endfacet`);
      }
    }
  }
  lines.push(`endsolid ${name}`);
  return lines.join("\n");
}
