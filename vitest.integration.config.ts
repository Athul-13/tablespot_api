import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.integration.spec.ts"],
    exclude: ["node_modules", "dist"],
    testTimeout: 10000,
    env: { NODE_ENV: "test" },
    globalSetup: [path.resolve(__dirname, "src/test/global-setup.ts")],
    setupFiles: [path.resolve(__dirname, "src/test/setup.ts")],
    fileParallelism: false,
    sequence: { concurrent: false },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/config": path.resolve(__dirname, "./src/config"),
      "@/controllers": path.resolve(__dirname, "./src/controllers"),
      "@/models": path.resolve(__dirname, "./src/models"),
      "@/repositories": path.resolve(__dirname, "./src/repositories"),
      "@/services": path.resolve(__dirname, "./src/services"),
      "@/middleware": path.resolve(__dirname, "./src/middleware"),
      "@/routes": path.resolve(__dirname, "./src/routes"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/types": path.resolve(__dirname, "./src/types"),
      "@/di": path.resolve(__dirname, "./src/di"),
    },
  },
});
