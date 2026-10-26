import z from '@deepseek-ai/schemastery'

export interface Config {
  /** Directory for workbench data; `~` expands to the user home. */
  dataDir: string
  /** HTTP prefix of the workbench API on the DSH web server. */
  routePrefix: string
  /** Model route for writing tasks; falls back to the Agent default model when unset. */
  provider?: string
  model?: string
  maxOutputTokens: number
  llmTimeoutMs: number
  tikhubBaseUrl: string
  /** Environment variable holding the TikHub key; a key saved in the workbench settings wins. */
  tikhubKeyEnv: string
  tikhubTimeoutMs: number
  /** Posts fetched per account scan. */
  scanPostCount: number
  /** A post is an outlier when its plays exceed the account median times this factor. */
  outlierFactor: number
}

export const Config: z<Config> = z.object({
  dataDir: z.string().default('~/.dsh/social').description('工作台数据目录'),
  routePrefix: z.string().default('/social').description('工作台 HTTP 接口前缀'),
  provider: z.string().description('写作用模型的 provider；留空则使用 Agent 默认模型'),
  model: z.string().description('写作用模型 id；需与 provider 同时填写'),
  maxOutputTokens: z.natural().default(8192).description('单次写作最大输出 token'),
  llmTimeoutMs: z.natural().default(180_000).description('单次写作超时（毫秒）'),
  tikhubBaseUrl: z.string().default('https://api.tikhub.io').description('TikHub API 地址'),
  tikhubKeyEnv: z.string().default('TIKHUB_API_KEY').description('读取 TikHub Key 的环境变量名'),
  tikhubTimeoutMs: z.natural().default(30_000).description('TikHub 请求超时（毫秒）'),
  scanPostCount: z.natural().default(20).description('每次扫描对标账号拉取的作品数'),
  outlierFactor: z.number().default(3).description('爆款判定：播放量超过账号中位数的倍数'),
})
