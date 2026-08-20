import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { ShoppingBag, Wallet, Clock, TrendingUp, ChevronLeft, Loader2 } from "lucide-react";
import { CURRENCY } from "@/data/products";
import { getAllOrders, isCancelled, STATUS_STEPS, statusIndex, type Order } from "@/lib/orders";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

function statusLabel(order: Order) {
  if (order.status === "cancelled") return "ملغي";
  return STATUS_STEPS[statusIndex(order.status)]?.label ?? "";
}

const DAY = 1000 * 60 * 60 * 24;
const STATUS_COLORS: Record<string, string> = {
  pending: "oklch(0.7 0.15 80)",
  paid: "oklch(0.7 0.17 150)",
  processing: "oklch(0.65 0.18 250)",
  shipped: "oklch(0.7 0.16 180)",
  delivered: "oklch(0.65 0.2 140)",
  cancelled: "oklch(0.6 0.2 25)",
};
const STATUS_AR: Record<string, string> = {
  pending: "بانتظار الدفع",
  paid: "تم الدفع",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

function DashboardOverview() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", "all"],
    queryFn: getAllOrders,
  });
  const [period, setPeriod] = useState<7 | 30>(7);

  const stats = useMemo(() => {
    const active = orders.filter((o: Order) => !isCancelled(o.status));
    const revenue = active.reduce((s: number, o: Order) => s + o.total, 0);
    const pending = orders.filter(
      (o: Order) => o.status === "pending" || o.status === "processing",
    ).length;
    const delivered = orders.filter((o: Order) => o.status === "delivered").length;
    const conversion = orders.length ? Math.round((delivered / orders.length) * 100) : 0;
    return { total: orders.length, revenue, pending, conversion };
  }, [orders]);

  const revenueData = useMemo(() => {
    const now = new Date();
    const days: { label: string; revenue: number }[] = [];
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * DAY);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const end = start + DAY;
      const revenue = orders
        .filter((o: Order) => !isCancelled(o.status) && o.createdAt >= start && o.createdAt < end)
        .reduce((s: number, o: Order) => s + o.total, 0);
      days.push({
        label: d.toLocaleDateString("ar", { day: "numeric", month: "numeric" }),
        revenue,
      });
    }
    return days;
  }, [orders, period]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o: Order) => {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      key,
      name: STATUS_AR[key] ?? key,
      value,
    }));
  }, [orders]);

  const cards = [
    { label: "إجمالي الطلبات", value: String(stats.total), icon: ShoppingBag },
    { label: "الإيرادات", value: `${stats.revenue.toFixed(0)} ${CURRENCY}`, icon: Wallet },
    { label: "قيد التنفيذ", value: String(stats.pending), icon: Clock },
    { label: "معدل التحويل", value: `${stats.conversion}%`, icon: TrendingUp },
  ];

  const recent = orders.slice(0, 5);
  const hasOrders = orders.length > 0;

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold">نظرة عامة</h1>
      <p className="mt-1 text-sm text-muted-foreground">ملخص أداء متجرك.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border/60 bg-card p-4">
            <c.icon className="h-5 w-5 text-primary" />
            <div className="mt-3 text-2xl font-extrabold">{c.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-border/60 bg-card p-4 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">الإيرادات حسب الفترة</h2>
            <div className="flex gap-1">
              {([7, 30] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${period === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                >
                  {p} يوم
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 h-64">
            {hasOrders ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "oklch(0.6 0 0)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "oklch(0.6 0 0)" }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ fill: "oklch(0.3 0 0 / 0.3)" }}
                    contentStyle={{
                      background: "oklch(0.2 0 0)",
                      border: "1px solid oklch(0.35 0 0)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v} ${CURRENCY}`, "الإيرادات"]}
                  />
                  <Bar dataKey="revenue" fill="oklch(0.72 0.17 150)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-4 lg:col-span-2">
          <h2 className="font-bold">حالة الطلبات</h2>
          <div className="mt-4 h-64">
            {hasOrders ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? "oklch(0.6 0 0)"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.2 0 0)",
                      border: "1px solid oklch(0.35 0 0)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {statusData.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: STATUS_COLORS[s.key] }}
                />
                {s.name} ({s.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold">أحدث الطلبات</h2>
        <Link to="/dashboard/orders" className="text-sm font-semibold text-primary hover:underline">
          عرض الكل
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
          لا توجد طلبات بعد.
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {recent.map((o: Order) => (
            <Link
              key={o.id}
              to="/dashboard/orders/$tracking"
              params={{ tracking: o.tracking }}
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-primary"
            >
              <div>
                <div className="font-bold text-primary">{o.tracking}</div>
                <div className="mt-1 text-xs text-muted-foreground">{o.name}</div>
              </div>
              <div className="flex items-center gap-2 text-left">
                <div>
                  <div className="font-semibold">
                    {o.total.toFixed(2)} {CURRENCY}
                  </div>
                  <div
                    className={`mt-1 text-xs font-bold ${isCancelled(o.status) ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {statusLabel(o)}
                  </div>
                </div>
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      لا توجد بيانات كافية بعد.
    </div>
  );
}
