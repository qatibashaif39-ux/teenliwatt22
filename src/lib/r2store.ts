import { uploadObjectToR2, getObjectFromR2 } from "./storage";
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, ProductItem, CategoryItem } from "../api/products";

export interface StoreState {
  products: ProductItem[];
  categories: CategoryItem[];
  orders: any[];
  customers: any[];
  settings: Record<string, any>;
  lastUpdated: string;
}

const STORE_KEY = "data/store.json";

let memoryStore: StoreState = {
  products: [...INITIAL_PRODUCTS],
  categories: [...INITIAL_CATEGORIES],
  orders: [],
  customers: [],
  settings: {
    storeName: "تين ليوا",
    currency: "AED",
    deliveryFee: 25,
    minOrderAmount: 50,
  },
  lastUpdated: new Date().toISOString(),
};

let storeLoadedFromR2 = false;

/**
 * Loads store data from R2 bucket. If file doesn't exist, initializes it with defaults.
 */
export async function loadStoreFromR2(envContext?: { env?: any }): Promise<StoreState> {
  if (storeLoadedFromR2) {
    return memoryStore;
  }

  try {
    const file = await getObjectFromR2(STORE_KEY, envContext);
    if (file && file.data && file.data.length > 0) {
      const decoded = new TextDecoder().decode(file.data);
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed === "object") {
        const hasProducts = Array.isArray(parsed.products) && parsed.products.length > 0;
        const hasCategories = Array.isArray(parsed.categories) && parsed.categories.length > 0;

        memoryStore = {
          products: hasProducts ? parsed.products : [...INITIAL_PRODUCTS],
          categories: hasCategories ? parsed.categories : [...INITIAL_CATEGORIES],
          orders: Array.isArray(parsed.orders) ? parsed.orders : [],
          customers: Array.isArray(parsed.customers) ? parsed.customers : [],
          settings: parsed.settings || memoryStore.settings,
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
        storeLoadedFromR2 = true;
        return memoryStore;
      }
    }
  } catch (err) {
    console.warn("[r2store] Could not load store from R2, using memory store:", err);
  }

  storeLoadedFromR2 = true;
  // Initialize file in R2 asynchronously if not present
  saveStoreToR2(memoryStore, envContext).catch(() => {});
  return memoryStore;
}

/**
 * Saves current store state to Cloudflare R2 bucket
 */
export async function saveStoreToR2(
  state: Partial<StoreState>,
  envContext?: { env?: any },
): Promise<StoreState> {
  memoryStore = {
    ...memoryStore,
    ...state,
    lastUpdated: new Date().toISOString(),
  };

  try {
    const payload = JSON.stringify(memoryStore, null, 2);
    await uploadObjectToR2(STORE_KEY, payload, "application/json", envContext);
  } catch (err) {
    console.warn("[r2store] Warning while saving store to R2:", err);
  }

  return memoryStore;
}

export function getMemoryStore(): StoreState {
  return memoryStore;
}
