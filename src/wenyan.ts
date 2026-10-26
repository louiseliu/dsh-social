/**
 * Wenyan CLI Bridge — wraps the `wenyan` CLI for WeChat Official Account
 * (微信公众号) operations: Markdown rendering & publishing.
 *
 * @wenyan-md/cli converts Markdown to beautifully formatted WeChat HTML
 * and publishes directly to the WeChat drafts box via the official API.
 *
 * Prerequisites:
 *   - npm install -g @wenyan-md/cli
 *   - WECHAT_APP_ID and WECHAT_APP_SECRET env vars
 *   - IP whitelist on WeChat backend (or use wenyan server mode)
 */

import { execFile } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { writeFile, unlink, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

const exec = promisify(execFile)

function shellEnv(): NodeJS.ProcessEnv {
  const home = homedir()
  const extraPaths = [
    join(home, '.nvm/versions/node', process.version, 'bin'),
    join(home, '.local/bin'),
    '/opt/homebrew/bin',
    '/usr/local/bin',
  ]
  const existing = process.env.PATH ?? ''
  return { ...process.env, PATH: [...extraPaths, existing].join(':') }
}

// ─── Types ───────────────────────────────────────────────────────────

export interface WenyanPublishResult {
  success: boolean
  mediaId?: string
  message?: string
  output: string
}

export interface WenyanRenderResult {
  html: string
  output: string
}

export interface WenyanOptions {
  bin?: string
  timeoutMs?: number
}

// ─── Bridge ──────────────────────────────────────────────────────────

export class WenyanBridge {
  private readonly bin: string
  private readonly timeoutMs: number
  private _available: boolean | null = null
  private _checkedAt = 0

  constructor(opts: WenyanOptions = {}) {
    this.bin = opts.bin ?? 'wenyan'
    this.timeoutMs = opts.timeoutMs ?? 120_000
  }

  /** Check if wenyan CLI is installed. Caches true permanently, false for 30s. */
  async isAvailable(): Promise<boolean> {
    if (this._available === true) return true
    if (this._available === false && Date.now() - this._checkedAt < 30_000) return false
    try {
      await exec(this.bin, ['--version'], { timeout: 10_000, env: shellEnv() })
      this._available = true
    } catch {
      this._available = false
    }
    this._checkedAt = Date.now()
    return this._available
  }

  /** Check if WeChat credentials are configured. */
  isWechatConfigured(): boolean {
    return !!(process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET)
  }

  /**
   * Render Markdown to WeChat-compatible HTML using wenyan.
   * Returns the rendered HTML string.
   */
  async render(markdown: string, opts?: {
    theme?: string
  }): Promise<WenyanRenderResult> {
    const available = await this.isAvailable()
    if (!available) {
      throw new Error('wenyan CLI 未安装。请运行: npm install -g @wenyan-md/cli')
    }

    const tmpDir = await mkdtemp(join(tmpdir(), 'dsh-wenyan-'))
    const mdPath = join(tmpDir, 'article.md')
    const htmlPath = join(tmpDir, 'article.html')

    try {
      await writeFile(mdPath, markdown, 'utf8')

      const args = ['render', '-f', mdPath, '-o', htmlPath]
      if (opts?.theme) {
        args.push('--theme', opts.theme)
      }

      const { stdout, stderr } = await exec(this.bin, args, {
        timeout: this.timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
        env: shellEnv(),
      })

      const { readFile } = await import('node:fs/promises')
      const html = await readFile(htmlPath, 'utf8')

      return { html, output: stdout + stderr }
    } finally {
      await unlink(mdPath).catch(() => undefined)
      await unlink(htmlPath).catch(() => undefined)
    }
  }

  /**
   * Publish Markdown content to WeChat Official Account drafts box.
   * Requires WECHAT_APP_ID and WECHAT_APP_SECRET env vars.
   *
   * The markdown should include frontmatter:
   * ---
   * title: 文章标题
   * cover: /path/to/cover.jpg  (optional)
   * author: 作者名  (optional)
   * ---
   */
  async publish(markdown: string, opts?: {
    theme?: string
    appId?: string
    envFile?: string
  }): Promise<WenyanPublishResult> {
    const available = await this.isAvailable()
    if (!available) {
      throw new Error('wenyan CLI 未安装。请运行: npm install -g @wenyan-md/cli')
    }

    if (!this.isWechatConfigured() && !opts?.envFile) {
      throw new Error('未配置微信公众号凭据。请设置 WECHAT_APP_ID 和 WECHAT_APP_SECRET 环境变量。')
    }

    const tmpDir = await mkdtemp(join(tmpdir(), 'dsh-wenyan-'))
    const mdPath = join(tmpDir, 'article.md')

    try {
      await writeFile(mdPath, markdown, 'utf8')

      const args = ['publish', '-f', mdPath]
      if (opts?.theme) {
        args.push('--theme', opts.theme)
      }
      if (opts?.appId) {
        args.push('--app-id', opts.appId)
      }
      if (opts?.envFile) {
        args.push(`--env-file=${opts.envFile}`)
      }

      const { stdout, stderr } = await exec(this.bin, args, {
        timeout: this.timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
        env: shellEnv(),
      })

      const output = stdout + stderr
      const mediaIdMatch = output.match(/media_id[:\s]+(\S+)/i)

      return {
        success: true,
        mediaId: mediaIdMatch?.[1],
        message: '已推送到公众号草稿箱',
        output,
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        message: msg,
        output: msg,
      }
    } finally {
      await unlink(mdPath).catch(() => undefined)
    }
  }

  /** List available themes. */
  async listThemes(): Promise<string[]> {
    const available = await this.isAvailable()
    if (!available) return []
    try {
      const { stdout } = await exec(this.bin, ['theme', 'list'], {
        timeout: 10_000,
        env: shellEnv(),
      })
      return stdout.trim().split('\n').map(s => s.trim()).filter(Boolean)
    } catch {
      return []
    }
  }
}
