/**
 * Cloudflare R2 Storage Module
 * Uploads generated 3D files to R2 and returns public URLs.
 * Falls back gracefully to local AI server URLs if R2 not configured.
 *
 * Free tier: 10GB storage, 10M reads/month, NO egress fees.
 * Setup: https://dash.cloudflare.com/r2
 */

import { S3Client, PutObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";

// ── Config ────────────────────────────────────────────────────────────────────
const R2_ACCOUNT_ID        = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID     = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME       = process.env.R2_BUCKET_NAME || "morphix3d-outputs";
const R2_PUBLIC_URL        = process.env.R2_PUBLIC_URL || "";

export const R2_ENABLED =
  !!R2_ACCOUNT_ID && !!R2_ACCESS_KEY_ID && !!R2_SECRET_ACCESS_KEY && !!R2_PUBLIC_URL;

let s3Client: S3Client | null = null;

function getClient(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

// ── Test connection ───────────────────────────────────────────────────────────
export async function testR2Connection(): Promise<boolean> {
  if (!R2_ENABLED) return false;
  try {
    await getClient().send(new HeadBucketCommand({ Bucket: R2_BUCKET_NAME }));
    console.log(`[R2] Connected to bucket: ${R2_BUCKET_NAME}`);
    return true;
  } catch (e) {
    console.error("[R2] Connection failed:", e);
    return false;
  }
}

// ── Upload a file from URL to R2 ──────────────────────────────────────────────
export async function uploadToR2(
  sourceUrl: string,
  key: string,
  contentType: string
): Promise<string | null> {
  if (!R2_ENABLED) return null;

  try {
    const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`Failed to fetch ${sourceUrl}: ${res.status}`);

    const body = Buffer.from(await res.arrayBuffer());

    await getClient().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    const publicUrl = `${R2_PUBLIC_URL}/${key}`;
    console.log(`[R2] Uploaded: ${key} (${(body.length / 1024).toFixed(1)}KB) -> ${publicUrl}`);
    return publicUrl;
  } catch (e) {
    console.error(`[R2] Upload failed for ${key}:`, e);
    return null;
  }
}

// ── Upload all 3D output files for a job ─────────────────────────────────────
export async function uploadJobOutputs(
  jobId: string,
  aiServerBase: string,
  localUrls: Record<string, string>
): Promise<Record<string, string>> {
  if (!R2_ENABLED) {
    console.log("[R2] Not configured — using local AI server URLs");
    return localUrls;
  }

  const uploads: Record<string, string> = {};

  const fileMap: { key: string; urlKey: string; contentType: string }[] = [
    { key: `outputs/${jobId}/model.glb`,      urlKey: "glb",       contentType: "model/gltf-binary" },
    { key: `outputs/${jobId}/model.obj`,      urlKey: "obj",       contentType: "model/obj" },
    { key: `outputs/${jobId}/thumbnail.png`,  urlKey: "thumbnail", contentType: "image/png" },
  ];

  await Promise.all(
    fileMap.map(async ({ key, urlKey, contentType }) => {
      const localUrl = localUrls[urlKey];
      if (!localUrl) return;

      // Convert relative path to absolute local AI server URL
      const sourceUrl = localUrl.startsWith("http") ? localUrl : `${aiServerBase}${localUrl}`;
      const r2Url = await uploadToR2(sourceUrl, key, contentType);

      // Use R2 URL if upload succeeded, otherwise keep local
      uploads[urlKey] = r2Url || localUrl;
    })
  );

  return { ...localUrls, ...uploads };
}
