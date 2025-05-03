import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
	},
	format: ["cjs", "esm"],
	dts: true,
	// テストファイルをビルドから除外
	ignoreWatch: ["**/*.test.ts", "**/*.test.tsx"],
	onSuccess: "tsc --noEmit",
});
