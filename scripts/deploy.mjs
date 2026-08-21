import { execSync } from "child_process";
import fs from "fs";

// Read .env if exists
let envVars = { ...process.env };
try {
  if (fs.existsSync(".env")) {
    const envContent = fs.readFileSync(".env", "utf8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        envVars[key] = value;
      }
    });
  }
} catch (e) {
  console.warn("Could not parse .env file:", e);
}

const token =
  envVars.CLOUDFLARE_API_TOKEN ||
  envVars.VITE_CLOUDFLARE_API_TOKEN ||
  process.env.CLOUDFLARE_API_TOKEN;
const accountId =
  envVars.CLOUDFLARE_ACCOUNT_ID ||
  envVars.VITE_CLOUDFLARE_ACCOUNT_ID ||
  process.env.CLOUDFLARE_ACCOUNT_ID;
const apiKey = envVars.CLOUDFLARE_GLOBAL_API_KEY || envVars.VITE_CLOUDFLARE_GLOBAL_API_KEY || process.env.CLOUDFLARE_GLOBAL_API_KEY;
const email = envVars.CLOUDFLARE_EMAIL || envVars.VITE_CLOUDFLARE_EMAIL || process.env.CLOUDFLARE_EMAIL;

console.log("Checking Cloudflare Deployment Credentials...");
console.log("- Token present:", !!token);
console.log("- Account ID present:", !!accountId);
console.log("- Global API Key present:", !!apiKey);
console.log("- Email present:", !!email);

const deployEnv = {
  R2_ACCESS_KEY_ID:
    envVars.R2_ACCESS_KEY_ID ||
    envVars.AWS_ACCESS_KEY_ID ||
    process.env.R2_ACCESS_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID ||
    "",
  R2_SECRET_ACCESS_KEY:
    envVars.R2_SECRET_ACCESS_KEY ||
    envVars.AWS_SECRET_ACCESS_KEY ||
    process.env.R2_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    "",
  R2_ACCOUNT_ID:
    envVars.R2_ACCOUNT_ID ||
    envVars.CLOUDFLARE_ACCOUNT_ID ||
    process.env.R2_ACCOUNT_ID ||
    process.env.CLOUDFLARE_ACCOUNT_ID ||
    "",
  R2_BUCKET_NAME:
    envVars.R2_BUCKET_NAME ||
    envVars.S3_BUCKET_NAME ||
    process.env.R2_BUCKET_NAME ||
    process.env.S3_BUCKET_NAME ||
    "bt-liwa",
  ...envVars,
  ...process.env,
};

if (token) {
  deployEnv.CLOUDFLARE_API_TOKEN = token;
}
if (accountId) {
  deployEnv.CLOUDFLARE_ACCOUNT_ID = accountId;
}
if (apiKey) {
  deployEnv.CLOUDFLARE_API_KEY = apiKey;
}
if (email) {
  deployEnv.CLOUDFLARE_EMAIL = email;
}

try {
  console.log("\nBuilding project...");
  execSync("npm run build", { stdio: "inherit", env: deployEnv });

  if (fs.existsSync("dist/server/index.mjs")) {
    let indexContent = fs.readFileSync("dist/server/index.mjs", "utf8");
    indexContent =
      `import ssrService from "./_ssr/ssr.mjs";\nimport ssrRenderer from "./_chunks/ssr-renderer.mjs";\n` +
      indexContent;
    indexContent = indexContent.replace(
      /var services = \{ \["ssr"\]: lazyService\(\(\) => import\("\.\/_ssr\/ssr\.mjs"\)\) \};/g,
      `var services = { ["ssr"]: ssrService };`,
    );
    indexContent = indexContent.replace(
      /var _lazy_\w+ = defineLazyEventHandler\(\(\) => import\("\.\/_chunks\/ssr-renderer\.mjs"\)\);/g,
      `var _lazy_0jRgqU = ssrRenderer;`,
    );
    // Directly delegate fetch to ssrService bypassing H3 response wrapper issues in Cloudflare runtime
    indexContent = indexContent.replace(
      /var cloudflare_module_default = createHandler\([\s\S]*?\n\}\s*\}\);\n/g,
      `var cloudflare_module_default = {
  async fetch(cfRequest, env, context) {
    try {
      const url = new URL(cfRequest.url);
      if (env && env.ASSETS && typeof isPublicAssetURL === "function" && isPublicAssetURL(url.pathname)) {
        const assetRes = await env.ASSETS.fetch(cfRequest);
        if (assetRes && (assetRes.status < 400 || assetRes.status === 304)) {
          return assetRes;
        }
      }
      return await ssrService.fetch(cfRequest, env, context);
    } catch (e) {
      console.error("[Cloudflare Worker Top-Level Error]:", e);
      return new Response("Internal Server Error: " + (e?.message || e), { status: 500 });
    }
  }
};
`,
    );
    fs.writeFileSync("dist/server/index.mjs", indexContent);
    console.log(
      "Patched dist/server/index.mjs with direct ssrService handler for Cloudflare Workers.",
    );

    console.log("\nBundling complete server into dist/server/worker.mjs...");
    execSync(
      "npx esbuild dist/server/index.mjs --bundle --platform=neutral --target=es2022 --format=esm --external:node:* --external:cloudflare:* --outfile=dist/server/worker.mjs",
      {
        stdio: "inherit",
      },
    );

    // Inject error catching and duck-typed Response handler in worker.mjs
    let workerContent = fs.readFileSync("dist/server/worker.mjs", "utf8");
    workerContent = workerContent.replace(
      /return toResponse\(attachResponseHeaders\(eventStorage\.run\(\{ h3Event \}, \(\) => handler2\(request, requestOpts\)\), h3Event\), h3Event\);/g,
      `return Promise.resolve(eventStorage.run({ h3Event }, async () => {
        try {
          const res = await handler2(request, requestOpts);
          if (res && (res instanceof Response || (typeof res === "object" && typeof res.status === "number" && res.headers))) {
            return res;
          }
          return res;
        } catch (err) {
          console.error("[TanStack Start Handler Error]:", err);
          return new Response("TanStack Start Error: " + (err?.message || err) + "\\n" + (err?.stack || ""), {
            status: 500,
            headers: { "content-type": "text/plain; charset=utf-8" }
          });
        }
      })).then((res) => {
        if (res && (res instanceof Response || (typeof res === "object" && typeof res.status === "number" && res.headers))) {
          return res;
        }
        return toResponse(attachResponseHeaders(res, h3Event), h3Event);
      });`,
    );
    fs.writeFileSync("dist/server/worker.mjs", workerContent);
    console.log("Successfully generated and instrumented standalone dist/server/worker.mjs");
  }

  if (fs.existsSync("dist/server/wrangler.json")) {
    const wranglerConfig = JSON.parse(fs.readFileSync("dist/server/wrangler.json", "utf8"));
    wranglerConfig.name = "teenliwatt2";
    wranglerConfig.main = "worker.mjs";
    delete wranglerConfig.no_bundle;
    delete wranglerConfig.rules;
    if (wranglerConfig.assets) {
      wranglerConfig.assets.not_found_handling = "none";
    }
    wranglerConfig.vars = wranglerConfig.vars || {};
    if (deployEnv.GEMINI_API_KEY) {
      wranglerConfig.vars.GEMINI_API_KEY = deployEnv.GEMINI_API_KEY;
    }
    wranglerConfig.vars.ADMIN_USERNAME = deployEnv.ADMIN_USERNAME || "admin";
    wranglerConfig.vars.ADMIN_PASSWORD = deployEnv.ADMIN_PASSWORD || "admin123456";
    if (deployEnv.ZIINA_API_KEY || deployEnv.ZIINA_API_TOKEN) {
      wranglerConfig.vars.ZIINA_API_KEY = (
        deployEnv.ZIINA_API_KEY ||
        deployEnv.ZIINA_API_TOKEN ||
        ""
      ).trim();
    }
    if (deployEnv.ZIINA_TEST_MODE) {
      wranglerConfig.vars.ZIINA_TEST_MODE = deployEnv.ZIINA_TEST_MODE;
    }
    if (deployEnv.SITE_DOMAIN) {
      wranglerConfig.vars.SITE_DOMAIN = deployEnv.SITE_DOMAIN;
    }
    // Forward R2 / S3 Object Storage credentials
    if (deployEnv.R2_ACCESS_KEY_ID || deployEnv.AWS_ACCESS_KEY_ID || deployEnv.S3_ACCESS_KEY_ID) {
      wranglerConfig.vars.R2_ACCESS_KEY_ID = (
        deployEnv.R2_ACCESS_KEY_ID ||
        deployEnv.AWS_ACCESS_KEY_ID ||
        deployEnv.S3_ACCESS_KEY_ID
      ).trim();
    }
    if (
      deployEnv.R2_SECRET_ACCESS_KEY ||
      deployEnv.AWS_SECRET_ACCESS_KEY ||
      deployEnv.S3_SECRET_ACCESS_KEY
    ) {
      wranglerConfig.vars.R2_SECRET_ACCESS_KEY = (
        deployEnv.R2_SECRET_ACCESS_KEY ||
        deployEnv.AWS_SECRET_ACCESS_KEY ||
        deployEnv.S3_SECRET_ACCESS_KEY
      ).trim();
    }
    const rawBucketName = (
      deployEnv.R2_BUCKET_NAME ||
      deployEnv.S3_BUCKET_NAME ||
      deployEnv.BT_LIWA ||
      "bt-liwa"
    ).trim();
    const bucketName =
      rawBucketName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/^-+|-+$/g, "") || "bt-liwa";
    wranglerConfig.vars.R2_BUCKET_NAME = bucketName;

    if (deployEnv.R2_ACCOUNT_ID) {
      wranglerConfig.vars.R2_ACCOUNT_ID = deployEnv.R2_ACCOUNT_ID.trim();
    }
    if (deployEnv.R2_PUBLIC_URL) {
      wranglerConfig.vars.R2_PUBLIC_URL = deployEnv.R2_PUBLIC_URL.trim();
    }

    delete wranglerConfig.d1_databases;
    wranglerConfig.r2_buckets = [
      {
        binding: "BT_LIWA",
        bucket_name: bucketName,
      },
    ];
    wranglerConfig.services = [
      {
        binding: "Todo_list",
        service: "to-do-list-kv-template",
        environment: "production",
      },
    ];
    fs.writeFileSync("dist/server/wrangler.json", JSON.stringify(wranglerConfig, null, 2));
    console.log(
      "Configured dist/server/wrangler.json (main = worker.mjs, assets.not_found_handling = none)",
    );
  }

  console.log("\nDeploying to Cloudflare Workers via Wrangler using Nitro config...");
  execSync("npx wrangler deploy --config dist/server/wrangler.json", {
    stdio: "inherit",
    env: deployEnv,
  });
  console.log("\nWorker deployment completed successfully!");
} catch (error) {
  console.log("\nTrying fallback to Cloudflare Pages deploy...");
  try {
    execSync("npx wrangler pages deploy dist/client --project-name teenliwatt2", {
      stdio: "inherit",
      env: deployEnv,
    });
    console.log("\nPages deployment completed successfully!");
  } catch (pagesError) {
    console.error("\nDeployment failed:", error.message || pagesError.message);
    process.exit(1);
  }
}
