import { Hono } from "hono";

export const todoApi = new Hono();

export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  priority?: "low" | "medium" | "high";
  category?: string;
  dueDate?: string;
  createdAt: string;
}

// In-memory / local fallback store for local development or when service binding is unavailable
const LOCAL_TODOS_STORE: TodoItem[] = [
  {
    id: "todo-1",
    title: "مراجعة شحنات تين ليوا لطلبات اليوم في أبوظبي ودبي",
    completed: false,
    priority: "high",
    category: "عمليات التوصيل",
    createdAt: new Date().toISOString(),
  },
  {
    id: "todo-2",
    title: "تحديث مخزون التين الأحمر الملكي في المتجر",
    completed: true,
    priority: "medium",
    category: "المخزون",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "todo-3",
    title: "إطلاق حملة إعلانية جديدة على تيك توك لتين ليوا المجفف",
    completed: false,
    priority: "medium",
    category: "التسويق",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

// Helper to call the bound Todo_list worker service binding or fallback
async function callTodoService(
  env: any,
  path: string,
  options: RequestInit = {},
): Promise<{
  ok: boolean;
  data: any;
  source: "service_binding" | "local_fallback";
  status?: number;
}> {
  // Check if Todo_list service binding is available in Cloudflare Worker env
  const serviceBinding = env?.Todo_list || env?.TODO_LIST || env?.todo_list;

  if (serviceBinding && typeof serviceBinding.fetch === "function") {
    try {
      const url = `https://todo-service.internal${path}`;
      const response = await serviceBinding.fetch(
        new Request(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
          },
        }),
      );

      const contentType = response.headers.get("content-type") || "";
      let data: any;
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        ok: response.ok,
        data,
        source: "service_binding",
        status: response.status,
      };
    } catch (err) {
      console.warn("[Service Binding Todo_list Error, falling back to local store]:", err);
    }
  }

  // Local fallback implementation
  return {
    ok: true,
    data: null,
    source: "local_fallback",
    status: 200,
  };
}

// 1. GET /api/todos - List all todos
todoApi.get("/", async (c) => {
  const env = c.env as any;
  const result = await callTodoService(env, "/todos", { method: "GET" });

  if (result.source === "service_binding" && result.ok && result.data) {
    const todos = Array.isArray(result.data)
      ? result.data
      : result.data.todos || result.data.items || [];
    return c.json({
      success: true,
      source: "service_binding",
      bindingName: "Todo_list",
      todos,
    });
  }

  return c.json({
    success: true,
    source: "local_fallback",
    bindingName: "Todo_list",
    todos: LOCAL_TODOS_STORE,
  });
});

// 2. POST /api/todos - Create a new todo
todoApi.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { title, priority = "medium", category = "عام", dueDate } = body || {};

    if (!title || typeof title !== "string" || !title.trim()) {
      return c.json({ success: false, error: "Title is required" }, 400);
    }

    const env = c.env as any;
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      completed: false,
      priority,
      category,
      dueDate,
      createdAt: new Date().toISOString(),
    };

    const result = await callTodoService(env, "/todos", {
      method: "POST",
      body: JSON.stringify(newTodo),
    });

    if (result.source === "service_binding" && result.ok && result.data) {
      return c.json({
        success: true,
        source: "service_binding",
        todo: result.data.todo || result.data || newTodo,
      });
    }

    // Add to local fallback store
    LOCAL_TODOS_STORE.unshift(newTodo);

    return c.json({
      success: true,
      source: "local_fallback",
      todo: newTodo,
    });
  } catch (err) {
    return c.json({ success: false, error: String(err) }, 500);
  }
});

// 3. PUT /api/todos/:id/toggle - Toggle completed state
todoApi.put("/:id/toggle", async (c) => {
  const id = c.req.param("id");
  const env = c.env as any;

  const result = await callTodoService(env, `/todos/${id}/toggle`, { method: "PUT" });
  if (result.source === "service_binding" && result.ok) {
    return c.json({ success: true, source: "service_binding", data: result.data });
  }

  const todo = LOCAL_TODOS_STORE.find((t) => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    return c.json({ success: true, source: "local_fallback", todo });
  }

  return c.json({ success: false, error: "Todo not found" }, 404);
});

// 4. DELETE /api/todos/:id - Delete a todo
todoApi.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const env = c.env as any;

  const result = await callTodoService(env, `/todos/${id}`, { method: "DELETE" });
  if (result.source === "service_binding" && result.ok) {
    return c.json({ success: true, source: "service_binding" });
  }

  const index = LOCAL_TODOS_STORE.findIndex((t) => t.id === id);
  if (index !== -1) {
    LOCAL_TODOS_STORE.splice(index, 1);
    return c.json({ success: true, source: "local_fallback" });
  }

  return c.json({ success: false, error: "Todo not found" }, 404);
});

// 5. GET /api/todos/binding-status - Check status of the Todo_list Service Binding
todoApi.get("/binding-status", async (c) => {
  const env = c.env as any;
  const serviceBinding = env?.Todo_list || env?.TODO_LIST || env?.todo_list;
  const isBound = Boolean(serviceBinding && typeof serviceBinding.fetch === "function");

  let pingSuccess = false;
  let pingLatencyMs = 0;
  let pingError: string | null = null;

  if (isBound) {
    const start = Date.now();
    try {
      const res = await serviceBinding.fetch("https://todo-service.internal/health");
      pingLatencyMs = Date.now() - start;
      pingSuccess = res.ok;
    } catch (err: any) {
      pingLatencyMs = Date.now() - start;
      pingError = err?.message || String(err);
    }
  }

  return c.json({
    serviceBinding: "Todo_list",
    isBound,
    pingSuccess,
    pingLatencyMs,
    pingError,
    timestamp: new Date().toISOString(),
    store: "teenliwa",
  });
});
