import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		setupFiles: ["setup.ts"],
		coverage: {
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"dist/",
				"**/*.d.ts",
				"**/*.test.ts",
				"**/*.test.tsx",
				"**/index.ts",
			],
		},
	},
});
