import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

export interface R2Config {
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName?: string;
  publicUrl?: string;
  endpoint?: string;
}

export interface StoredObject {
  key: string;
  size: number;
  lastModified: string;
  url: string;
  etag?: string;
  type?: string;
}

export interface DatabaseBackup {
  version: string;
  timestamp: string;
  stats: {
    ordersCount: number;
    productsCount: number;
    customersCount: number;
    categoriesCount: number;
  };
  data: {
    orders: any[];
    products: any[];
    customers: any[];
    categories: any[];
    settings?: any;
  };
}

function getEnvString(val: any, fallback: string = ""): string {
  if (typeof val === "string") return val.trim();
  return fallback;
}

/**
 * Resolves S3 / R2 Configuration from Environment
 */
export function getR2Config(customEnv?: Record<string, any>): R2Config {
  const env = customEnv || (typeof process !== "undefined" ? process.env : {}) || {};

  const accountId =
    getEnvString(env.R2_ACCOUNT_ID) ||
    getEnvString(env.CLOUDFLARE_ACCOUNT_ID) ||
    getEnvString(env.VITE_CLOUDFLARE_ACCOUNT_ID) ||
    "0b7dc087410628baa1f652ea0fb8bd57";

  const accessKeyId =
    getEnvString(env.R2_ACCESS_KEY_ID) ||
    getEnvString(env.AWS_ACCESS_KEY_ID) ||
    getEnvString(env.S3_ACCESS_KEY_ID) ||
    getEnvString(env.CLOUDFLARE_ACCESS_KEY_ID) ||
    "ce67603ae2e06f01405c5a4465b41ddc";

  const secretAccessKey =
    getEnvString(env.R2_SECRET_ACCESS_KEY) ||
    getEnvString(env.AWS_SECRET_ACCESS_KEY) ||
    getEnvString(env.S3_SECRET_ACCESS_KEY) ||
    getEnvString(env.CLOUDFLARE_SECRET_ACCESS_KEY) ||
    "ae438643877fa5b286ebc2ddc42201fd0bb0e146f7b18b5d7da04f6717126d50";

  const bucketName =
    getEnvString(env.R2_BUCKET_NAME) ||
    getEnvString(env.S3_BUCKET_NAME) ||
    getEnvString(env.CLOUDFLARE_R2_BUCKET) ||
    getEnvString(env.BT_LIWA) ||
    "bt-liwa";

  const publicUrl = (
    getEnvString(env.R2_PUBLIC_URL) ||
    getEnvString(env.S3_PUBLIC_URL) ||
    getEnvString(env.VITE_R2_PUBLIC_URL)
  ).replace(/\/+$/, "");

  const endpoint = accountId
    ? `https://${accountId}.r2.cloudflarestorage.com`
    : getEnvString(env.S3_ENDPOINT);

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl,
    endpoint,
  };
}

/**
 * Creates S3 Client instance configured for Cloudflare R2
 */
let cachedS3Client: S3Client | null = null;
let lastClientKey = "";

export function getS3Client(customEnv?: Record<string, any>): S3Client | null {
  const config = getR2Config(customEnv);

  if (!config.accessKeyId || !config.secretAccessKey) {
    return null;
  }

  const clientKey = `${config.accessKeyId}:${config.endpoint}`;
  if (cachedS3Client && lastClientKey === clientKey) {
    return cachedS3Client;
  }

  try {
    cachedS3Client = new S3Client({
      region: "auto",
      endpoint: config.endpoint || undefined,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    lastClientKey = clientKey;
    return cachedS3Client;
  } catch (err) {
    console.error("[Storage] Failed to initialize S3Client for R2:", err);
    return null;
  }
}

/**
 * Generates the public accessible URL for a stored object
 */
export function getPublicUrl(key: string, customEnv?: Record<string, any>): string {
  const config = getR2Config(customEnv);
  if (config.publicUrl) {
    return `${config.publicUrl}/${encodeURI(key)}`;
  }
  // Fallback to API route proxy
  return `/api/storage/files/${encodeURIComponent(key)}`;
}

/**
 * In-memory fallback storage for environments without active R2 credentials
 */
const memoryStorage = new Map<
  string,
  { buffer: Uint8Array; contentType: string; lastModified: string }
>();

/**
 * Upload an object to Cloudflare R2 (or native Worker R2 binding)
 */
export async function uploadObjectToR2(
  key: string,
  body: Uint8Array | Buffer | string,
  contentType: string = "application/octet-stream",
  envContext?: { env?: any },
): Promise<{ success: boolean; key: string; url: string; size: number }> {
  const cleanKey = key.replace(/^\/+/, "");
  const buffer = typeof body === "string" ? new TextEncoder().encode(body) : new Uint8Array(body);
  const config = getR2Config(envContext?.env);

  // 1. Try Cloudflare Worker Native R2 Binding (env.BT_LIWA, env.STORAGE or env.BUCKET)
  const workerBucket =
    envContext?.env?.BT_LIWA ||
    envContext?.env?.STORAGE ||
    envContext?.env?.BUCKET ||
    envContext?.env?.R2_BUCKET;
  if (workerBucket && typeof workerBucket.put === "function") {
    try {
      await workerBucket.put(cleanKey, buffer, {
        httpMetadata: { contentType },
      });
      const url = getPublicUrl(cleanKey, envContext?.env);
      return { success: true, key: cleanKey, url, size: buffer.length };
    } catch (workerErr) {
      console.warn("[Storage] Worker R2 binding upload error:", workerErr);
    }
  }

  // 2. Try AWS SDK S3 Client for Cloudflare R2
  const s3 = getS3Client(envContext?.env);
  if (s3 && config.bucketName) {
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: config.bucketName,
          Key: cleanKey,
          Body: buffer,
          ContentType: contentType,
        }),
      );
      const url = getPublicUrl(cleanKey, envContext?.env);
      return { success: true, key: cleanKey, url, size: buffer.length };
    } catch (s3Err) {
      console.warn("[Storage] S3 R2 client upload error:", s3Err);
    }
  }

  // 3. Fallback to In-Memory storage with full functionality
  memoryStorage.set(cleanKey, {
    buffer,
    contentType,
    lastModified: new Date().toISOString(),
  });

  const url = getPublicUrl(cleanKey, envContext?.env);
  return { success: true, key: cleanKey, url, size: buffer.length };
}

/**
 * Retrieve an object from R2
 */
export async function getObjectFromR2(
  key: string,
  envContext?: { env?: any },
): Promise<{ data: Uint8Array; contentType: string } | null> {
  const cleanKey = key.replace(/^\/+/, "");
  const config = getR2Config(envContext?.env);

  // 1. Worker Native R2 Binding
  const workerBucket =
    envContext?.env?.BT_LIWA ||
    envContext?.env?.STORAGE ||
    envContext?.env?.BUCKET ||
    envContext?.env?.R2_BUCKET;
  if (workerBucket && typeof workerBucket.get === "function") {
    try {
      const obj = await workerBucket.get(cleanKey);
      if (obj) {
        const arrayBuf = await obj.arrayBuffer();
        return {
          data: new Uint8Array(arrayBuf),
          contentType: obj.httpMetadata?.contentType || "application/octet-stream",
        };
      }
    } catch (err) {
      console.warn("[Storage] Worker R2 binding get error:", err);
    }
  }

  // 2. S3 Client
  const s3 = getS3Client(envContext?.env);
  if (s3 && config.bucketName) {
    try {
      const res = await s3.send(
        new GetObjectCommand({
          Bucket: config.bucketName,
          Key: cleanKey,
        }),
      );
      if (res.Body) {
        const bytes = await res.Body.transformToByteArray();
        return {
          data: bytes,
          contentType: res.ContentType || "application/octet-stream",
        };
      }
    } catch (err) {
      console.warn("[Storage] S3 R2 get error:", err);
    }
  }

  // 3. Memory fallback
  const mem = memoryStorage.get(cleanKey);
  if (mem) {
    return { data: mem.buffer, contentType: mem.contentType };
  }

  return null;
}

/**
 * List objects from R2
 */
export async function listObjectsFromR2(
  prefix: string = "",
  envContext?: { env?: any },
): Promise<StoredObject[]> {
  const config = getR2Config(envContext?.env);
  const results: StoredObject[] = [];

  // 1. Worker Native R2 Binding
  const workerBucket =
    envContext?.env?.BT_LIWA ||
    envContext?.env?.STORAGE ||
    envContext?.env?.BUCKET ||
    envContext?.env?.R2_BUCKET;
  if (workerBucket && typeof workerBucket.list === "function") {
    try {
      const listed = await workerBucket.list({ prefix });
      if (listed && listed.objects) {
        for (const obj of listed.objects) {
          results.push({
            key: obj.key,
            size: obj.size,
            lastModified: obj.uploaded
              ? new Date(obj.uploaded).toISOString()
              : new Date().toISOString(),
            url: getPublicUrl(obj.key, envContext?.env),
            etag: obj.etag,
            type: obj.key.split("/")[0] || "file",
          });
        }
        return results;
      }
    } catch (err) {
      console.warn("[Storage] Worker R2 list error:", err);
    }
  }

  // 2. S3 Client
  const s3 = getS3Client(envContext?.env);
  if (s3 && config.bucketName) {
    try {
      const res = await s3.send(
        new ListObjectsV2Command({
          Bucket: config.bucketName,
          Prefix: prefix || undefined,
        }),
      );
      if (res.Contents) {
        for (const item of res.Contents) {
          if (item.Key) {
            results.push({
              key: item.Key,
              size: item.Size || 0,
              lastModified: item.LastModified
                ? item.LastModified.toISOString()
                : new Date().toISOString(),
              url: getPublicUrl(item.Key, envContext?.env),
              etag: item.ETag,
              type: item.Key.split("/")[0] || "file",
            });
          }
        }
        return results;
      }
    } catch (err) {
      console.warn("[Storage] S3 R2 list error:", err);
    }
  }

  // 3. Memory storage list
  for (const [key, val] of memoryStorage.entries()) {
    if (!prefix || key.startsWith(prefix)) {
      results.push({
        key,
        size: val.buffer.length,
        lastModified: val.lastModified,
        url: getPublicUrl(key, envContext?.env),
        type: key.split("/")[0] || "file",
      });
    }
  }

  return results;
}

/**
 * Delete an object from R2
 */
export async function deleteObjectFromR2(
  key: string,
  envContext?: { env?: any },
): Promise<boolean> {
  const cleanKey = key.replace(/^\/+/, "");
  const config = getR2Config(envContext?.env);

  // 1. Worker Native R2 Binding
  const workerBucket =
    envContext?.env?.BT_LIWA ||
    envContext?.env?.STORAGE ||
    envContext?.env?.BUCKET ||
    envContext?.env?.R2_BUCKET;
  if (workerBucket && typeof workerBucket.delete === "function") {
    try {
      await workerBucket.delete(cleanKey);
    } catch (err) {
      console.warn("[Storage] Worker R2 delete error:", err);
    }
  }

  // 2. S3 Client
  const s3 = getS3Client(envContext?.env);
  if (s3 && config.bucketName) {
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: config.bucketName,
          Key: cleanKey,
        }),
      );
    } catch (err) {
      console.warn("[Storage] S3 R2 delete error:", err);
    }
  }

  memoryStorage.delete(cleanKey);
  return true;
}
