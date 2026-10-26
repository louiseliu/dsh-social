import type { Context } from '@deepseek-ai/cordis'
import '@deepseek-ai/dsh-agent-default-model'
import '@deepseek-ai/dsh-host-webserver'
import { BlockAssembler, createUserMessage } from '@deepseek-ai/dsh-llm'
import type { ContentBlock, GenerateOptions } from '@deepseek-ai/dsh-llm'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Config } from './config.ts'
import type { Config as ConfigType } from './config.ts'
import type {
  AccountScan, ApiError, CheckKind, CheckReport, CreatorProfile, DashboardSummary,
  Draft, DraftStatus, HotItem, HotList, Material, Platform, SettingsView, Topic,
  TopicStatus, VideoInfo, WatchedAccount,
} from './shared/types.ts'
import { CHECK_KINDS, PLATFORMS } from './shared/types.ts'
import { WorkbenchStore, expandHome, newId, nowIso } from './store.ts'
import { TikHubClient, TikHubError } from './tikhub.ts'

export { Config }
export const name = 'dsh-social'
export const inject = ['tools', 'llm', 'webServer', 'agentDefaultModel'] as const

// ─── Helpers ──────────────────────────────────────────────────────────

function jsonRes(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(text) })
  res.end(text)
}

function errRes(res: ServerResponse, status: number, error: string): void {
  jsonRes(res, status, { error } satisfies ApiError)
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString('utf8')
}

async function jsonBody<T>(req: IncomingMessage): Promise<T> {
  return JSON.parse(await readBody(req)) as T
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

// ─── LLM one-shot helper ─────────────────────────────────────────────

interface LlmEnv {
  llm: Context['llm']
  agentDefaultModel: Context['agentDefaultModel']
  config: ConfigType
}

async function llmGenerate(env: LlmEnv, system: string, userText: string, signal?: AbortSignal): Promise<string> {
  const defaultModel = env.agentDefaultModel.currentSelection()
  const provider = env.config.provider ?? defaultModel.provider
  const model = env.config.model ?? defaultModel.model
  const msg = createUserMessage({
    content: [{ type: 'text', text: userText }],
    source: { kind: 'plugin', plugin: name },
  })
  const options: GenerateOptions = {
    provider,
    model,
    system,
    messages: [msg],
    maxTokens: env.config.maxOutputTokens,
    signal,
  }
  const assembler = new BlockAssembler()
  for await (const chunk of env.llm.stream(options)) {
    assembler.push(chunk)
  }
  return assembler.blocks()
    .filter((b): b is Extract<ContentBlock, { type: 'text' }> => b.type === 'text')
    .map(b => b.text)
    .join('')
}

// ─── Prompt templates ────────────────────────────────────────────────

function profileContext(profile: CreatorProfile): string {
  const parts: string[] = []
  if (profile.name) parts.push(`创作者：${profile.name}`)
  if (profile.niche) parts.push(`赛道：${profile.niche}`)
  if (profile.audience) parts.push(`目标受众：${profile.audience}`)
  if (profile.offer) parts.push(`变现方向：${profile.offer}`)
  if (profile.voiceGuide) parts.push(`文风指南：${profile.voiceGuide}`)
  if (profile.forbidden) parts.push(`禁忌内容：${profile.forbidden}`)
  return parts.length > 0 ? `## 创作者画像\n${parts.join('\n')}` : ''
}

const TOPIC_EXTRACT_SYSTEM = `你是一位资深自媒体选题策划师。根据给定的素材，提炼出有潜力的选题。
每个选题需包含：title（标题）、angle（切入角度）、audience（目标人群）、hook（钩子/爆点）、quotes（素材中的原话引用）。
以 JSON 数组形式输出，示例：
[{"title":"...","angle":"...","audience":"...","hook":"...","quotes":["..."]}]
只输出 JSON，不要有其他文字。`

const DRAFT_WRITE_SYSTEM = `你是一位顶级自媒体内容创作者。根据选题和创作者画像写出一篇完整的内容草稿。
要求：
1. 标题具有强烈吸引力
2. 开头 3 秒就能抓住注意力
3. 内容有洞见、有情绪、有价值
4. 结尾有引导互动的 CTA
以 JSON 输出：{"title":"...","body":"..."}
只输出 JSON，不要有其他文字。`

function checkSystem(kind: CheckKind): string {
  const checks: Record<CheckKind, string> = {
    resonance: `你是内容共鸣度检测专家。分析这篇内容能否引起目标受众的情绪共鸣和认同感。
评估维度：痛点击中度、情绪强度、代入感、认同度。`,
    ai_flavor: `你是 AI 痕迹检测专家。识别内容中的 AI 味道——空洞的正确废话、缺乏细节的概括、不自然的排比等。
重点关注：是否像真人说话、有无独特视角、是否有可验证的细节。`,
    risk: `你是内容合规审查专家。检查内容是否存在违规风险——包括但不限于广告法禁用词、绝对化用语、夸大宣传、敏感话题、版权风险。`,
    script_flow: `你是口播稿审核专家。评估这篇口播稿的流畅度——是否适合朗读、节奏是否自然、是否有拗口的句子。`,
    title_cover_intro: `你是标题封面开头审核专家。评估标题的点击率潜力、封面文案的吸引力、开头的留人能力。
同时提供 5 个备选标题建议。`,
    spread: `你是内容传播力分析专家。评估内容的传播潜力——是否有分享欲、是否触发社交货币、是否有争议性/共识性。`,
  }
  return `${checks[kind]}
以 JSON 输出：{"score": 0-100, "verdict": "一句话总结", "issues": [{"severity":"high|medium|low","quote":"原文引用","problem":"问题","suggestion":"建议"}], "suggestions": ["..."]}
只输出 JSON，不要有其他文字。`
}

const ADAPT_SYSTEM = `你是资深多平台内容运营专家。将给定的草稿适配到指定平台。
每个平台有不同的风格、长度限制和排版规范：
- 小红书：标题要有 emoji，正文分段短小、种草风、带 hashtag
- 抖音：口播脚本风格，节奏快，开头即爆点
- 公众号：深度长文，有逻辑递进，可加小标题
- B 站：轻松活泼，梗多，适合年轻人
- 视频号：中老年友好，朴实温暖
- X/Twitter：极简精炼，280 字内，话题性强
以 JSON 输出：{"title":"...","body":"...","coverText":"...","hashtags":["..."]}
只输出 JSON。`

// ─── Plugin entry ────────────────────────────────────────────────────

export function apply(ctx: Context, config: ConfigType) {
  const store = new WorkbenchStore(config.dataDir)

  const tikhub = new TikHubClient({
    baseUrl: config.tikhubBaseUrl,
    timeoutMs: config.tikhubTimeoutMs,
    apiKey: async () => {
      const secrets = await store.secrets()
      if (secrets.tikhubKey) return secrets.tikhubKey
      const envKey = process.env[config.tikhubKeyEnv]
      return envKey || undefined
    },
  })

  const llmEnv: LlmEnv = { llm: ctx.llm, agentDefaultModel: ctx.agentDefaultModel, config }

  // ═══════════════════════════════════════════════════════════════════
  // TOOLS — registered so the Agent (LLM) can call them
  // ═══════════════════════════════════════════════════════════════════

  // ── social_radar_video ─────────────────────────────────────────────

  ctx.tools.register(defineTool({
    name: 'social_radar_video',
    description: '通过抖音分享链接或分享文本提取视频的完整数据（播放量、点赞、评论、分享、收藏、互动率、作者信息等）。',
    parameters: {
      share_text: { type: 'string', required: true, description: '抖音分享链接或包含链接的分享文本' },
    },
    output: {
      schema: {
        type: 'object', additionalProperties: true, properties: {
          id: { type: 'string', required: true },
          platform: { type: 'string', required: true },
          url: { type: 'string', required: true },
          desc: { type: 'string', required: true },
          author: { type: 'object', additionalProperties: true, properties: { nickname: { type: 'string', required: true } } },
          stats: {
            type: 'object', additionalProperties: true, properties: {
              plays: { type: 'integer', required: true },
              likes: { type: 'integer', required: true },
              comments: { type: 'integer', required: true },
            },
          },
          engagementRate: { type: 'number', required: true },
        },
      },
      render: (_args, value) => {
        const v = value as unknown as VideoInfo
        return [{
          type: 'text' as const,
          text: `🎬 **${v.desc?.slice(0, 60) || '(无描述)'}**\n` +
            `作者: @${v.author.nickname} (${(v.author.followers / 10000).toFixed(1)}w 粉)\n` +
            `▶️ ${v.stats.plays.toLocaleString()} | ❤️ ${v.stats.likes.toLocaleString()} | 💬 ${v.stats.comments.toLocaleString()}\n` +
            `互动率: ${(v.engagementRate * 100).toFixed(2)}%`,
        }]
      },
    },
    timeoutMs: config.tikhubTimeoutMs + 5000,
    async execute(args, exec) {
      return await tikhub.videoByShareUrl(args.share_text, exec.signal) as never
    },
  }))

  // ── social_radar_hot ───────────────────────────────────────────────

  ctx.tools.register(defineTool({
    name: 'social_radar_hot',
    description: '获取抖音实时热搜榜单，了解当前热点话题。',
    parameters: {},
    output: {
      schema: {
        type: 'object', additionalProperties: true, properties: {
          items: { type: 'array', required: true, items: { type: 'object', additionalProperties: true, properties: { rank: { type: 'integer' }, word: { type: 'string' }, hot: { type: 'integer' } } } },
          fetchedAt: { type: 'string', required: true },
        },
      },
      render: (_args, value) => {
        const hot = value as unknown as HotList
        const lines = hot.items.slice(0, 20).map(i => `${i.rank}. ${i.word}${i.label ? ` [${i.label}]` : ''} 🔥${i.hot.toLocaleString()}`)
        return [{ type: 'text', text: `🔥 **抖音热搜** (${hot.fetchedAt})\n\n${lines.join('\n')}` }]
      },
    },
    timeoutMs: config.tikhubTimeoutMs + 5000,
    async execute(_args, exec) {
      const items = await tikhub.hotSearch(exec.signal)
      const hotList: HotList = { platform: 'douyin', fetchedAt: nowIso(), items }
      await store.mutate(data => { data.hot = hotList })
      return hotList as never
    },
  }))

  // ── social_radar_scan ──────────────────────────────────────────────

  ctx.tools.register(defineTool({
    name: 'social_radar_scan',
    description: '扫描一个抖音对标账号的最新作品，找出爆款（播放量超中位数 N 倍的内容）。输入 sec_uid 或用户主页链接。',
    parameters: {
      identifier: { type: 'string', required: true, description: '账号的 sec_uid 或主页链接' },
      nickname: { type: 'string', description: '账号昵称（可选，用于记录）' },
      note: { type: 'string', description: '备注标签，如"同赛道竞品""学习对象"' },
    },
    output: {
      schema: {
        type: 'object', additionalProperties: true, properties: {
          accountId: { type: 'string', required: true },
          videos: { type: 'array', required: true, items: { type: 'object', additionalProperties: true, properties: {} } },
          outlierIds: { type: 'array', required: true, items: { type: 'string' } },
          medianPlays: { type: 'number', required: true },
        },
      },
      render: (_args, value) => {
        const scan = value as unknown as AccountScan
        const outliers = scan.videos.filter(v => scan.outlierIds.includes(v.id))
        const lines = outliers.map(v =>
          `  🔥 ${v.desc.slice(0, 50)} — ▶️${v.stats.plays.toLocaleString()} (${(v.engagementRate * 100).toFixed(1)}%)`,
        )
        return [{
          type: 'text',
          text: `📊 扫描完成：${scan.videos.length} 条作品，中位数播放 ${scan.medianPlays.toLocaleString()}` +
            (outliers.length > 0 ? `\n\n🌟 **${outliers.length} 条爆款：**\n${lines.join('\n')}` : '\n无明显爆款'),
        }]
      },
    },
    timeoutMs: config.tikhubTimeoutMs * 2 + 10000,
    async execute(args, exec) {
      let secUid = args.identifier
      if (secUid.startsWith('http')) {
        secUid = await tikhub.secUidFromUrl(secUid, exec.signal)
      }

      const videos = await tikhub.userPosts(secUid, config.scanPostCount, exec.signal)
      const plays = videos.map(v => v.stats.plays)
      const med = median(plays)
      const outlierIds = videos.filter(v => v.stats.plays > med * config.outlierFactor).map(v => v.id)

      const accountId = await store.mutate(data => {
        let account = data.accounts.find(a => a.secUid === secUid)
        if (!account) {
          account = {
            id: newId('acct'),
            platform: 'douyin',
            secUid,
            nickname: args.nickname ?? videos[0]?.author.nickname ?? secUid.slice(0, 8),
            note: args.note ?? '',
            followers: videos[0]?.author.followers ?? 0,
            addedAt: nowIso(),
          }
          data.accounts.push(account)
        }
        account.lastScanAt = nowIso()
        if (args.nickname) account.nickname = args.nickname
        if (args.note) account.note = args.note

        const scan: AccountScan = {
          accountId: account.id,
          scannedAt: nowIso(),
          videos,
          outlierIds,
          medianPlays: med,
        }
        data.scans.push(scan)
        return account.id
      })

      return { accountId, scannedAt: nowIso(), videos, outlierIds, medianPlays: med } as never
    },
  }))

  // ── social_material_save ───────────────────────────────────────────

  ctx.tools.register(defineTool({
    name: 'social_material_save',
    description: '保存一条素材到自媒体工作台（随手记、口述逐字稿、网页摘录、对标内容、评论区发现等）。',
    parameters: {
      source: { type: 'string', required: true, description: '素材来源：note / transcript / link / competitor / comment' },
      title: { type: 'string', required: true, description: '素材标题' },
      content: { type: 'string', required: true, description: '素材正文' },
      url: { type: 'string', description: '来源链接（可选）' },
      tags: { type: 'array', description: '标签', items: { type: 'string' } },
    },
    output: {
      schema: { type: 'object', additionalProperties: true, properties: { id: { type: 'string', required: true }, title: { type: 'string', required: true } } },
      render: (_args, value) => {
        const m = value as unknown as Material
        return [{ type: 'text', text: `📝 已保存素材：**${m.title}** (${m.id})` }]
      },
    },
    async execute(args) {
      const material: Material = {
        id: newId('mat'),
        source: args.source as Material['source'],
        title: args.title,
        content: args.content,
        url: args.url,
        tags: args.tags ?? [],
        createdAt: nowIso(),
      }
      await store.mutate(data => { data.materials.push(material) })
      return material as never
    },
  }))

  // ── social_topic_extract ───────────────────────────────────────────

  ctx.tools.register(defineTool({
    name: 'social_topic_extract',
    description: '从工作台素材中 AI 提炼选题。可指定素材 ID 列表，或自动使用最近的素材。',
    parameters: {
      material_ids: { type: 'array', description: '素材 ID 列表，为空则使用最近 5 条', items: { type: 'string' } },
    },
    output: {
      schema: { type: 'array', items: { type: 'object', additionalProperties: true, properties: { title: { type: 'string', required: true }, angle: { type: 'string', required: true } } } },
      render: (_args, value) => {
        const topics = value as unknown as Topic[]
        const lines = topics.map((t, i) => `${i + 1}. **${t.title}** — ${t.angle}`)
        return [{ type: 'text', text: `💡 提炼出 ${topics.length} 个选题：\n\n${lines.join('\n')}` }]
      },
    },
    timeoutMs: config.llmTimeoutMs + 10000,
    async execute(args, exec) {
      const data = await store.read()
      let materials: Material[]
      if (args.material_ids && args.material_ids.length > 0) {
        materials = data.materials.filter(m => args.material_ids!.includes(m.id))
      } else {
        materials = data.materials.slice(-5)
      }
      if (materials.length === 0) throw new Error('没有可用的素材。请先保存一些素材。')

      const profile = profileContext(data.profile)
      const materialsText = materials.map((m, i) => `【素材${i + 1}: ${m.title}】\n${m.content}`).join('\n\n')
      const prompt = `${profile}\n\n## 素材\n${materialsText}\n\n请从以上素材中提炼选题。`

      const raw = await llmGenerate(llmEnv, TOPIC_EXTRACT_SYSTEM, prompt, exec.signal)
      const parsed = JSON.parse(raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()) as Array<{
        title: string; angle: string; audience: string; hook: string; quotes: string[]
      }>

      const topics: Topic[] = await store.mutate(d => {
        return parsed.map(t => {
          const topic: Topic = {
            id: newId('topic'),
            title: t.title,
            angle: t.angle,
            audience: t.audience ?? '',
            hook: t.hook ?? '',
            quotes: t.quotes ?? [],
            materialIds: materials.map(m => m.id),
            status: 'new' as TopicStatus,
            score: 0,
            createdAt: nowIso(),
          }
          d.topics.push(topic)
          return topic
        })
      })
      return topics as never
    },
  }))

  // ── social_draft_write ─────────────────────────────────────────────

  ctx.tools.register(defineTool({
    name: 'social_draft_write',
    description: '为指定选题 AI 起草一篇内容。可选目标平台。',
    parameters: {
      topic_id: { type: 'string', required: true, description: '选题 ID' },
      platform: { type: 'string', description: '目标平台：xiaohongshu / douyin / wechat / bilibili / shipinhao / twitter' },
      extra_instructions: { type: 'string', description: '额外写作指令' },
    },
    output: {
      schema: { type: 'object', additionalProperties: true, properties: { id: { type: 'string', required: true }, title: { type: 'string', required: true }, body: { type: 'string', required: true } } },
      render: (_args, value) => {
        const draft = value as unknown as Draft
        return [{ type: 'text', text: `✍️ **${draft.title}**\n\n${draft.body.slice(0, 300)}${draft.body.length > 300 ? '…' : ''}` }]
      },
    },
    timeoutMs: config.llmTimeoutMs + 10000,
    async execute(args, exec) {
      const data = await store.read()
      const topic = data.topics.find(t => t.id === args.topic_id)
      if (!topic) throw new Error(`未找到选题 ${args.topic_id}`)

      const profile = profileContext(data.profile)
      const platform = (args.platform as Platform) ?? 'xiaohongshu'
      const prompt = [
        profile,
        `\n## 选题信息`,
        `标题：${topic.title}`,
        `切入角度：${topic.angle}`,
        `目标受众：${topic.audience}`,
        `钩子：${topic.hook}`,
        topic.quotes.length > 0 ? `原始素材引用：\n${topic.quotes.map(q => `> ${q}`).join('\n')}` : '',
        `\n目标平台：${platform}`,
        args.extra_instructions ? `\n额外要求：${args.extra_instructions}` : '',
      ].filter(Boolean).join('\n')

      const raw = await llmGenerate(llmEnv, DRAFT_WRITE_SYSTEM, prompt, exec.signal)
      const parsed = JSON.parse(raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()) as { title: string; body: string }

      const draft: Draft = await store.mutate(d => {
        const newDraft: Draft = {
          id: newId('draft'),
          topicId: topic.id,
          title: parsed.title,
          body: parsed.body,
          platform,
          status: 'writing',
          versions: [],
          checks: [],
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        d.drafts.push(newDraft)
        const t = d.topics.find(x => x.id === topic.id)
        if (t) t.status = 'drafted'
        return newDraft
      })
      return draft as never
    },
  }))

  // ── social_draft_check ─────────────────────────────────────────────

  ctx.tools.register(defineTool({
    name: 'social_draft_check',
    description: '对内容草稿进行发布前"体检"：共鸣检查、AI 味检测、违规风险、口播流畅度、标题封面开头、传播分析。可选择单项或全部。',
    parameters: {
      draft_id: { type: 'string', required: true, description: '草稿 ID' },
      checks: { type: 'array', description: '要执行的检查项（留空=全部）：resonance / ai_flavor / risk / script_flow / title_cover_intro / spread', items: { type: 'string' } },
    },
    output: {
      schema: { type: 'array', items: { type: 'object', additionalProperties: true, properties: { kind: { type: 'string', required: true }, score: { type: 'integer', required: true }, verdict: { type: 'string', required: true } } } },
      render: (_args, value) => {
        const reports = value as unknown as CheckReport[]
        const avg = Math.round(reports.reduce((s, r) => s + r.score, 0) / reports.length)
        const lines = reports.map(r => {
          const icon = r.score >= 80 ? '✅' : r.score >= 60 ? '⚠️' : '❌'
          return `${icon} **${r.kind}** ${r.score}/100 — ${r.verdict}`
        })
        return [{ type: 'text', text: `📋 **体检报告** 综合得分 ${avg}/100\n\n${lines.join('\n')}` }]
      },
    },
    timeoutMs: config.llmTimeoutMs * 6 + 30000,
    async execute(args, exec) {
      const data = await store.read()
      const draft = data.drafts.find(d => d.id === args.draft_id)
      if (!draft) throw new Error(`未找到草稿 ${args.draft_id}`)

      const kindsToRun: CheckKind[] = args.checks && args.checks.length > 0
        ? args.checks.filter((k): k is CheckKind => CHECK_KINDS.includes(k as CheckKind))
        : [...CHECK_KINDS]

      const profile = profileContext((await store.read()).profile)
      const content = `${profile}\n\n## 待检查内容\n标题：${draft.title}\n平台：${draft.platform}\n\n${draft.body}`

      const reports: CheckReport[] = []
      for (const kind of kindsToRun) {
        if (exec.signal?.aborted) break
        const raw = await llmGenerate(llmEnv, checkSystem(kind), content, exec.signal)
        try {
          const parsed = JSON.parse(raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()) as {
            score: number; verdict: string; issues: CheckReport['issues']; suggestions: string[]
          }
          reports.push({
            kind,
            score: parsed.score,
            verdict: parsed.verdict,
            issues: parsed.issues ?? [],
            suggestions: parsed.suggestions ?? [],
            createdAt: nowIso(),
          })
        } catch {
          reports.push({ kind, score: 0, verdict: '解析失败', issues: [], suggestions: [], createdAt: nowIso() })
        }
      }

      await store.mutate(d => {
        const target = d.drafts.find(x => x.id === draft.id)
        if (target) {
          target.checks = reports
          target.status = 'reviewing'
          target.updatedAt = nowIso()
        }
      })
      return reports as never
    },
  }))

  // ── social_draft_adapt ─────────────────────────────────────────────

  ctx.tools.register(defineTool({
    name: 'social_draft_adapt',
    description: '将一篇草稿改写适配到其他平台（小红书、抖音、公众号、B站、视频号、X）。',
    parameters: {
      draft_id: { type: 'string', required: true, description: '草稿 ID' },
      target_platforms: { type: 'array', required: true, description: '目标平台列表', items: { type: 'string' } },
    },
    output: {
      schema: {
        type: 'array', items: {
          type: 'object', additionalProperties: true, properties: {
            platform: { type: 'string', required: true },
            title: { type: 'string', required: true },
            body: { type: 'string', required: true },
          },
        },
      },
      render: (_args, value) => {
        const versions = value as unknown as Draft['versions']
        const lines = versions.map(v => `📱 **${v.platform}**: ${v.title}`)
        return [{ type: 'text', text: `🔄 已适配 ${versions.length} 个平台版本：\n\n${lines.join('\n')}` }]
      },
    },
    timeoutMs: config.llmTimeoutMs * 6 + 30000,
    async execute(args, exec) {
      const data = await store.read()
      const draft = data.drafts.find(d => d.id === args.draft_id)
      if (!draft) throw new Error(`未找到草稿 ${args.draft_id}`)

      const targets = args.target_platforms.filter((p): p is Platform => PLATFORMS.includes(p as Platform))
      if (targets.length === 0) throw new Error('请指定至少一个有效平台')

      const profile = profileContext((await store.read()).profile)
      const versions: Draft['versions'] = []

      for (const platform of targets) {
        if (exec.signal?.aborted) break
        const prompt = `${profile}\n\n## 原始草稿\n标题：${draft.title}\n原平台：${draft.platform}\n\n${draft.body}\n\n请适配到平台：${platform}`
        const raw = await llmGenerate(llmEnv, ADAPT_SYSTEM, prompt, exec.signal)
        try {
          const parsed = JSON.parse(raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()) as {
            title: string; body: string; coverText?: string; hashtags?: string[]
          }
          versions.push({
            platform,
            title: parsed.title,
            body: parsed.body,
            coverText: parsed.coverText ?? '',
            hashtags: parsed.hashtags ?? [],
            updatedAt: nowIso(),
          })
        } catch {
          versions.push({ platform, title: `${draft.title} (${platform})`, body: draft.body, coverText: '', hashtags: [], updatedAt: nowIso() })
        }
      }

      await store.mutate(d => {
        const target = d.drafts.find(x => x.id === draft.id)
        if (target) {
          for (const v of versions) {
            const existing = target.versions.findIndex(x => x.platform === v.platform)
            if (existing >= 0) target.versions[existing] = v
            else target.versions.push(v)
          }
          target.updatedAt = nowIso()
        }
      })
      return versions as never
    },
  }))

  // ═══════════════════════════════════════════════════════════════════
  // HTTP API — consumed by the browser workbench
  // ═══════════════════════════════════════════════════════════════════

  const prefix = config.routePrefix.replace(/\/+$/, '')

  ctx.webServer.register({
    kind: 'prefix',
    path: prefix,
    handler: async (req, res) => {
      const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
      const path = url.pathname.slice(prefix.length)
      const method = req.method ?? 'GET'

      try {
        // ── Dashboard ────────────────────────────────────
        if (method === 'GET' && path === '/api/dashboard') {
          const data = await store.read()
          const summary: DashboardSummary = {
            materials: data.materials.length,
            topicsNew: data.topics.filter(t => t.status === 'new').length,
            drafts: {
              writing: data.drafts.filter(d => d.status === 'writing').length,
              reviewing: data.drafts.filter(d => d.status === 'reviewing').length,
              ready: data.drafts.filter(d => d.status === 'ready').length,
              published: data.drafts.filter(d => d.status === 'published').length,
            },
            watched: data.accounts.length,
            outliers: data.scans.flatMap(scan => {
              const acct = data.accounts.find(a => a.id === scan.accountId)
              return scan.outlierIds.flatMap(oid => {
                const video = scan.videos.find(v => v.id === oid)
                return video ? [{ account: acct?.nickname ?? scan.accountId, video }] : []
              })
            }).slice(0, 10),
            upcoming: data.drafts
              .filter(d => d.scheduledAt && d.status === 'ready')
              .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''))
              .slice(0, 5)
              .map(d => ({ id: d.id, title: d.title, platform: d.platform, scheduledAt: d.scheduledAt! })),
            tikhubReady: await tikhub.ready(),
            llmReady: true,
          }
          return jsonRes(res, 200, summary)
        }

        // ── Materials ────────────────────────────────────
        if (method === 'GET' && path === '/api/materials') {
          const data = await store.read()
          return jsonRes(res, 200, data.materials)
        }
        if (method === 'POST' && path === '/api/materials') {
          const body = await jsonBody<Partial<Material>>(req)
          const material: Material = {
            id: newId('mat'),
            source: body.source ?? 'note',
            title: body.title ?? '未命名',
            content: body.content ?? '',
            url: body.url,
            tags: body.tags ?? [],
            createdAt: nowIso(),
          }
          await store.mutate(data => { data.materials.push(material) })
          return jsonRes(res, 201, material)
        }
        if (method === 'DELETE' && path.startsWith('/api/materials/')) {
          const id = path.split('/').pop()!
          await store.mutate(data => { data.materials = data.materials.filter(m => m.id !== id) })
          return jsonRes(res, 200, { ok: true })
        }

        // ── Topics ───────────────────────────────────────
        if (method === 'GET' && path === '/api/topics') {
          const data = await store.read()
          return jsonRes(res, 200, data.topics)
        }
        if (method === 'DELETE' && path.startsWith('/api/topics/')) {
          const id = path.split('/').pop()!
          await store.mutate(data => { data.topics = data.topics.filter(t => t.id !== id) })
          return jsonRes(res, 200, { ok: true })
        }

        // ── Drafts ───────────────────────────────────────
        if (method === 'GET' && path === '/api/drafts') {
          const data = await store.read()
          return jsonRes(res, 200, data.drafts)
        }
        if (method === 'GET' && path.startsWith('/api/drafts/') && !path.endsWith('/')) {
          const id = path.split('/').pop()!
          const data = await store.read()
          const draft = data.drafts.find(d => d.id === id)
          if (!draft) return errRes(res, 404, '未找到草稿')
          return jsonRes(res, 200, draft)
        }
        if (method === 'PUT' && path.startsWith('/api/drafts/')) {
          const id = path.split('/').pop()!
          const body = await jsonBody<Partial<Draft>>(req)
          const updated = await store.mutate(data => {
            const draft = data.drafts.find(d => d.id === id)
            if (!draft) return null
            if (body.title !== undefined) draft.title = body.title
            if (body.body !== undefined) draft.body = body.body
            if (body.status !== undefined) draft.status = body.status
            if (body.platform !== undefined) draft.platform = body.platform
            if (body.scheduledAt !== undefined) draft.scheduledAt = body.scheduledAt
            draft.updatedAt = nowIso()
            return draft
          })
          if (!updated) return errRes(res, 404, '未找到草稿')
          return jsonRes(res, 200, updated)
        }
        if (method === 'DELETE' && path.startsWith('/api/drafts/')) {
          const id = path.split('/').pop()!
          await store.mutate(data => { data.drafts = data.drafts.filter(d => d.id !== id) })
          return jsonRes(res, 200, { ok: true })
        }

        // ── Accounts & Scans ─────────────────────────────
        if (method === 'GET' && path === '/api/accounts') {
          const data = await store.read()
          return jsonRes(res, 200, data.accounts)
        }
        if (method === 'GET' && path === '/api/scans') {
          const data = await store.read()
          return jsonRes(res, 200, data.scans)
        }
        if (method === 'DELETE' && path.startsWith('/api/accounts/')) {
          const id = path.split('/').pop()!
          await store.mutate(data => {
            data.accounts = data.accounts.filter(a => a.id !== id)
            data.scans = data.scans.filter(s => s.accountId !== id)
          })
          return jsonRes(res, 200, { ok: true })
        }

        // ── Hot list ─────────────────────────────────────
        if (method === 'GET' && path === '/api/hot') {
          const data = await store.read()
          return jsonRes(res, 200, data.hot)
        }

        // ── Settings ─────────────────────────────────────
        if (method === 'GET' && path === '/api/settings') {
          const data = await store.read()
          const secrets = await store.secrets()
          const defaultModel = ctx.agentDefaultModel.currentSelection()
          const view: SettingsView = {
            profile: data.profile,
            tikhubConfigured: !!(secrets.tikhubKey || process.env[config.tikhubKeyEnv]),
            model: config.provider && config.model
              ? { provider: config.provider, model: config.model }
              : { provider: defaultModel.provider, model: defaultModel.model },
          }
          return jsonRes(res, 200, view)
        }
        if (method === 'PUT' && path === '/api/settings/profile') {
          const body = await jsonBody<Partial<CreatorProfile>>(req)
          await store.mutate(data => {
            Object.assign(data.profile, body)
          })
          return jsonRes(res, 200, { ok: true })
        }
        if (method === 'PUT' && path === '/api/settings/tikhub-key') {
          const body = await jsonBody<{ key: string }>(req)
          await store.saveSecrets({ tikhubKey: body.key || undefined })
          return jsonRes(res, 200, { ok: true })
        }

        errRes(res, 404, 'Not found')
      } catch (error) {
        const message = error instanceof TikHubError ? error.message : error instanceof Error ? error.message : '内部错误'
        const status = error instanceof TikHubError ? (error.status ?? 500) : 500
        errRes(res, status, message)
      }
    },
  })
}
