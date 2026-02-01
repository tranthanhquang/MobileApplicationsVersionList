import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const repoName = env.VITE_REPO_NAME || "landingpage";
  const basePath = env.VITE_BASE_PATH || `/${repoName}/`;

  return {
    plugins: [react()],
    base: basePath,
  };
});
