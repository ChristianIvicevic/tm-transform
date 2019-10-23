import commonjs from "rollup-plugin-commonjs";
import json from "rollup-plugin-json";
import resolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";

/** @type {import("type-fest").PackageJson} */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require("./package.json");

/** @type {import("rollup").RollupOptions} */
const rollupOptions = {
    input: "src/bin/tm-transform.ts",
    output: { file: "./dist/bin/tm-transform.js", format: "cjs", banner: "#!/usr/bin/env node" },
    external: [...Object.keys(pkg.dependencies), "fs", "path"],
    plugins: [
        json({ preferConst: true, namedExports: false }),
        typescript({
            typescript: require("ttypescript"),
            clean: true,
            useTsconfigDeclarationDir: true,
            tsconfig: "./tsconfig.rollup.json",
        }),
        commonjs({
            namedExports: {
                plist: ["build"],
                "vscode-textmate": ["INITIAL", "parseRawGrammar", "Registry"],
            },
        }),
        resolve({ preferBuiltins: true }),
        terser({ sourcemap: false }),
    ],
};

export default rollupOptions;
