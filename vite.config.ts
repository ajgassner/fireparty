import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// BASE_PATH is set by the GitHub Pages workflow (e.g. "/fireparty/")
export default defineConfig({
	base: process.env.BASE_PATH ?? "/",
	build: { chunkSizeWarningLimit: 2000 }, // exports (pdfmake, exceljs) are lazy-loaded chunks
	plugins: [
		react(),
		tailwindcss(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["favicon.svg"],
			manifest: {
				name: "FireParty",
				short_name: "FireParty",
				description: "Einteilungsplan für Feste – Personen, Standorte, Schichten.",
				lang: "de",
				theme_color: "#c2332c",
				background_color: "#fafaf9",
				display: "standalone",
				icons: [{ src: "favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,svg,woff2}"],
				maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
			},
		}),
	],
});
