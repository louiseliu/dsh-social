/**
 * OpenCLI Bridge — wraps the `opencli` CLI tool for browser-automated
 * social media operations (publish, search, trending, etc.).
 *
 * OpenCLI (@jackwener/opencli) converts any website into a CLI by driving
 * the user's logged-in Chrome session via a bridge extension.
 *
 * All commands output JSON: `{ ok: true, data: ... }` on success, or
 * `{ ok: false, error: { code, message, hint? } }` on failure.
 */

import { execFile } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { Platform, TrendingItem } from './shared/types.ts'

const exec = promisify(execFile)

/**
 * Build an env that includes typical user-installed binary paths.
 * Electron apps often launch with a minimal PATH that excludes nvm, fnm,
 * Homebrew, etc.  We prepend the most common locations so `opencli` is found.
 */
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

/**
 * OpenCLI `-f json` outputs the result data directly (array or object).
 * On failure the process exits non-zero and prints an error message to stderr.
 */

// ─── Rate Limiter ────────────────────────────────────────────────────

/**
 * Per-domain rate limiter. Enforces a randomized delay between consecutive
 * opencli calls to the same site adapter (douyin, xiaohongshu, bilibili, etc.)
 * to simulate natural human browsing patterns.
 */
class DomainThrottle {
  private readonly lastCall = new Map<string, number>()
  private readonly minGapMs: number
  private readonly maxGapMs: number

  constructor(minGapMs = 20_000, maxGapMs = 35_000) {
    this.minGapMs = minGapMs
    this.maxGapMs = maxGapMs
  }

  async wait(domain: string): Promise<void> {
    const last = this.lastCall.get(domain) ?? 0
    const randomGap = this.minGapMs + Math.random() * (this.maxGapMs - this.minGapMs)
    const elapsed = Date.now() - last
    if (elapsed < randomGap) {
      await new Promise(resolve => setTimeout(resolve, randomGap - elapsed))
    }
    this.lastCall.set(domain, Date.now())
  }
}

export interface XhsPublishResult {
  noteId?: string
  url?: string
  status: string
}

export interface XhsNote {
  id: string
  title: string
  desc: string
  likes: number
  collects: number
  comments: number
  shares: number
  createTime?: string
  images?: string[]
  url?: string
}

export interface XhsSearchResult {
  items: XhsNote[]
  total?: number
}

export interface XhsCreatorStats {
  followers: number
  following: number
  notes: number
  likes: number
  collects: number
}

export interface BiliHotItem {
  rank: number
  title: string
  author: string
  score: number
  url: string
}

export interface ZhihuHotItem {
  rank: number
  title: string
  heat: number
  answers?: number
  url?: string
}

export interface TwitterPostResult {
  tweetId?: string
  url?: string
  status: string
}

export interface DouyinHotItem {
  name: string
  id?: string
  view_count: number
}

export interface DouyinSearchItem {
  rank: number
  desc: string
  author: string
  url: string
  plays: number
  likes: number
  comments: number
  shares: number
}

export interface DouyinUserVideo {
  index: number
  aweme_id: string
  title: string
  duration: number
  digg_count: number
  play_url?: string
  top_comments?: string[]
}

export interface DouyinVideoStats {
  metric: string
  value: string | number
}

// ─── Platform → OpenCLI command mapping ──────────────────────────────

const PLATFORM_PUBLISH_CMD: Partial<Record<Platform, string>> = {
  xiaohongshu: 'xiaohongshu',
  twitter: 'twitter',
}

// ─── Bridge class ────────────────────────────────────────────────────

export interface OpenCLIOptions {
  /** Path to the opencli binary (defaults to 'opencli' on PATH). */
  bin?: string
  /** Default timeout in ms for opencli calls. */
  timeoutMs?: number
  /** Minimum gap (ms) between calls to the same platform. Default 20000. */
  throttleMinMs?: number
  /** Maximum gap (ms) between calls to the same platform. Default 35000. */
  throttleMaxMs?: number
}

export class OpenCLIBridge {
  private readonly bin: string
  private readonly timeoutMs: number
  private readonly throttle: DomainThrottle
  private _available: boolean | null = null
  private _checkedAt = 0

  constructor(opts: OpenCLIOptions = {}) {
    this.bin = opts.bin ?? 'opencli'
    this.timeoutMs = opts.timeoutMs ?? 60_000
    this.throttle = new DomainThrottle(opts.throttleMinMs ?? 20_000, opts.throttleMaxMs ?? 35_000)
  }

  /** Check if opencli is installed. Caches `true` permanently, `false` for 30s. */
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

  /** Reset cached availability (re-check next call). */
  resetAvailability(): void {
    this._available = null
    this._checkedAt = 0
  }

  /** Run an opencli command and parse JSON output. */
  async run<T>(args: string[], timeoutMs?: number): Promise<T> {
    const available = await this.isAvailable()
    if (!available) {
      throw new Error('OpenCLI 未安装或浏览器桥接未连接。请安装 opencli 并启用 Chrome 扩展。')
    }
    const domain = args[0] ?? 'unknown'
    await this.throttle.wait(domain)
    const { stdout, stderr } = await exec(this.bin, [...args, '-f', 'json'], {
      timeout: timeoutMs ?? this.timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      env: shellEnv(),
    })
    const trimmed = stdout.trim()
    if (!trimmed) {
      throw new Error(stderr?.trim() || 'opencli returned empty output')
    }
    return JSON.parse(trimmed) as T
  }

  // ── Publish ──────────────────────────────────────────────────────

  /** Publish content to a platform via opencli. */
  async publish(platform: Platform, opts: {
    title: string
    content: string
    hashtags?: string[]
    images?: string[]
  }): Promise<{ url?: string; output: string }> {
    const cmd = PLATFORM_PUBLISH_CMD[platform]
    if (!cmd) {
      throw new Error(`平台 ${platform} 暂不支持通过 OpenCLI 自动发布`)
    }

    if (platform === 'xiaohongshu') {
      const args = ['xiaohongshu', 'publish', opts.content, '--title', opts.title]
      if (opts.hashtags && opts.hashtags.length > 0) {
        args.push('--topics', opts.hashtags.join(','))
      }
      if (opts.images && opts.images.length > 0) {
        args.push('--images', opts.images.join(','))
      }
      const result = await this.run<XhsPublishResult>(args, 120_000)
      return { url: result.url, output: JSON.stringify(result) }
    }

    if (platform === 'twitter') {
      const text = opts.hashtags
        ? `${opts.title}\n\n${opts.content}\n\n${opts.hashtags.map(t => `#${t}`).join(' ')}`
        : `${opts.title}\n\n${opts.content}`
      const result = await this.run<TwitterPostResult>(['twitter', 'post', text], 120_000)
      return { url: result.url, output: JSON.stringify(result) }
    }

    throw new Error(`平台 ${platform} 暂不支持通过 OpenCLI 自动发布`)
  }

  // ── Search ───────────────────────────────────────────────────────

  async xhsSearch(query: string, limit = 20): Promise<XhsSearchResult> {
    return this.run<XhsSearchResult>(['xiaohongshu', 'search', query, '--limit', String(limit)])
  }

  async xhsNote(noteUrl: string): Promise<XhsNote> {
    return this.run<XhsNote>(['xiaohongshu', 'note', noteUrl])
  }

  async xhsCreatorStats(): Promise<XhsCreatorStats> {
    return this.run<XhsCreatorStats>(['xiaohongshu', 'creator-stats'])
  }

  // ── Trending ─────────────────────────────────────────────────────

  /** Fetch trending/ranking from Bilibili. */
  async biliHot(limit = 20): Promise<BiliHotItem[]> {
    const result = await this.run<BiliHotItem[]>(['bilibili', 'ranking', '--limit', String(limit)])
    return result
  }

  /** Fetch trending from Zhihu. */
  async zhihuHot(limit = 20): Promise<ZhihuHotItem[]> {
    return this.run<ZhihuHotItem[]>(['zhihu', 'hot', '--limit', String(limit)])
  }

  /** Fetch trending from HackerNews. */
  async hnTop(limit = 10): Promise<Array<{ title: string; url?: string; score: number; comments: number }>> {
    return this.run(['hackernews', 'top', '--limit', String(limit)])
  }

  /** Aggregate trending from all available platforms. */
  async fetchAllTrending(): Promise<TrendingItem[]> {
    const results: TrendingItem[] = []
    const errors: string[] = []

    const tasks = [
      this.douyinHot(15).then(items =>
        items.forEach((item, i) => results.push({
          platform: 'douyin', rank: i + 1, title: item.name,
          heat: item.view_count, label: '热点',
        })),
      ).catch(e => errors.push(`douyin: ${e instanceof Error ? e.message : String(e)}`)),

      this.biliHot(15).then(items =>
        items.forEach(item => results.push({
          platform: 'bilibili', rank: item.rank, title: item.title,
          heat: item.score, url: item.url,
        })),
      ).catch(e => errors.push(`bilibili: ${e instanceof Error ? e.message : String(e)}`)),

      this.zhihuHot(15).then(items =>
        items.forEach(item => results.push({
          platform: 'zhihu', rank: item.rank, title: item.title,
          heat: item.heat, url: item.url,
        })),
      ).catch(e => errors.push(`zhihu: ${e instanceof Error ? e.message : String(e)}`)),
    ]

    await Promise.allSettled(tasks)

    if (errors.length > 0 && results.length === 0) {
      throw new Error(`获取热搜失败：${errors.join('; ')}`)
    }

    return results.sort((a, b) => b.heat - a.heat)
  }

  // ── Twitter ──────────────────────────────────────────────────────

  async twitterPost(text: string): Promise<TwitterPostResult> {
    return this.run<TwitterPostResult>(['twitter', 'post', text])
  }

  async twitterTrending(): Promise<Array<{ trend: string; tweets?: number; url?: string }>> {
    return this.run(['twitter', 'trending'])
  }

  // ── Douyin (抖音) ───────────────────────────────────────────────

  /** Fetch douyin hot topics (热点词). */
  async douyinHot(limit = 10): Promise<DouyinHotItem[]> {
    return this.run<DouyinHotItem[]>(['douyin', 'hashtag', 'hot', '--limit', String(limit)])
  }

  /** Search douyin videos by keyword. */
  async douyinSearch(query: string, limit = 10): Promise<DouyinSearchItem[]> {
    return this.run<DouyinSearchItem[]>(['douyin', 'search', query, '--limit', String(limit)])
  }

  /** Fetch a user's recent videos by sec_uid. */
  async douyinUserVideos(secUid: string, limit = 20): Promise<DouyinUserVideo[]> {
    return this.run<DouyinUserVideo[]>(
      ['douyin', 'user-videos', secUid, '--limit', String(limit), '--with_comments', 'false'],
      90_000,
    )
  }

  /** Get detailed stats for one douyin video. */
  async douyinStats(awemeId: string): Promise<DouyinVideoStats[]> {
    return this.run<DouyinVideoStats[]>(['douyin', 'stats', awemeId])
  }

  // ── Xiaohongshu Creator ──────────────────────────────────────────

  /** Fetch creator's note list with stats. */
  async xhsCreatorNotes(): Promise<Array<Record<string, unknown>>> {
    return this.run(['xiaohongshu', 'creator-notes'])
  }

  /** Fetch creator profile (followers, etc.). */
  async xhsCreatorProfile(): Promise<Record<string, unknown>> {
    return this.run(['xiaohongshu', 'creator-profile'])
  }
}
