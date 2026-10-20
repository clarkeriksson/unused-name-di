/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
	plugins: [
		dts({
			tsconfigPath: "./tsconfig.build.json",
			entryRoot: "src",
			outDir: "dist",
		}),
	],
	build: {
		lib: {
			entry: ["src/index.ts"],
			formats: ["es"],
		},
		outDir: "./dist/",
		rolldownOptions: {
			output: {
				comments: false,
				minify: {
					compress: true,
				},
			},
		},
	},
	test: {
		environment: "node",
		dir: "tests",
		setupFiles: ["tests/setup.ts"],
		typecheck: {
			enabled: true,
			include: ["**/*.test-d.ts"],
		},
		benchmark: {
			include: ["benchmarks/**/*.bench.ts"],
		},
		coverage: {
			provider: "v8",
		},
	},
});
