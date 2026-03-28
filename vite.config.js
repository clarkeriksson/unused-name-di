/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
    plugins: [
        dts({
            tsconfigPath: "./tsconfig.json",
            entryRoot: "src",
            outDir: "dist"
        })
    ],
    build: {
        lib: {
            formats: ["es"],
            entry: ["src/index.ts"]
        },
        outDir: "./dist/"
    },
    test: {
        "environment": "node",
        include: ["*.test.ts"],
        dir: "src"
    }
})