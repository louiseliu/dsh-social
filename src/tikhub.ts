import type { HotItem, VideoInfo } from './shared/types.ts'

export class TikHubError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'TikHubError'
  }
}

export interface TikHubOptions {
  baseUrl: string
  timeoutMs: number
  apiKey: () => Promise<string | undefined>
}

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type JsonObject = { [key: string]: Json }

function isObject(value: Json | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function field(value: Json | undefined, ...path: string[]): Json | undefined {
  let current = value
  for (const key of path) {
    if (!isObject(current)) return undefined
    current = current[key]
  }
  return current
}

function num(value: Json | undefined): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value)
  return 0
}

function str(value: Json | undefined): string {
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : ''
}

function firstUrl(value: Json | undefined): string | undefined {
  const list = field(value, 'url_list')
  return Array.isArray(list) && typeof list[0] === 'string' ? list[0] : undefined
}

/** Normalise one Douyin aweme object (app v3 / web shapes) into a VideoInfo. */
export function parseAweme(aweme: Json | undefined): VideoInfo | undefined {
  if (!isObject(aweme)) return undefined
  const id = str(aweme.aweme_id)
  if (id === '') return undefined
  const stats = aweme.statistics
  const author = aweme.author
  const plays = num(field(stats, 'play_count'))
  const likes = num(field(stats, 'digg_count'))
  const comments = num(field(stats, 'comment_count'))
  const shares = num(field(stats, 'share_count'))
  const collects = num(field(stats, 'collect_count'))
  const createSec = num(aweme.create_time)
  const durationMs = num(field(aweme, 'video', 'duration')) || num(aweme.duration)
  return {
    id,
    platform: 'douyin',
    url: str(aweme.share_url) || `https://www.douyin.com/video/${id}`,
    desc: str(aweme.desc),
    createTime: createSec > 0 ? new Date(createSec * 1000).toISOString() : '',
    durationSec: Math.round(durationMs / 1000),
    cover: firstUrl(field(aweme, 'video', 'cover')) ?? firstUrl(field(aweme, 'video', 'origin_cover')),
    author: {
      id: str(field(author, 'uid')),
      secUid: str(field(author, 'sec_uid')),
      nickname: str(field(author, 'nickname')),
      followers: num(field(author, 'follower_count')),
    },
    stats: { plays, likes, comments, shares, collects },
    engagementRate: plays > 0 ? (likes + comments + shares + collects) / plays : 0,
  }
}

export class TikHubClient {
  constructor(private readonly options: TikHubOptions) {}

  async ready(): Promise<boolean> {
    return (await this.options.apiKey()) !== undefined
  }

  async #get(path: string, query: Record<string, string | number>, signal?: AbortSignal): Promise<Json> {
    const key = await this.options.apiKey()
    if (key === undefined) throw new TikHubError('未配置 TikHub API Key：请在工作台「设置」中填写，或设置环境变量。')
    const url = new URL(path, this.options.baseUrl)
    for (const [name, value] of Object.entries(query)) url.searchParams.set(name, String(value))
    const timeout = AbortSignal.timeout(this.options.timeoutMs)
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      signal: signal === undefined ? timeout : AbortSignal.any([signal, timeout]),
    })
    const text = await response.text()
    let body: Json
    try {
      body = JSON.parse(text) as Json
    } catch {
      throw new TikHubError(`TikHub 返回了非 JSON 响应（HTTP ${response.status}）`, response.status)
    }
    if (!response.ok || (isObject(body) && typeof body.code === 'number' && body.code !== 200)) {
      const detail = str(field(body, 'detail', 'message')) || str(field(body, 'message')) || str(field(body, 'detail'))
      throw new TikHubError(`TikHub 请求失败（HTTP ${response.status}）：${detail || '未知错误'}`, response.status)
    }
    return field(body, 'data') ?? body
  }

  /** Fetch one Douyin video from a share link or the full share text. */
  async videoByShareUrl(shareText: string, signal?: AbortSignal): Promise<VideoInfo> {
    const match = shareText.match(/https?:\/\/[^\s]+/)
    const shareUrl = match?.[0] ?? shareText.trim()
    const data = await this.#get('/api/v1/douyin/app/v3/fetch_one_video_by_share_url', { share_url: shareUrl }, signal)
    const video = parseAweme(field(data, 'aweme_detail') ?? data)
    if (video === undefined) throw new TikHubError('TikHub 未返回可识别的视频数据')
    return video
  }

  /** Resolve a Douyin profile URL into its sec_user_id. */
  async secUidFromUrl(profileUrl: string, signal?: AbortSignal): Promise<string> {
    const data = await this.#get('/api/v1/douyin/web/get_sec_user_id', { url: profileUrl }, signal)
    const secUid = typeof data === 'string' ? data : str(field(data, 'sec_user_id'))
    if (secUid === '') throw new TikHubError('无法从链接解析出账号 sec_user_id')
    return secUid
  }

  async userPosts(secUid: string, count: number, signal?: AbortSignal): Promise<VideoInfo[]> {
    const data = await this.#get('/api/v1/douyin/app/v3/fetch_user_post_videos', {
      sec_user_id: secUid,
      max_cursor: 0,
      count,
    }, signal)
    const list = field(data, 'aweme_list')
    if (!Array.isArray(list)) return []
    return list.map(parseAweme).filter((video): video is VideoInfo => video !== undefined)
  }

  async hotSearch(signal?: AbortSignal): Promise<HotItem[]> {
    const data = await this.#get('/api/v1/douyin/app/v3/fetch_hot_search_list', {}, signal)
    const list = field(data, 'data', 'word_list') ?? field(data, 'word_list')
    if (!Array.isArray(list)) return []
    return list.flatMap((entry, index) => {
      const word = str(field(entry, 'word'))
      if (word === '') return []
      const label = str(field(entry, 'label_name')) || str(field(entry, 'sentence_tag'))
      return [{
        rank: num(field(entry, 'position')) || index + 1,
        word,
        hot: num(field(entry, 'hot_value')),
        ...(label === '' ? {} : { label }),
      }]
    })
  }
}
