import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Store,
  Tags,
  LogOut,
  Loader2,
  Settings,
  Database,
  Megaphone,
  CheckSquare,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة التحكم — تين ليوا (المشرفين فقط)" },
      { name: "description", content: "إدارة الطلبات والمنتجات والإحصائيات في تين ليوا للمشرفين." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardLayout,
});

const NAV = [
  { to: "/dashboard", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/orders", label: "الطلبات", icon: ShoppingBag, exact: false },
  { to: "/dashboard/products", label: "المنتجات", icon: Package, exact: false },
  { to: "/dashboard/categories", label: "الأصناف", icon: Tags, exact: false },
  { to: "/dashboard/todos", label: "المهام (Todo)", icon: CheckSquare, exact: false },
  { to: "/dashboard/ads", label: "إعلانات AI", icon: Megaphone, exact: false },
  { to: "/dashboard/database", label: "قاعدة البيانات D1", icon: Database, exact: false },
  { to: "/dashboard/settings", label: "الإعدادات", icon: Settings, exact: false },
] as const;

function DashboardLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, isAdmin, loading, signOut } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) {
      navigate({ to: "/auth" });
    }
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-xs font-bold text-muted-foreground">جاري التحقق من صلاحيات المشرف...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <ShieldCheck className="h-12 w-12 text-destructive/80" />
        <h1 className="mt-4 text-xl font-bold">وصول مقيّد — المشرفين فقط</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          لوحة التحكم متاحة فقط للمشرفين المصرح لهم المسجلين في النظام.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => signOut().then(() => navigate({ to: "/auth" }))}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold hover:bg-secondary"
          >
            تسجيل الدخول كمشرف
          </button>
          <Link
            to="/"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            العودة للمتجر
          </Link>
        </div>
      </div>
    );
  }

  const isActive = (to: string, exact: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row">
      <aside className="shrink-0 md:w-60">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <span className="font-extrabold text-foreground">لوحة التحكم</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">
              <ShieldCheck className="h-3 w-3" /> مشرف
            </span>
          </div>

          {/* Supervisor Info */}
          <div className="flex items-center gap-2.5 rounded-xl bg-secondary/50 p-2.5 mb-3 text-xs">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary font-bold">
              <User className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground truncate">
                {user.name || user.username || "مشرف المتجر"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {user.email || user.username}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                  isActive(item.to, item.exact)
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer Actions */}
          <div className="mt-4 border-t border-border/70 pt-3 flex flex-col gap-1.5">
            <button
              onClick={() => signOut().then(() => navigate({ to: "/auth" }))}
              className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors w-full text-right"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>تسجيل الخروج</span>
            </button>
            <Link
              to="/"
              className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>← العودة للمتجر</span>
            </Link>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
