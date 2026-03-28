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
            name: "unusedname",
            entry: ["src/index.ts"]
        },
        outDir: "./dist/"
    }
})