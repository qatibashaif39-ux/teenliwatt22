export function renderErrorPage(errorDetails?: string): string {
  return `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>تعذر تحميل الصفحة - تين ليوا</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@400;600;700&display=swap" rel="stylesheet" />
    <style>
      :root {
        --background: #0f172a;
        --card: #1e293b;
        --text: #f8fafc;
        --muted: #94a3b8;
        --primary: #10b981;
        --primary-hover: #059669;
        --border: #334155;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: 'Alexandria', system-ui, -apple-system, sans-serif;
        background-color: var(--background);
        color: var(--text);
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 1.5rem;
        text-align: center;
      }
      .card {
        background-color: var(--card);
        border: 1px solid var(--border);
        border-radius: 1.25rem;
        max-width: 32rem;
        width: 100%;
        padding: 2.5rem 2rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
      }
      .logo {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 4rem;
        height: 4rem;
        border-radius: 1rem;
        background: rgba(16, 185, 129, 0.1);
        color: var(--primary);
        font-size: 2rem;
        margin-bottom: 1.25rem;
      }
      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 0.75rem;
        color: #fff;
      }
      p {
        color: var(--muted);
        font-size: 0.95rem;
        line-height: 1.6;
        margin-bottom: 1.75rem;
      }
      .actions {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
        flex-wrap: wrap;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.75rem 1.5rem;
        border-radius: 0.75rem;
        font-size: 0.95rem;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        text-decoration: none;
        transition: all 0.2s ease;
      }
      .btn-primary {
        background-color: var(--primary);
        color: #ffffff;
        border: none;
      }
      .btn-primary:hover {
        background-color: var(--primary-hover);
        transform: translateY(-1px);
      }
      .btn-secondary {
        background-color: transparent;
        color: var(--text);
        border: 1px solid var(--border);
      }
      .btn-secondary:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }
      .details {
        margin-top: 1.5rem;
        padding: 0.75rem;
        border-radius: 0.5rem;
        background: rgba(0, 0, 0, 0.2);
        color: #ef4444;
        font-size: 0.8rem;
        text-align: left;
        direction: ltr;
        overflow-x: auto;
      }
    </style>
  </head>
  <body>
    <div class="card" id="error-fallback-card">
      <div class="logo">🌿</div>
      <h1>تعذر تحميل الصفحة</h1>
      <p>حدث خطأ غير متوقع أثناء معالجة طلبكم. يرجى إعادة المحاولة أو العودة إلى الصفحة الرئيسية لمتجر تين ليوا.</p>
      <div class="actions">
        <button class="btn btn-primary" id="retry-button" onclick="location.reload()">إعادة المحاولة</button>
        <a class="btn btn-secondary" id="home-button" href="/">الرئيسية</a>
      </div>
      ${errorDetails ? `<pre class="details"><code>${errorDetails.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>` : ""}
    </div>
  </body>
</html>`;
}
