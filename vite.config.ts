import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
      client: { entry: "client" },
    }),
    ...(command === "build"
      ? [
          nitro({
            preset: process.env.NITRO_PRESET || "cloudflare-module",
            output: {
              dir: "dist",
              serverDir: "dist/server",
              publicDir: "dist/client",
            },
            cloudflare: {
              nodeCompat: true,
            },
          }),
        ]
      : []),
    react({
      jsxRuntime: "automatic",
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
}));
