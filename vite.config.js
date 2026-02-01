import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoName = process.env.VITE_REPO_NAME || "landingpage";
const basePath = process.env.VITE_BASE_PATH || `/${repoName}/`;

export default defineConfig({
  plugins: [react()],
  base: basePath,
});
