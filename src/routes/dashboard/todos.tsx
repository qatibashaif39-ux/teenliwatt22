import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Layers,
  Zap,
  Activity,
  Calendar,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { TodoItem } from "@/api/todos";

export const Route = createFileRoute("/dashboard/todos")({
  component: DashboardTodosPage,
});

async function fetchTodos(): Promise<{
  success: boolean;
  todos: TodoItem[];
  source: string;
  bindingName: string;
}> {
  const res = await fetch("/api/todos");
  if (!res.ok) throw new Error("فشل جلب قائمة المهام");
  return res.json();
}

async function fetchBindingStatus(): Promise<{
  serviceBinding: string;
  isBound: boolean;
  pingSuccess: boolean;
  pingLatencyMs: number;
  pingError: string | null;
}> {
  const res = await fetch("/api/todos/binding-status");
  if (!res.ok) throw new Error("فشل جلب حالة الربط");
  return res.json();
}

async function createTodo(data: {
  title: string;
  priority: "low" | "medium" | "high";
  category: string;
}): Promise<any> {
  const res = await fetch("/api/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("فشل إنشاء المهمة");
  return res.json();
}

async function toggleTodo(id: string): Promise<any> {
  const res = await fetch(`/api/todos/${id}/toggle`, {
    method: "PUT",
  });
  if (!res.ok) throw new Error("فشل تحديث حالة المهمة");
  return res.json();
}

async function deleteTodo(id: string): Promise<any> {
  const res = await fetch(`/api/todos/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("فشل حذف المهمة");
  return res.json();
}

function DashboardTodosPage() {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [category, setCategory] = useState("عمليات المتجر");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const {
    data: todosData,
    isLoading: isTodosLoading,
    refetch: refetchTodos,
  } = useQuery({
    queryKey: ["dashboard", "todos"],
    queryFn: fetchTodos,
  });

  const {
    data: bindingData,
    isLoading: isBindingLoading,
    refetch: refetchBinding,
  } = useQuery({
    queryKey: ["dashboard", "todo-binding-status"],
    queryFn: fetchBindingStatus,
    refetchInterval: 15000,
  });

  const createMutation = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "todos"] });
      setNewTitle("");
      toast.success("تمت إضافة المهمة بنجاح عبر Service Binding");
    },
    onError: (err: any) => {
      toast.error(err.message || "حدث خطأ أثناء إضافة المهمة");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "todos"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "حدث خطأ أثناء التحديث");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "todos"] });
      toast.success("تم حذف المهمة بنجاح");
    },
    onError: (err: any) => {
      toast.error(err.message || "حدث خطأ أثناء الحذف");
    },
  });

  const todos = todosData?.todos || [];
  const source = todosData?.source || "local_fallback";
  const isServiceBindingActive = bindingData?.isBound;

  const filteredTodos = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const completedCount = todos.filter((t) => t.completed).length;
  const activeCount = todos.length - completedCount;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createMutation.mutate({
      title: newTitle.trim(),
      priority,
      category,
    });
  };

  const priorityColors = {
    high: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
    medium:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    low: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  };

  const priorityLabels = {
    high: "عاجلة",
    medium: "متوسطة",
    low: "منخفضة",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              قائمة مهام المتجر (Todo_list)
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <Zap className="h-3 w-3" /> Service Binding
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            إدارة مهام وعمليات المتجر عبر ربط الخدمات السحابي (Cloudflare Worker Service Binding:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-bold">
              Todo_list
            </code>
            )
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetchTodos();
              refetchBinding();
              toast.info("جاري تحديث البيانات من الـ Service Binding...");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold shadow-xs hover:bg-secondary transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            تحديث
          </button>
        </div>
      </div>

      {/* Cloudflare Service Binding Status Card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">
                  حالة ارتباط الخدمة (Worker Service Binding):
                </span>
                <span className="font-mono text-xs font-extrabold text-primary">env.Todo_list</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                يربط مباشرة بين Worker متجر تين ليوا وخدمة Todo_list في كلاودفلير بأداء Edge فائق
                وسرعة بدون overhead شبكي خارجي.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 font-bold">
              {isServiceBindingActive ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700 dark:text-emerald-400">
                    مرتبط في Cloudflare (Active)
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-blue-700 dark:text-blue-400">
                    محاكي محلي (Local / Hybrid Ready)
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 font-bold">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <span>
                المصدر: {source === "service_binding" ? "Service Binding ⚡" : "Local Store 🔄"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">إجمالي المهام</span>
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{todos.length}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">المهام المتبقية</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{activeCount}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">المهام المكتملة</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{completedCount}</p>
        </div>
      </div>

      {/* Add Todo Form */}
      <form onSubmit={handleAdd} className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h2 className="text-sm font-extrabold text-foreground mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" /> إضافة مهمة تشغيلية جديدة
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="sm:col-span-6">
            <input
              type="text"
              placeholder="اكتب عنوان المهمة (مثال: تجهيز 50 صندوق تين فاخر لشحنات دبي)..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium focus:border-primary focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-hidden"
            >
              <option value="عمليات المتجر">عمليات المتجر</option>
              <option value="المخزون">المخزون</option>
              <option value="التوصيل">التوصيل</option>
              <option value="التسويق">التسويق</option>
              <option value="خدمة العملاء">خدمة العملاء</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-hidden"
            >
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عاجلة ⚡</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={createMutation.isPending || !newTitle.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              إضافة
            </button>
          </div>
        </div>
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
            filter === "all"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          الكل ({todos.length})
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
            filter === "active"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          قيد التنفيذ ({activeCount})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
            filter === "completed"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          المكتملة ({completedCount})
        </button>
      </div>

      {/* Todo List Items */}
      {isTodosLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredTodos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-base font-bold text-foreground">لا توجد مهام في هذه القائمة</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            أضف مهام جديدة لتنظيم وإدارة عمليات تين ليوا عبر الـ Service Binding.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className={`group flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs transition-all hover:border-primary/40 ${
                todo.completed ? "opacity-60 bg-muted/20" : ""
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  onClick={() => toggleMutation.mutate(todo.id)}
                  className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                >
                  {todo.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/10" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>

                <div className="min-w-0">
                  <p
                    className={`text-sm font-bold text-foreground truncate ${
                      todo.completed ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {todo.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    {todo.category && (
                      <span className="rounded-md bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground">
                        {todo.category}
                      </span>
                    )}
                    {todo.priority && (
                      <span
                        className={`rounded-md border px-2 py-0.5 font-bold ${
                          priorityColors[todo.priority]
                        }`}
                      >
                        {priorityLabels[todo.priority]}
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(todo.createdAt).toLocaleDateString("ar-AE")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => deleteMutation.mutate(todo.id)}
                  disabled={deleteMutation.isPending}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors opacity-80 group-hover:opacity-100"
                  title="حذف المهمة"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
