import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import apiClientPlugin from "./vite-plugin-api-client.js";

export default defineConfig({
  plugins: [react(), tailwindcss(), apiClientPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
