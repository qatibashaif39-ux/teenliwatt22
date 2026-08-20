import type { CartItem } from "@/context/CartContext";
import { d1 } from "@/lib/d1";

export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  tracking: string;
  name: string;
  email?: string;
  phone: string;
  address: string;
  emirate: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax?: number;
  taxRate?: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: string;
  createdAt: number;
  paidAt?: number;
  ziinaPaymentId?: string;
  ziinaStatus?: string;
  ziinaVerified?: boolean;
  ziinaVerifiedAt?: string;
  ziinaAmount?: number;
}

export interface PaymentStatusInfo {
  status: "paid" | "cod" | "pending" | "cancelled";
  label: string;
  enLabel: string;
  badgeClass: string;
  bannerClass: string;
  description: string;
}

export function getPaymentStatusInfo(order: {
  status: string;
  paymentMethod?: string;
}): PaymentStatusInfo {
  if (order.status === "paid") {
    return {
      status: "paid",
      label: "تم الدفع بنجاح",
      enLabel: "Paid Successfully",
      badgeClass: "bg-emerald-600 text-white border-emerald-600",
      bannerClass: "bg-emerald-500/10 text-emerald-800 border-emerald-500/30",
      description: "تم استلام وتأكيد الدفع الإلكتروني بنجاح.",
    };
  }
  if (order.status === "cancelled") {
    return {
      status: "cancelled",
      label: "ملغي",
      enLabel: "Cancelled",
      badgeClass: "bg-rose-600 text-white border-rose-600",
      bannerClass: "bg-rose-500/10 text-rose-800 border-rose-500/30",
      description: "تم إلغاء هذا الطلب.",
    };
  }
  if (order.paymentMethod === "cod" || !order.paymentMethod) {
    return {
      status: "cod",
      label: "الدفع عند الاستلام (COD)",
      enLabel: "Cash on Delivery",
      badgeClass: "bg-amber-600 text-white border-amber-600",
      bannerClass: "bg-amber-500/10 text-amber-800 border-amber-500/30",
      description: "المبلغ مستحق نقداً أو بالبطاقة عند استلام الطلب.",
    };
  }
  return {
    status: "pending",
    label: "بانتظار تأكيد الدفع",
    enLabel: "Pending Payment",
    badgeClass: "bg-blue-600 text-white border-blue-600",
    bannerClass: "bg-blue-500/10 text-blue-800 border-blue-500/30",
    description: "في انتظار إتمام عملية الدفع.",
  };
}

export const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "بانتظار الدفع" },
  { key: "paid", label: "تم الدفع" },
  { key: "processing", label: "قيد التجهيز" },
  { key: "shipped", label: "تم الشحن" },
  { key: "delivered", label: "تم التوصيل" },
];

export function statusIndex(status: OrderStatus) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

export function isCancelled(status: OrderStatus) {
  return status === "cancelled";
}

export function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" });
}

export interface TimelineStep {
  label: string;
  at: number | null;
  reached: boolean;
}

export function getTimeline(order: Order): TimelineStep[] {
  if (order.status === "cancelled") {
    return [
      { label: "تم استلام الطلب", at: order.createdAt, reached: true },
      { label: "تم إلغاء الطلب", at: order.createdAt, reached: true },
    ];
  }
  const reached = statusIndex(order.status);
  return STATUS_STEPS.map((step, idx) => ({
    label: step.label,
    at: idx === 0 ? order.createdAt : idx <= reached ? order.createdAt : null,
    reached: idx <= reached,
  }));
}

export function generateTracking() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const stamp = Date.now().toString().slice(-4);
  return `TL-${stamp}${rand}`;
}

export interface CreateOrderInput {
  name: string;
  email?: string;
  phone: string;
  address: string;
  emirate: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  tax?: number;
  taxRate?: number;
  total: number;
}

const LOCAL_ORDERS_KEY = "local_stored_orders";

function getLocalOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalOrder(order: Order) {
  if (typeof window === "undefined") return;
  const list = getLocalOrders();
  const index = list.findIndex((o) => o.id === order.id || o.tracking === order.tracking);
  if (index >= 0) {
    list[index] = order;
  } else {
    list.unshift(order);
  }
  window.localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const tracking = generateTracking();
  const orderId = `ord-${Date.now()}`;
  const localOrder: Order = {
    id: orderId,
    tracking,
    name: input.name,
    email: input.email?.trim() || undefined,
    phone: input.phone,
    address: input.address,
    emirate: input.emirate,
    items: input.items.map((i) => ({
      id: i.product.id,
      name: i.product.name,
      price: i.product.price,
      qty: i.qty,
    })),
    subtotal: input.subtotal,
    deliveryFee: input.deliveryFee,
    tax: input.tax ?? 0,
    taxRate: input.taxRate,
    total: input.total,
    status: "pending",
    createdAt: Date.now(),
  };

  saveLocalOrder(localOrder);
  rememberMyTracking(localOrder.tracking);

  // 1. Post to Server API /api/orders to insert in Cloudflare D1 DB
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: orderId,
        tracking,
        name: input.name,
        email: input.email?.trim() || undefined,
        phone: input.phone,
        address: input.address,
        emirate: input.emirate,
        items: localOrder.items,
        subtotal: input.subtotal,
        deliveryFee: input.deliveryFee,
        tax: input.tax,
        taxRate: input.taxRate,
        total: input.total,
        status: "pending",
        paymentMethod: "cod",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.order) {
        saveLocalOrder(data.order);
        return data.order;
      }
    }
  } catch (apiErr) {
    console.warn("[Orders API] Failed to post to /api/orders:", apiErr);
  }

  // 2. Also trigger customer data sync as backup
  d1.saveCustomerData({
    fname: input.name.split(" ")[0] || input.name,
    lname: input.name.split(" ").slice(1).join(" ") || "",
    email: input.email?.trim() || undefined,
    phone: input.phone,
    address: input.address,
    emirate: input.emirate,
    tracking,
    amount: input.total,
  }).catch(() => {});

  return localOrder;
}

const MY_ORDERS_KEY = "my_order_trackings";

export function getMyTrackings(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MY_ORDERS_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? (arr as string[]).filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function rememberMyTracking(tracking: string) {
  if (typeof window === "undefined") return;
  const list = getMyTrackings();
  if (!list.includes(tracking)) {
    list.unshift(tracking);
    window.localStorage.setItem(MY_ORDERS_KEY, JSON.stringify(list.slice(0, 200)));
  }
}

export async function getMyOrders(): Promise<Order[]> {
  const trackings = getMyTrackings();
  if (trackings.length === 0) return [];
  const all = await getAllOrders();
  return all.filter((o) => trackings.some((t) => t.toUpperCase() === o.tracking.toUpperCase()));
}

export async function findOrder(tracking: string): Promise<Order | null> {
  const normalized = tracking.trim().toUpperCase();
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(normalized)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.order) {
        saveLocalOrder(data.order);
        return data.order;
      }
    }
  } catch (err) {
    console.warn("[Orders API] Error fetching single order:", err);
  }

  const localList = getLocalOrders();
  return localList.find((o) => o.tracking.toUpperCase() === normalized) || null;
}

export async function getAllOrders(): Promise<Order[]> {
  try {
    const res = await fetch("/api/orders");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.orders) && data.orders.length > 0) {
        // Sync to local storage
        data.orders.forEach((o: Order) => saveLocalOrder(o));
        return data.orders;
      }
    }
  } catch (err) {
    console.warn("[Orders API] Error fetching all orders:", err);
  }
  return getLocalOrders();
}

export async function updateOrderStatus(tracking: string, status: OrderStatus): Promise<void> {
  const normalized = tracking.trim().toUpperCase();
  try {
    await fetch(`/api/orders/${encodeURIComponent(normalized)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  } catch (err) {
    console.warn("[Orders API] Error updating status:", err);
  }

  const localList = getLocalOrders();
  const order = localList.find((o) => o.tracking.toUpperCase() === normalized);
  if (order) {
    order.status = status;
    saveLocalOrder(order);
  }
}

export async function attachZiinaPayment(orderId: string, ziinaPaymentId: string): Promise<void> {
  const localList = getLocalOrders();
  const order = localList.find((o) => o.id === orderId);
  if (order) {
    order.ziinaPaymentId = ziinaPaymentId;
    order.paidAt = Date.now();
    order.status = "paid";
    saveLocalOrder(order);
  }
}

export async function confirmOrderPayment(
  tracking: string,
  paymentIntentId?: string,
): Promise<Order | null> {
  const normalized = tracking.trim().toUpperCase();
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(normalized)}/confirm-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId, status: "paid" }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.order) {
        saveLocalOrder(data.order);
        return data.order;
      }
    }
  } catch (err) {
    console.warn("[Orders API] Error confirming payment:", err);
  }

  const localList = getLocalOrders();
  const order = localList.find((o) => o.tracking.toUpperCase() === normalized);
  if (order) {
    order.status = "paid";
    (order as any).paymentMethod = "ziina";
    if (paymentIntentId) order.ziinaPaymentId = paymentIntentId;
    order.paidAt = Date.now();
    saveLocalOrder(order);
    return order;
  }
  return null;
}

export async function verifyZiinaOrderPayment(
  tracking: string,
  paymentIntentId?: string,
): Promise<{
  success: boolean;
  verified?: boolean;
  status?: string;
  ziinaStatus?: string;
  message?: string;
  paymentIntent?: any;
}> {
  const normalized = tracking.trim().toUpperCase();
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(normalized)}/verify-ziina`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error("[Orders API] Error verifying Ziina payment:", err);
    return { success: false, message: err?.message || "Failed to verify Ziina payment" };
  }
}
