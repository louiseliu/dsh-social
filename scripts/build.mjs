import { context, build } from 'esbuild'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const watching = process.argv.includes('--watch')

/** Packages the host can resolve at runtime — externalised from both bundles. */
const dshExternals = [
  ...Object.keys(pkg.peerDependencies ?? {}),
  /^@deepseek-ai\//,
]

/** The browser module loader provides these at runtime via `require`. */
const clientExternals = [
  'react', 'react/jsx-runtime', 'react-dom',
  /^@deepseek-ai\//,
]

// ── Host bundle (ESM, Node) ─────────────────────────────────────────
const hostOptions = {
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  external: dshExternals.filter(e => typeof e === 'string'),
  plugins: [{
    name: 'external-dsh',
    setup(b) {
      b.onResolve({ filter: /^@deepseek-ai\// }, args => ({ path: args.path, external: true }))
    },
  }],
  sourcemap: true,
  logLevel: 'info',
}

// ── Client bundle (CJS, browser, wrapped for __ModuleLoader__) ──────
const clientOptions = {
  entryPoints: ['src/client.ts'],
  outfile: 'lib/client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  jsxImportSource: 'react',
  external: clientExternals.filter(e => typeof e === 'string'),
  plugins: [{
    name: 'external-dsh',
    setup(b) {
      b.onResolve({ filter: /^@deepseek-ai\// }, args => ({ path: args.path, external: true }))
    },
  }],
  banner: {
    js: `window.__ModuleLoader__.load({\n  id: ${JSON.stringify(pkg.name)},\n  factory: (require) => {\n    var module = { exports: {} };\n    var exports = module.exports;\n    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });`,
  },
  footer: {
    js: `    return module.exports;\n  }\n});`,
  },
  sourcemap: true,
  logLevel: 'info',
}

if (watching) {
  const [hostCtx, clientCtx] = await Promise.all([
    context(hostOptions),
    context(clientOptions),
  ])
  await Promise.all([hostCtx.watch(), clientCtx.watch()])
  console.log('👀 watching for changes…')
} else {
  await Promise.all([build(hostOptions), build(clientOptions)])
}
