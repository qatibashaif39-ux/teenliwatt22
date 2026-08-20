import { Hono } from "hono";

export const authApi = new Hono();

// Helper to generate a basic session token
function generateSessionToken(username: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const data = `${username}:${timestamp}:${random}`;
  // Base64 encoding for standard session string
  if (typeof btoa === "function") {
    return btoa(data);
  }
  return Buffer.from(data).toString("base64");
}

// 1. POST /api/auth/login - Authenticate admin supervisor
authApi.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const { username, password, email } = body || {};

    const inputUser = (username || email || "").trim();
    const inputPass = (password || "").trim();

    if (!inputUser || !inputPass) {
      return c.json(
        {
          success: false,
          error: "يرجى إدخال اسم المستخدم وكلمة المرور للمشرف",
        },
        400,
      );
    }

    const env = (c.env as Record<string, string> | undefined) || {};

    // Environment variables for Admin Credentials
    const expectedUsername = (
      env.ADMIN_USERNAME ||
      process.env.ADMIN_USERNAME ||
      env.ADMIN_EMAIL ||
      process.env.ADMIN_EMAIL ||
      "admin"
    ).trim();

    const expectedPassword = (
      env.ADMIN_PASSWORD ||
      process.env.ADMIN_PASSWORD ||
      "admin123456"
    ).trim();

    // Check credentials (supports username match, email match, or default admin alias)
    const isUsernameMatch =
      inputUser.toLowerCase() === expectedUsername.toLowerCase() ||
      (expectedUsername === "admin" &&
        (inputUser.toLowerCase() === "admin" || inputUser.toLowerCase() === "admin@teenliwa.com"));

    const isPasswordMatch = inputPass === expectedPassword;

    if (!isUsernameMatch || !isPasswordMatch) {
      return c.json(
        {
          success: false,
          error: "بيانات الدخول غير صحيحة. يرجى التحقق من اسم المستخدم وكلمة المرور للمشرف.",
        },
        401,
      );
    }

    const token = generateSessionToken(inputUser);
    const user = {
      id: "admin-1",
      username: inputUser,
      email: inputUser.includes("@") ? inputUser : `${inputUser}@teenliwa.com`,
      role: "admin",
      name: "مشرف متجر تين ليوا",
    };

    return c.json({
      success: true,
      token,
      user,
      message: "تم تسجيل الدخول بنجاح كـ مشرف",
    });
  } catch (err) {
    console.error("[Auth Login Error]:", err);
    return c.json(
      {
        success: false,
        error: "حدث خطأ أثناء معالجة تسجيل الدخول",
      },
      500,
    );
  }
});

// 2. POST /api/auth/verify - Verify session token
authApi.post("/verify", async (c) => {
  try {
    const authHeader = c.req.header("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim();

    if (!token) {
      return c.json({ success: false, authenticated: false }, 401);
    }

    let decoded = "";
    try {
      if (typeof atob === "function") {
        decoded = atob(token);
      } else {
        decoded = Buffer.from(token, "base64").toString("utf8");
      }
    } catch {
      return c.json({ success: false, authenticated: false }, 401);
    }

    const [username, timestampStr] = decoded.split(":");
    const timestamp = Number(timestampStr);

    // Session valid for 7 days
    const isExpired = Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000;

    if (!username || !timestamp || isExpired) {
      return c.json({ success: false, authenticated: false, error: "انتهت صلاحية الجلسة" }, 401);
    }

    return c.json({
      success: true,
      authenticated: true,
      user: {
        id: "admin-1",
        username,
        email: username.includes("@") ? username : `${username}@teenliwa.com`,
        role: "admin",
        name: "مشرف متجر تين ليوا",
      },
    });
  } catch (err) {
    return c.json({ success: false, authenticated: false }, 500);
  }
});

export function verifyAdminAuth(c: any): boolean {
  try {
    const authHeader = c.req.header("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim();

    if (!token) return false;

    let decoded = "";
    if (typeof atob === "function") {
      decoded = atob(token);
    } else {
      decoded = Buffer.from(token, "base64").toString("utf8");
    }

    const [username, timestampStr] = decoded.split(":");
    const timestamp = Number(timestampStr);
    const isExpired = Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000;

    return Boolean(username && timestamp && !isExpired);
  } catch {
    return false;
  }
}

// 3. POST /api/auth/logout - Logout session
authApi.post("/logout", (c) => {
  return c.json({
    success: true,
    message: "تم تسجيل الخروج بنجاح",
  });
});
