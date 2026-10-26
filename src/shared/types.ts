/** Wire types shared by the Host plugin, its HTTP API, and the browser workbench. */

export type Platform = 'xiaohongshu' | 'douyin' | 'wechat' | 'bilibili' | 'shipinhao' | 'twitter'

export const PLATFORM_LABELS: Record<Platform, string> = {
  xiaohongshu: '小红书',
  douyin: '抖音',
  wechat: '公众号',
  bilibili: 'B 站',
  shipinhao: '视频号',
  twitter: 'X',
}

export const PLATFORMS: readonly Platform[] = ['xiaohongshu', 'douyin', 'wechat', 'bilibili', 'shipinhao', 'twitter']

export type MaterialSource = 'note' | 'transcript' | 'link' | 'competitor' | 'comment'

export const MATERIAL_SOURCE_LABELS: Record<MaterialSource, string> = {
  note: '随手记',
  transcript: '口述/逐字稿',
  link: '网页摘录',
  competitor: '对标内容',
  comment: '评论区',
}

export interface Material {
  id: string
  source: MaterialSource
  title: string
  content: string
  url?: string
  tags: string[]
  createdAt: string
}

export type TopicStatus = 'new' | 'planned' | 'drafted' | 'dropped'

export interface Topic {
  id: string
  title: string
  angle: string
  audience: string
  hook: string
  /** The creator's own words this topic is grounded on. */
  quotes: string[]
  materialIds: string[]
  status: TopicStatus
  score: number
  createdAt: string
}

export type DraftStatus = 'writing' | 'reviewing' | 'ready' | 'published'

export const DRAFT_STATUS_LABELS: Record<DraftStatus, string> = {
  writing: '写作中',
  reviewing: '待体检',
  ready: '可发布',
  published: '已发布',
}

export interface PlatformVersion {
  platform: Platform
  title: string
  body: string
  coverText: string
  hashtags: string[]
  updatedAt: string
}

export interface PublishResult {
  platform: Platform
  url?: string
  publishedAt: string
  opencliOutput?: string
}

export interface Draft {
  id: string
  topicId?: string
  title: string
  body: string
  platform: Platform
  status: DraftStatus
  versions: PlatformVersion[]
  checks: CheckReport[]
  publishResults: PublishResult[]
  scheduledAt?: string
  createdAt: string
  updatedAt: string
}

/** Pre-publish checks, modelled on the dontbesilent content-review methodology. */
export type CheckKind = 'resonance' | 'ai_flavor' | 'risk' | 'script_flow' | 'title_cover_intro' | 'spread'

export const CHECK_LABELS: Record<CheckKind, string> = {
  resonance: '共鸣检查',
  ai_flavor: 'AI 味检测',
  risk: '违规风险',
  script_flow: '口播流畅度',
  title_cover_intro: '标题封面开头',
  spread: '传播分析',
}

export const CHECK_KINDS: readonly CheckKind[] = ['resonance', 'ai_flavor', 'risk', 'script_flow', 'title_cover_intro', 'spread']

export type IssueSeverity = 'high' | 'medium' | 'low'

export interface CheckIssue {
  severity: IssueSeverity
  /** Exact excerpt from the draft the issue is about; empty for whole-text issues. */
  quote: string
  problem: string
  suggestion: string
}

export interface CheckReport {
  kind: CheckKind
  /** 0-100, higher is better. */
  score: number
  verdict: string
  issues: CheckIssue[]
  /** Extra generated material, e.g. title candidates for `title_cover_intro`. */
  suggestions: string[]
  createdAt: string
}

export interface CreatorProfile {
  name: string
  niche: string
  audience: string
  /** What the creator sells or plans to monetise with. */
  offer: string
  voiceGuide: string
  forbidden: string
}

export type RadarPlatform = 'douyin'

export interface VideoStats {
  plays: number
  likes: number
  comments: number
  shares: number
  collects: number
}

export interface VideoInfo {
  id: string
  platform: RadarPlatform
  url: string
  desc: string
  createTime: string
  durationSec: number
  cover?: string
  author: { id: string; secUid: string; nickname: string; followers: number }
  stats: VideoStats
  /** Engagement per play, a proxy for how strongly the piece landed. */
  engagementRate: number
}

export interface WatchedAccount {
  id: string
  platform: RadarPlatform
  secUid: string
  nickname: string
  note: string
  followers: number
  lastScanAt?: string
  addedAt: string
}

export interface AccountScan {
  accountId: string
  scannedAt: string
  videos: VideoInfo[]
  /** Videos whose plays exceed the account median by the configured outlier factor. */
  outlierIds: string[]
  medianPlays: number
}

export interface HotItem {
  rank: number
  word: string
  hot: number
  label?: string
}

export interface HotList {
  platform: RadarPlatform
  fetchedAt: string
  items: HotItem[]
}

export interface TrendingItem {
  platform: string
  rank: number
  title: string
  heat: number
  url?: string
  label?: string
}

export interface DashboardSummary {
  materials: number
  topicsNew: number
  drafts: Record<DraftStatus, number>
  watched: number
  outliers: Array<{ account: string; video: VideoInfo }>
  upcoming: Array<{ id: string; title: string; platform: Platform; scheduledAt: string }>
  tikhubReady: boolean
  opencliReady: boolean
  wenyanReady: boolean
  wechatConfigured: boolean
  llmReady: boolean
}

export interface SettingsView {
  profile: CreatorProfile
  tikhubConfigured: boolean
  opencliReady: boolean
  wenyanReady: boolean
  wechatConfigured: boolean
  dataDir: string
  model: { provider: string; model: string } | null
}

export interface ApiError {
  error: string
}
