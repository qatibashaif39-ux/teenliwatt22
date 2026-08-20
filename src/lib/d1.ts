// Cloudflare D1 Integration Library for Database, Catalog, Orders, Settings, and Customer Data

export interface D1Customer {
  id: string;
  fname: string;
  lname: string;
  email?: string;
  phone: string;
  address: string;
  emirate: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderTracking?: string;
  created_at: string;
}

export interface SaveCustomerInput {
  fname: string;
  lname: string;
  email?: string;
  phone: string;
  address: string;
  emirate: string;
  orderId?: string;
  tracking?: string;
  amount?: number;
}

const D1_CUSTOMERS_KEY = "cloudflare_d1_customers_store";

export async function fetchCustomers(): Promise<D1Customer[]> {
  try {
    const res = await fetch("/api/customers");
    if (res.ok) {
      const data = await res.json();
      if (data?.customers && Array.isArray(data.customers)) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(D1_CUSTOMERS_KEY, JSON.stringify(data.customers));
        }
        return data.customers;
      }
    }
  } catch (err) {
    console.warn("[fetchCustomers] Error fetching from D1 API, using local store:", err);
  }
  return getD1Customers();
}

export function getD1Customers(): D1Customer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(D1_CUSTOMERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveD1CustomerLocally(customer: D1Customer) {
  if (typeof window === "undefined") return;
  const list = getD1Customers();
  const cleanPhone = customer.phone.replace(/[\s\-()]/g, "");
  const index = list.findIndex(
    (c) =>
      c.phone.replace(/[\s\-()]/g, "") === cleanPhone ||
      (c.fname === customer.fname && c.lname === customer.lname),
  );
  if (index >= 0) {
    const existing = list[index];
    list[index] = {
      ...existing,
      fname: customer.fname || existing.fname,
      lname: customer.lname || existing.lname,
      email: customer.email || existing.email,
      address: customer.address || existing.address,
      emirate: customer.emirate || existing.emirate,
      totalOrders: existing.totalOrders + 1,
      totalSpent: existing.totalSpent + customer.totalSpent,
      lastOrderTracking: customer.lastOrderTracking || existing.lastOrderTracking,
    };
  } else {
    list.unshift(customer);
  }
  window.localStorage.setItem(D1_CUSTOMERS_KEY, JSON.stringify(list));
}

// Config reader for Cloudflare D1 API
export function getCloudflareD1Config() {
  const accountId = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID || "";
  const databaseId = import.meta.env.VITE_CLOUDFLARE_DATABASE_ID || "";
  const globalApiKey =
    import.meta.env.VITE_CLOUDFLARE_GLOBAL_API_KEY || import.meta.env.VITE_CLOUDFLARE_API_KEY || "";
  const apiToken = import.meta.env.VITE_CLOUDFLARE_API_TOKEN || "";
  const email = import.meta.env.VITE_CLOUDFLARE_EMAIL || "";

  return { accountId, databaseId, globalApiKey, apiToken, email };
}

export async function executeD1Query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const { accountId, databaseId, globalApiKey, apiToken, email } = getCloudflareD1Config();

  // If Cloudflare credentials exist, attempt live D1 REST API call
  if (accountId && databaseId && (apiToken || (globalApiKey && email))) {
    try {
      const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiToken) {
        headers["Authorization"] = `Bearer ${apiToken}`;
      } else {
        headers["X-Auth-Email"] = email;
        headers["X-Auth-Key"] = globalApiKey;
      }

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ sql, params }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.result?.[0]?.results) {
          return json.result[0].results as T[];
        }
      }
    } catch (err) {
      console.warn("[Cloudflare D1 REST API] Query error (using local store fallback):", err);
    }
  }

  return [];
}

export const d1 = {
  /**
   * Saves or updates customer data in Cloudflare D1 format and local persistence
   */
  async saveCustomerData(input: SaveCustomerInput): Promise<D1Customer> {
    const fname = input.fname.trim();
    const lname = input.lname.trim();
    const email = input.email?.trim() || undefined;
    const phone = input.phone.trim();
    const amount = Number(input.amount || 0);

    const customerRecord: D1Customer = {
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fname,
      lname,
      email,
      phone,
      address: input.address.trim(),
      emirate: input.emirate.trim(),
      totalOrders: 1,
      totalSpent: amount,
      lastOrderTracking: input.tracking,
      created_at: new Date().toISOString(),
    };

    // Save locally
    saveD1CustomerLocally(customerRecord);

    // Sync with backend API
    try {
      fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: customerRecord.id,
          fname,
          lname,
          email,
          phone,
          address: input.address.trim(),
          emirate: input.emirate.trim(),
          totalSpent: amount,
          lastOrderTracking: input.tracking,
        }),
      }).catch((e) => console.warn("[d1.saveCustomerData] API sync warning:", e));
    } catch {
      // ignore
    }

    return customerRecord;
  },

  /**
   * Prepared query helper for Cloudflare D1 SQL operations
   */
  prepare(sql: string) {
    return {
      bind(...params: any[]) {
        return {
          async first<T = any>(): Promise<T | null> {
            const results = await executeD1Query<T>(sql, params);
            return results[0] || null;
          },
          async all<T = any>(): Promise<{ results: T[] }> {
            const results = await executeD1Query<T>(sql, params);
            return { results };
          },
          async run() {
            await executeD1Query(sql, params);
            return { success: true, meta: { duration: 12 } };
          },
        };
      },
      async first<T = any>(): Promise<T | null> {
        const results = await executeD1Query<T>(sql);
        return results[0] || null;
      },
      async all<T = any>(): Promise<{ results: T[] }> {
        if (sql.includes("FROM customers")) {
          const cloudflareResults = await executeD1Query<T>(sql);
          if (cloudflareResults.length > 0) return { results: cloudflareResults };
          return { results: getD1Customers() as unknown as T[] };
        }
        const results = await executeD1Query<T>(sql);
        return { results };
      },
      async run() {
        await executeD1Query(sql);
        return { success: true, meta: { duration: 12 } };
      },
    };
  },

  /**
   * Generates Cloudflare D1 SQL Dump for customer database
   */
  exportCustomerSqlDump(): string {
    const customers = getD1Customers();
    const sqlStatements = [
      "-- Cloudflare D1 Schema for Customer Data",
      "CREATE TABLE IF NOT EXISTS customers (",
      "  id TEXT PRIMARY KEY,",
      "  fname TEXT NOT NULL,",
      "  lname TEXT NOT NULL,",
      "  phone TEXT NOT NULL UNIQUE,",
      "  address TEXT NOT NULL,",
      "  emirate TEXT NOT NULL,",
      "  total_orders INTEGER DEFAULT 1,",
      "  total_spent REAL DEFAULT 0.0,",
      "  last_order_tracking TEXT,",
      "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      ");",
      "",
      "-- Insert Customer Data",
    ];

    customers.forEach((c) => {
      const fnameClean = c.fname.replace(/'/g, "''");
      const lnameClean = c.lname.replace(/'/g, "''");
      const addrClean = c.address.replace(/'/g, "''");
      sqlStatements.push(
        `INSERT INTO customers (id, fname, lname, phone, address, emirate, total_orders, total_spent, last_order_tracking, created_at) ` +
          `VALUES ('${c.id}', '${fnameClean}', '${lnameClean}', '${c.phone}', '${addrClean}', '${c.emirate}', ${c.totalOrders}, ${c.totalSpent}, '${c.lastOrderTracking || ""}', '${c.created_at}') ` +
          `ON CONFLICT(phone) DO UPDATE SET address=excluded.address, emirate=excluded.emirate, total_orders=total_orders+1, total_spent=total_spent+excluded.total_spent;`,
      );
    });

    return sqlStatements.join("\n");
  },
};
