import { foldkit } from "@foldkit/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), foldkit()],
  server: {
    proxy: {
      "/rpc": "http://localhost:8787",
      "/media": "http://localhost:8787",
    },
  },
});
