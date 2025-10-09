import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
    // Set base path for GitHub Pages deployment
    base: "/LifeOS/",
    plugins: [react(), tailwindcss()],
    build: {
        outDir: "build",
        // Optimize chunk splitting
        rollupOptions: {
            output: {
                manualChunks: {
                    // React core
                    "react-vendor": ["react", "react-dom", "react/jsx-runtime"],

                    // Router
                    router: ["react-router-dom"],

                    // UI libraries
                    "radix-ui": [
                        "@radix-ui/react-dialog",
                        "@radix-ui/react-dropdown-menu",
                        "@radix-ui/react-label",
                        "@radix-ui/react-popover",
                        "@radix-ui/react-progress",
                        "@radix-ui/react-scroll-area",
                        "@radix-ui/react-select",
                        "@radix-ui/react-separator",
                        "@radix-ui/react-slot",
                        "@radix-ui/react-switch",
                        "@radix-ui/react-tabs",
                    ],

                    // DnD Kit
                    "dnd-kit": [
                        "@dnd-kit/core",
                        "@dnd-kit/sortable",
                        "@dnd-kit/utilities",
                    ],

                    // Charts and visualizations
                    charts: ["recharts", "react-confetti"],

                    // Utilities
                    utils: ["date-fns", "lucide-react"],
                },
            },
        },
        // Increase chunk size warning limit to 1000 kB (optional)
        chunkSizeWarningLimit: 1000,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
