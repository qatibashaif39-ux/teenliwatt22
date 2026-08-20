import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Lock, User, Eye, EyeOff, ArrowRight, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "تسجيل دخول المشرف — تين ليوا" },
      { name: "description", content: "بوابة تسجيل دخول المشرفين لإدارة متجر تين ليوا." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminAuthPage,
});

function AdminAuthPage() {
  const navigate = useNavigate();
  const { user, isAdmin, signIn, loading: authLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      navigate({ to: "/dashboard" });
    }
  }, [authLoading, user, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور للمشرف.");
      return;
    }

    setBusy(true);
    try {
      await signIn(cleanUsername, cleanPassword);
      toast.success("مرحباً بك في لوحة تحكم تين ليوا");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      const msg = err?.message || "اسم المستخدم أو كلمة المرور غير صحيحة";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-lg">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3 shadow-inner">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground mb-2">
              <Lock className="h-3 w-3 text-primary" />
              <span>لوحة التحكم للمشرفين فقط</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              بوابة مشرفي تين ليوا
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
              يرجى تسجيل الدخول باستخدام بيانات المشرف المعرفة في النظام (Env) للوصول إلى إدارة
              الطلبات والمخزون والإعدادات.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs sm:text-sm font-medium text-destructive">
              <KeyRound className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                اسم المستخدم للمشرف (Admin Username / Email)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="admin أو البريد الإلكتروني"
                  className="w-full rounded-xl border border-border bg-background py-2.5 pr-10 pl-4 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                كلمة المرور للمشرف (Admin Password)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-border bg-background py-2.5 pr-10 pl-10 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || !username.trim() || !password.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>جاري التحقق من الصلاحيات...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>دخول المشرف (Admin Login)</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="mt-6 border-t border-border pt-4 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              العودة إلى واجهة المتجر الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
