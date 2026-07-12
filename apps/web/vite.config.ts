import { foldkit } from "@foldkit/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), foldkit()],
  server: {
    proxy: {
      "/rpc": "http://localhost:3000",
      "/media": "http://localhost:3000",
    },
  },
});
