import { uploadObjectToR2, listObjectsFromR2, getObjectFromR2, StoredObject } from "./storage";

export interface BackupItem {
  id: string;
  key: string;
  name: string;
  timestamp: string;
  size: number;
  url: string;
  counts: {
    orders: number;
    products: number;
    customers: number;
    categories: number;
  };
  checksum?: string;
  version: string;
}

export interface FullDatabaseDump {
  version: string;
  system: string;
  createdAt: string;
  stats: {
    orders: number;
    products: number;
    customers: number;
    categories: number;
  };
  tables: {
    orders: any[];
    products: any[];
    customers: any[];
    categories: any[];
    settings?: Record<string, any>;
  };
}

/**
 * Creates a full database backup and stores it in Cloudflare R2
 */
export async function createFullBackup(
  data: {
    orders: any[];
    products: any[];
    customers: any[];
    categories: any[];
    settings?: Record<string, any>;
  },
  envContext?: { env?: any },
): Promise<{ success: boolean; key: string; backup: BackupItem }> {
  const timestamp = new Date().toISOString();
  const dateSlug = timestamp.replace(/[:.]/g, "-");
  const key = `backups/db-backup-${dateSlug}.json`;

  const payload: FullDatabaseDump = {
    version: "2.0.0",
    system: "teenliwa-ecommerce",
    createdAt: timestamp,
    stats: {
      orders: data.orders.length,
      products: data.products.length,
      customers: data.customers.length,
      categories: data.categories.length,
    },
    tables: {
      orders: data.orders,
      products: data.products,
      customers: data.customers,
      categories: data.categories,
      settings: data.settings || {},
    },
  };

  const jsonStr = JSON.stringify(payload, null, 2);

  // 1. Upload timestamped backup to R2
  const uploadResult = await uploadObjectToR2(key, jsonStr, "application/json", envContext);

  // 2. Also save as latest.json for quick disaster recovery
  await uploadObjectToR2("backups/latest.json", jsonStr, "application/json", envContext);

  const backupItem: BackupItem = {
    id: `bk_${Date.now()}`,
    key,
    name: `نسخة احتياطية (${new Date(timestamp).toLocaleDateString("ar-AE")} ${new Date(timestamp).toLocaleTimeString("ar-AE")})`,
    timestamp,
    size: uploadResult.size,
    url: uploadResult.url,
    counts: payload.stats,
    version: payload.version,
  };

  return {
    success: true,
    key,
    backup: backupItem,
  };
}

/**
 * Lists all available backups stored in Cloudflare R2
 */
export async function listDatabaseBackups(envContext?: { env?: any }): Promise<BackupItem[]> {
  const objects: StoredObject[] = await listObjectsFromR2("backups/", envContext);
  const backups: BackupItem[] = [];

  for (const obj of objects) {
    if (obj.key === "backups/latest.json" || !obj.key.endsWith(".json")) {
      continue;
    }

    const filename = obj.key.replace(/^backups\//, "");
    backups.push({
      id: obj.key,
      key: obj.key,
      name: filename,
      timestamp: obj.lastModified,
      size: obj.size,
      url: obj.url,
      counts: {
        orders: 0,
        products: 0,
        customers: 0,
        categories: 0,
      },
      version: "2.0.0",
    });
  }

  // Sort descending by timestamp
  return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Downloads and parses a backup from R2
 */
export async function getBackupData(
  key: string,
  envContext?: { env?: any },
): Promise<FullDatabaseDump | null> {
  const file = await getObjectFromR2(key, envContext);
  if (!file) return null;

  try {
    const text = new TextDecoder().decode(file.data);
    return JSON.parse(text) as FullDatabaseDump;
  } catch (err) {
    console.error("[Backup] Failed to parse backup json:", err);
    return null;
  }
}
