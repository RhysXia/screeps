import dotenv from "dotenv";
import clear from "rollup-plugin-clear";
import screeps from "rollup-plugin-screeps";
import typescript2 from "rollup-plugin-typescript2";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import copy from "rollup-plugin-copy";
import fs from "fs";

const { error } = dotenv.config({
  override: true,
  path: [".env", fs.existsSync('.env.local') && ".env.local"].filter(Boolean),
});

if (error) {
  console.error(error);
}

const target = process.env.TARGET;

const deployPlugins = [];

if (target === "DEPLOY") {
  deployPlugins.push(
    screeps({
      config: {
        token: process.env.TOKEN,
        protocol: process.env.PROTOCOL || "https",
        hostname: process.env.HOSTNAME || "screeps.com",
        port: parseInt(process.env.PORT) || 443,
        path: "/",
        branch: process.env.BRANCH || "auto",
      },
      dryRun: false,
    })
  );
} else if (target) {
  if (!fs.statSync(target).isDirectory()) {
    console.error(`Could not find dir ${target}`);
  } else {
    deployPlugins.push(
      copy({
        hook: 'writeBundle',
        verbose: true,
        targets: [
          {
            src: "dist/main.js",
            dest: target,
          },
          {
            src: "dist/main.js.map",
            dest: target,
            rename: (name) => name + ".map.js",
            transform: (contents) => `module.exports = ${contents.toString()};`,
          },
        ],
      })
    );
  }
}

/** @type {import('rollup').RollupOptions} */
export default {
  input: "src/main.ts",
  output: {
    file: "dist/main.js",
    format: "cjs",
    sourcemap: true,
  },
  plugins: [
    clear({ targets: ["dist"] }),
    resolve(),
    commonjs(),
    typescript2({
      tsconfig: "./tsconfig.json",
    }),
    ...deployPlugins,
  ],
};
