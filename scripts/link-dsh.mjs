// Links the @deepseek-ai packages of an installed DSH into ./node_modules so
// the plugin can be type-checked; at runtime the host provides them.
// Usage: DSH_NODE_MODULES=/path/to/node_modules node scripts/link-dsh.mjs
import { existsSync, mkdirSync, readdirSync, rmSync, symlinkSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

function findDshNodeModules() {
  if (process.env.DSH_NODE_MODULES) return process.env.DSH_NODE_MODULES
  const npxRoot = join(homedir(), '.npm', '_npx')
  if (!existsSync(npxRoot)) return undefined
  for (const entry of readdirSync(npxRoot)) {
    const candidate = join(npxRoot, entry, 'node_modules')
    if (existsSync(join(candidate, '@deepseek-ai', 'dsh'))) return candidate
  }
  return undefined
}

const source = findDshNodeModules()
if (source === undefined) {
  console.error('未找到 DSH 安装。先运行一次 `npx @deepseek-ai/dsh web`，或设置 DSH_NODE_MODULES。')
  process.exit(1)
}

const scopeDir = join(process.cwd(), 'node_modules', '@deepseek-ai')
mkdirSync(scopeDir, { recursive: true })
let count = 0
for (const name of readdirSync(join(source, '@deepseek-ai'))) {
  const target = join(scopeDir, name)
  rmSync(target, { recursive: true, force: true })
  symlinkSync(join(source, '@deepseek-ai', name), target, 'dir')
  count++
}
console.log(`已链接 ${count} 个 @deepseek-ai 包，来源：${source}`)
