import { defineConfig } from 'tsup';
import ts from 'typescript';

// tsup's declaration build sets the deprecated `baseUrl`, which TypeScript 6 rejects
// unless `ignoreDeprecations: "6.0"` is set. TypeScript 5 (hoisted in the Scratch
// monorepo) rejects that value, so it can't go in tsconfig.json. Only set it on TS 6+.
const tsMajor = parseInt(ts.version, 10);
const dts = tsMajor >= 6 ? { compilerOptions: { ignoreDeprecations: '6.0' } } : true;

// roslib 2.x is ESM-only (its "exports" has no "require" condition), so we
// inline it to make the CJS build loadable via require(). We produce two
// variants because roslib's deps ship separate Node/browser builds:
//  - dist/          Node build (bridge_tester, scratch-vm node build). ws stays external.
//  - dist/browser/  Browser build (webpack / Scratch). Uses browser builds of
//                   uuid/bson; ws is never loaded since roslib uses native WebSocket.
export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    platform: 'node',
    dts,
    clean: true,
    noExternal: ['roslib'],
    external: ['ws'],
  },
  {
    entry: ['src/index.ts'],
    outDir: 'dist/browser',
    format: ['cjs', 'esm'],
    platform: 'browser',
    clean: false,
    noExternal: ['roslib'],
    external: ['ws'],
  },
]);
