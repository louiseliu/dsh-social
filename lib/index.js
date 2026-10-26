// src/index.ts
import "@deepseek-ai/dsh-agent-default-model";
import "@deepseek-ai/dsh-host-webserver";
import { BlockAssembler, createUserMessage } from "@deepseek-ai/dsh-llm";
import { defineTool } from "@deepseek-ai/dsh-tools";

// src/config.ts
import z from "@deepseek-ai/schemastery";
var Config = z.object({
  dataDir: z.string().default("~/.dsh/social").description("\u5DE5\u4F5C\u53F0\u6570\u636E\u76EE\u5F55"),
  routePrefix: z.string().default("/dsh-social").description("\u5DE5\u4F5C\u53F0 HTTP \u63A5\u53E3\u524D\u7F00"),
  provider: z.string().description("\u5199\u4F5C\u7528\u6A21\u578B\u7684 provider\uFF1B\u7559\u7A7A\u5219\u4F7F\u7528 Agent \u9ED8\u8BA4\u6A21\u578B"),
  model: z.string().description("\u5199\u4F5C\u7528\u6A21\u578B id\uFF1B\u9700\u4E0E provider \u540C\u65F6\u586B\u5199"),
  maxOutputTokens: z.natural().default(8192).description("\u5355\u6B21\u5199\u4F5C\u6700\u5927\u8F93\u51FA token"),
  llmTimeoutMs: z.natural().default(18e4).description("\u5355\u6B21\u5199\u4F5C\u8D85\u65F6\uFF08\u6BEB\u79D2\uFF09"),
  tikhubBaseUrl: z.string().default("https://api.tikhub.io").description("TikHub API \u5730\u5740"),
  tikhubKeyEnv: z.string().default("TIKHUB_API_KEY").description("\u8BFB\u53D6 TikHub Key \u7684\u73AF\u5883\u53D8\u91CF\u540D"),
  tikhubTimeoutMs: z.natural().default(3e4).description("TikHub \u8BF7\u6C42\u8D85\u65F6\uFF08\u6BEB\u79D2\uFF09"),
  scanPostCount: z.natural().default(20).description("\u6BCF\u6B21\u626B\u63CF\u5BF9\u6807\u8D26\u53F7\u62C9\u53D6\u7684\u4F5C\u54C1\u6570"),
  outlierFactor: z.number().default(3).description("\u7206\u6B3E\u5224\u5B9A\uFF1A\u64AD\u653E\u91CF\u8D85\u8FC7\u8D26\u53F7\u4E2D\u4F4D\u6570\u7684\u500D\u6570")
});

// src/shared/types.ts
var PLATFORMS = ["xiaohongshu", "douyin", "wechat", "bilibili", "shipinhao", "twitter"];
var CHECK_KINDS = ["resonance", "ai_flavor", "risk", "script_flow", "title_cover_intro", "spread"];

// src/opencli.ts
import { execFile } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
var exec = promisify(execFile);
function shellEnv() {
  const home = homedir();
  const extraPaths = [
    join(home, ".nvm/versions/node", process.version, "bin"),
    join(home, ".local/bin"),
    "/opt/homebrew/bin",
    "/usr/local/bin"
  ];
  const existing = process.env.PATH ?? "";
  return { ...process.env, PATH: [...extraPaths, existing].join(":") };
}
var DomainThrottle = class {
  lastCall = /* @__PURE__ */ new Map();
  minGapMs;
  maxGapMs;
  constructor(minGapMs = 2e4, maxGapMs = 35e3) {
    this.minGapMs = minGapMs;
    this.maxGapMs = maxGapMs;
  }
  async wait(domain) {
    const last = this.lastCall.get(domain) ?? 0;
    const randomGap = this.minGapMs + Math.random() * (this.maxGapMs - this.minGapMs);
    const elapsed = Date.now() - last;
    if (elapsed < randomGap) {
      await new Promise((resolve) => setTimeout(resolve, randomGap - elapsed));
    }
    this.lastCall.set(domain, Date.now());
  }
};
var PLATFORM_PUBLISH_CMD = {
  xiaohongshu: "xiaohongshu",
  twitter: "twitter"
};
var OpenCLIBridge = class {
  bin;
  timeoutMs;
  throttle;
  _available = null;
  _checkedAt = 0;
  constructor(opts = {}) {
    this.bin = opts.bin ?? "opencli";
    this.timeoutMs = opts.timeoutMs ?? 6e4;
    this.throttle = new DomainThrottle(opts.throttleMinMs ?? 2e4, opts.throttleMaxMs ?? 35e3);
  }
  /** Check if opencli is installed. Caches `true` permanently, `false` for 30s. */
  async isAvailable() {
    if (this._available === true) return true;
    if (this._available === false && Date.now() - this._checkedAt < 3e4) return false;
    try {
      await exec(this.bin, ["--version"], { timeout: 1e4, env: shellEnv() });
      this._available = true;
    } catch {
      this._available = false;
    }
    this._checkedAt = Date.now();
    return this._available;
  }
  /** Reset cached availability (re-check next call). */
  resetAvailability() {
    this._available = null;
    this._checkedAt = 0;
  }
  /** Run an opencli command and parse JSON output. */
  async run(args, timeoutMs) {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error("OpenCLI \u672A\u5B89\u88C5\u6216\u6D4F\u89C8\u5668\u6865\u63A5\u672A\u8FDE\u63A5\u3002\u8BF7\u5B89\u88C5 opencli \u5E76\u542F\u7528 Chrome \u6269\u5C55\u3002");
    }
    const domain = args[0] ?? "unknown";
    await this.throttle.wait(domain);
    const { stdout, stderr } = await exec(this.bin, [...args, "-f", "json"], {
      timeout: timeoutMs ?? this.timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      env: shellEnv()
    });
    const trimmed = stdout.trim();
    if (!trimmed) {
      throw new Error(stderr?.trim() || "opencli returned empty output");
    }
    return JSON.parse(trimmed);
  }
  // ── Publish ──────────────────────────────────────────────────────
  /** Publish content to a platform via opencli. */
  async publish(platform, opts) {
    const cmd = PLATFORM_PUBLISH_CMD[platform];
    if (!cmd) {
      throw new Error(`\u5E73\u53F0 ${platform} \u6682\u4E0D\u652F\u6301\u901A\u8FC7 OpenCLI \u81EA\u52A8\u53D1\u5E03`);
    }
    if (platform === "xiaohongshu") {
      const args = ["xiaohongshu", "publish", opts.content, "--title", opts.title];
      if (opts.hashtags && opts.hashtags.length > 0) {
        args.push("--topics", opts.hashtags.join(","));
      }
      if (opts.images && opts.images.length > 0) {
        args.push("--images", opts.images.join(","));
      }
      const result = await this.run(args, 12e4);
      return { url: result.url, output: JSON.stringify(result) };
    }
    if (platform === "twitter") {
      const text = opts.hashtags ? `${opts.title}

${opts.content}

${opts.hashtags.map((t) => `#${t}`).join(" ")}` : `${opts.title}

${opts.content}`;
      const result = await this.run(["twitter", "post", text], 12e4);
      return { url: result.url, output: JSON.stringify(result) };
    }
    throw new Error(`\u5E73\u53F0 ${platform} \u6682\u4E0D\u652F\u6301\u901A\u8FC7 OpenCLI \u81EA\u52A8\u53D1\u5E03`);
  }
  // ── Search ───────────────────────────────────────────────────────
  async xhsSearch(query, limit = 20) {
    return this.run(["xiaohongshu", "search", query, "--limit", String(limit)]);
  }
  async xhsNote(noteUrl) {
    return this.run(["xiaohongshu", "note", noteUrl]);
  }
  async xhsCreatorStats() {
    return this.run(["xiaohongshu", "creator-stats"]);
  }
  // ── Trending ─────────────────────────────────────────────────────
  /** Fetch trending/ranking from Bilibili. */
  async biliHot(limit = 20) {
    const result = await this.run(["bilibili", "ranking", "--limit", String(limit)]);
    return result;
  }
  /** Fetch trending from Zhihu. */
  async zhihuHot(limit = 20) {
    return this.run(["zhihu", "hot", "--limit", String(limit)]);
  }
  /** Fetch trending from HackerNews. */
  async hnTop(limit = 10) {
    return this.run(["hackernews", "top", "--limit", String(limit)]);
  }
  /** Aggregate trending from all available platforms. */
  async fetchAllTrending() {
    const results = [];
    const errors = [];
    const tasks = [
      this.douyinHot(15).then(
        (items) => items.forEach((item, i) => results.push({
          platform: "douyin",
          rank: i + 1,
          title: item.name,
          heat: item.view_count,
          label: "\u70ED\u70B9"
        }))
      ).catch((e) => errors.push(`douyin: ${e instanceof Error ? e.message : String(e)}`)),
      this.biliHot(15).then(
        (items) => items.forEach((item) => results.push({
          platform: "bilibili",
          rank: item.rank,
          title: item.title,
          heat: item.score,
          url: item.url
        }))
      ).catch((e) => errors.push(`bilibili: ${e instanceof Error ? e.message : String(e)}`)),
      this.zhihuHot(15).then(
        (items) => items.forEach((item) => results.push({
          platform: "zhihu",
          rank: item.rank,
          title: item.title,
          heat: item.heat,
          url: item.url
        }))
      ).catch((e) => errors.push(`zhihu: ${e instanceof Error ? e.message : String(e)}`))
    ];
    await Promise.allSettled(tasks);
    if (errors.length > 0 && results.length === 0) {
      throw new Error(`\u83B7\u53D6\u70ED\u641C\u5931\u8D25\uFF1A${errors.join("; ")}`);
    }
    return results.sort((a, b) => b.heat - a.heat);
  }
  // ── Twitter ──────────────────────────────────────────────────────
  async twitterPost(text) {
    return this.run(["twitter", "post", text]);
  }
  async twitterTrending() {
    return this.run(["twitter", "trending"]);
  }
  // ── Douyin (抖音) ───────────────────────────────────────────────
  /** Fetch douyin hot topics (热点词). */
  async douyinHot(limit = 10) {
    return this.run(["douyin", "hashtag", "hot", "--limit", String(limit)]);
  }
  /** Search douyin videos by keyword. */
  async douyinSearch(query, limit = 10) {
    return this.run(["douyin", "search", query, "--limit", String(limit)]);
  }
  /** Fetch a user's recent videos by sec_uid. */
  async douyinUserVideos(secUid, limit = 20) {
    return this.run(
      ["douyin", "user-videos", secUid, "--limit", String(limit), "--with_comments", "false"],
      9e4
    );
  }
  /** Get detailed stats for one douyin video. */
  async douyinStats(awemeId) {
    return this.run(["douyin", "stats", awemeId]);
  }
  // ── Xiaohongshu Creator ──────────────────────────────────────────
  /** Fetch creator's note list with stats. */
  async xhsCreatorNotes() {
    return this.run(["xiaohongshu", "creator-notes"]);
  }
  /** Fetch creator profile (followers, etc.). */
  async xhsCreatorProfile() {
    return this.run(["xiaohongshu", "creator-profile"]);
  }
};

// src/wenyan.ts
import { execFile as execFile2 } from "node:child_process";
import { homedir as homedir2 } from "node:os";
import { join as join2 } from "node:path";
import { promisify as promisify2 } from "node:util";
import { writeFile, unlink, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
var exec2 = promisify2(execFile2);
function shellEnv2() {
  const home = homedir2();
  const extraPaths = [
    join2(home, ".nvm/versions/node", process.version, "bin"),
    join2(home, ".local/bin"),
    "/opt/homebrew/bin",
    "/usr/local/bin"
  ];
  const existing = process.env.PATH ?? "";
  return { ...process.env, PATH: [...extraPaths, existing].join(":") };
}
var WenyanBridge = class {
  bin;
  timeoutMs;
  _available = null;
  _checkedAt = 0;
  constructor(opts = {}) {
    this.bin = opts.bin ?? "wenyan";
    this.timeoutMs = opts.timeoutMs ?? 12e4;
  }
  /** Check if wenyan CLI is installed. Caches true permanently, false for 30s. */
  async isAvailable() {
    if (this._available === true) return true;
    if (this._available === false && Date.now() - this._checkedAt < 3e4) return false;
    try {
      await exec2(this.bin, ["--version"], { timeout: 1e4, env: shellEnv2() });
      this._available = true;
    } catch {
      this._available = false;
    }
    this._checkedAt = Date.now();
    return this._available;
  }
  /** Check if WeChat credentials are configured. */
  isWechatConfigured() {
    return !!(process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET);
  }
  /**
   * Render Markdown to WeChat-compatible HTML using wenyan.
   * Returns the rendered HTML string.
   */
  async render(markdown, opts) {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error("wenyan CLI \u672A\u5B89\u88C5\u3002\u8BF7\u8FD0\u884C: npm install -g @wenyan-md/cli");
    }
    const tmpDir = await mkdtemp(join2(tmpdir(), "dsh-wenyan-"));
    const mdPath = join2(tmpDir, "article.md");
    const htmlPath = join2(tmpDir, "article.html");
    try {
      await writeFile(mdPath, markdown, "utf8");
      const args = ["render", "-f", mdPath, "-o", htmlPath];
      if (opts?.theme) {
        args.push("--theme", opts.theme);
      }
      const { stdout, stderr } = await exec2(this.bin, args, {
        timeout: this.timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
        env: shellEnv2()
      });
      const { readFile: readFile2 } = await import("node:fs/promises");
      const html = await readFile2(htmlPath, "utf8");
      return { html, output: stdout + stderr };
    } finally {
      await unlink(mdPath).catch(() => void 0);
      await unlink(htmlPath).catch(() => void 0);
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
  async publish(markdown, opts) {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error("wenyan CLI \u672A\u5B89\u88C5\u3002\u8BF7\u8FD0\u884C: npm install -g @wenyan-md/cli");
    }
    if (!this.isWechatConfigured() && !opts?.envFile) {
      throw new Error("\u672A\u914D\u7F6E\u5FAE\u4FE1\u516C\u4F17\u53F7\u51ED\u636E\u3002\u8BF7\u8BBE\u7F6E WECHAT_APP_ID \u548C WECHAT_APP_SECRET \u73AF\u5883\u53D8\u91CF\u3002");
    }
    const tmpDir = await mkdtemp(join2(tmpdir(), "dsh-wenyan-"));
    const mdPath = join2(tmpDir, "article.md");
    try {
      await writeFile(mdPath, markdown, "utf8");
      const args = ["publish", "-f", mdPath];
      if (opts?.theme) {
        args.push("--theme", opts.theme);
      }
      if (opts?.appId) {
        args.push("--app-id", opts.appId);
      }
      if (opts?.envFile) {
        args.push(`--env-file=${opts.envFile}`);
      }
      const { stdout, stderr } = await exec2(this.bin, args, {
        timeout: this.timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
        env: shellEnv2()
      });
      const output = stdout + stderr;
      const mediaIdMatch = output.match(/media_id[:\s]+(\S+)/i);
      return {
        success: true,
        mediaId: mediaIdMatch?.[1],
        message: "\u5DF2\u63A8\u9001\u5230\u516C\u4F17\u53F7\u8349\u7A3F\u7BB1",
        output
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: msg,
        output: msg
      };
    } finally {
      await unlink(mdPath).catch(() => void 0);
    }
  }
  /** List available themes. */
  async listThemes() {
    const available = await this.isAvailable();
    if (!available) return [];
    try {
      const { stdout } = await exec2(this.bin, ["theme", "list"], {
        timeout: 1e4,
        env: shellEnv2()
      });
      return stdout.trim().split("\n").map((s) => s.trim()).filter(Boolean);
    } catch {
      return [];
    }
  }
};

// src/store.ts
import { randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, rename, writeFile as writeFile2 } from "node:fs/promises";
import { homedir as homedir3 } from "node:os";
import { join as join3 } from "node:path";
var EMPTY_PROFILE = {
  name: "",
  niche: "",
  audience: "",
  offer: "",
  voiceGuide: "",
  forbidden: ""
};
function emptyData() {
  return { profile: { ...EMPTY_PROFILE }, materials: [], topics: [], drafts: [], accounts: [], scans: [], hot: null };
}
function expandHome(path) {
  return path === "~" || path.startsWith("~/") ? join3(homedir3(), path.slice(1)) : path;
}
function newId(prefix) {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return void 0;
    throw error;
  }
}
async function writeJsonAtomic(path, value, mode) {
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile2(tmp, JSON.stringify(value, null, 2), { encoding: "utf8", mode });
  await rename(tmp, path);
  await chmod(path, mode);
}
var WorkbenchStore = class {
  #dir;
  #data;
  #secrets;
  #queue = Promise.resolve();
  constructor(dataDir) {
    this.#dir = expandHome(dataDir);
  }
  /** Current data directory path. */
  get dataDir() {
    return this.#dir;
  }
  /**
   * Switch to a different data directory at runtime. Flushes the in-memory
   * cache so the next read loads from the new path. Existing queued mutations
   * targeting the old directory finish before the swap takes effect.
   */
  async switchDir(newDir) {
    const resolved = expandHome(newDir);
    await mkdir(resolved, { recursive: true, mode: 448 });
    await this.#queue;
    this.#dir = resolved;
    this.#data = void 0;
    this.#secrets = void 0;
  }
  async #load() {
    if (this.#data === void 0) {
      await mkdir(this.#dir, { recursive: true, mode: 448 });
      const stored = await readJson(join3(this.#dir, "workbench.json"));
      this.#data = { ...emptyData(), ...stored };
      for (const draft of this.#data.drafts) {
        if (!draft.publishResults) draft.publishResults = [];
      }
    }
    return this.#data;
  }
  async read() {
    await this.#queue;
    return this.#load();
  }
  mutate(fn) {
    const run = this.#queue.then(async () => {
      const data = await this.#load();
      const result = fn(data);
      await writeJsonAtomic(join3(this.#dir, "workbench.json"), data, 384);
      return result;
    });
    this.#queue = run.catch(() => void 0);
    return run;
  }
  async secrets() {
    if (this.#secrets === void 0) {
      await mkdir(this.#dir, { recursive: true, mode: 448 });
      this.#secrets = await readJson(join3(this.#dir, "secrets.json")) ?? {};
    }
    return this.#secrets;
  }
  async saveSecrets(patch) {
    const next = { ...await this.secrets(), ...patch };
    await writeJsonAtomic(join3(this.#dir, "secrets.json"), next, 384);
    this.#secrets = next;
  }
};

// src/tikhub.ts
var TikHubError = class extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = "TikHubError";
  }
};
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function field(value, ...path) {
  let current = value;
  for (const key of path) {
    if (!isObject(current)) return void 0;
    current = current[key];
  }
  return current;
}
function num(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return 0;
}
function str(value) {
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
}
function firstUrl(value) {
  const list = field(value, "url_list");
  return Array.isArray(list) && typeof list[0] === "string" ? list[0] : void 0;
}
function parseAweme(aweme) {
  if (!isObject(aweme)) return void 0;
  const id = str(aweme.aweme_id);
  if (id === "") return void 0;
  const stats = aweme.statistics;
  const author = aweme.author;
  const plays = num(field(stats, "play_count"));
  const likes = num(field(stats, "digg_count"));
  const comments = num(field(stats, "comment_count"));
  const shares = num(field(stats, "share_count"));
  const collects = num(field(stats, "collect_count"));
  const createSec = num(aweme.create_time);
  const durationMs = num(field(aweme, "video", "duration")) || num(aweme.duration);
  return {
    id,
    platform: "douyin",
    url: str(aweme.share_url) || `https://www.douyin.com/video/${id}`,
    desc: str(aweme.desc),
    createTime: createSec > 0 ? new Date(createSec * 1e3).toISOString() : "",
    durationSec: Math.round(durationMs / 1e3),
    cover: firstUrl(field(aweme, "video", "cover")) ?? firstUrl(field(aweme, "video", "origin_cover")),
    author: {
      id: str(field(author, "uid")),
      secUid: str(field(author, "sec_uid")),
      nickname: str(field(author, "nickname")),
      followers: num(field(author, "follower_count"))
    },
    stats: { plays, likes, comments, shares, collects },
    engagementRate: plays > 0 ? (likes + comments + shares + collects) / plays : 0
  };
}
var TikHubClient = class {
  constructor(options) {
    this.options = options;
  }
  async ready() {
    return await this.options.apiKey() !== void 0;
  }
  async #get(path, query, signal) {
    const key = await this.options.apiKey();
    if (key === void 0) throw new TikHubError("\u672A\u914D\u7F6E TikHub API Key\uFF1A\u8BF7\u5728\u5DE5\u4F5C\u53F0\u300C\u8BBE\u7F6E\u300D\u4E2D\u586B\u5199\uFF0C\u6216\u8BBE\u7F6E\u73AF\u5883\u53D8\u91CF\u3002");
    const url = new URL(path, this.options.baseUrl);
    for (const [name2, value] of Object.entries(query)) url.searchParams.set(name2, String(value));
    const timeout = AbortSignal.timeout(this.options.timeoutMs);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
      signal: signal === void 0 ? timeout : AbortSignal.any([signal, timeout])
    });
    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      throw new TikHubError(`TikHub \u8FD4\u56DE\u4E86\u975E JSON \u54CD\u5E94\uFF08HTTP ${response.status}\uFF09`, response.status);
    }
    if (!response.ok || isObject(body) && typeof body.code === "number" && body.code !== 200) {
      const detail = str(field(body, "detail", "message")) || str(field(body, "message")) || str(field(body, "detail"));
      throw new TikHubError(`TikHub \u8BF7\u6C42\u5931\u8D25\uFF08HTTP ${response.status}\uFF09\uFF1A${detail || "\u672A\u77E5\u9519\u8BEF"}`, response.status);
    }
    return field(body, "data") ?? body;
  }
  /** Fetch one Douyin video from a share link or the full share text. */
  async videoByShareUrl(shareText, signal) {
    const match = shareText.match(/https?:\/\/[^\s]+/);
    const shareUrl = match?.[0] ?? shareText.trim();
    const data = await this.#get("/api/v1/douyin/app/v3/fetch_one_video_by_share_url", { share_url: shareUrl }, signal);
    const video = parseAweme(field(data, "aweme_detail") ?? data);
    if (video === void 0) throw new TikHubError("TikHub \u672A\u8FD4\u56DE\u53EF\u8BC6\u522B\u7684\u89C6\u9891\u6570\u636E");
    return video;
  }
  /** Resolve a Douyin profile URL into its sec_user_id. */
  async secUidFromUrl(profileUrl, signal) {
    const data = await this.#get("/api/v1/douyin/web/get_sec_user_id", { url: profileUrl }, signal);
    const secUid = typeof data === "string" ? data : str(field(data, "sec_user_id"));
    if (secUid === "") throw new TikHubError("\u65E0\u6CD5\u4ECE\u94FE\u63A5\u89E3\u6790\u51FA\u8D26\u53F7 sec_user_id");
    return secUid;
  }
  async userPosts(secUid, count, signal) {
    const data = await this.#get("/api/v1/douyin/app/v3/fetch_user_post_videos", {
      sec_user_id: secUid,
      max_cursor: 0,
      count
    }, signal);
    const list = field(data, "aweme_list");
    if (!Array.isArray(list)) return [];
    return list.map(parseAweme).filter((video) => video !== void 0);
  }
  async hotSearch(signal) {
    const data = await this.#get("/api/v1/douyin/app/v3/fetch_hot_search_list", {}, signal);
    const list = field(data, "data", "word_list") ?? field(data, "word_list");
    if (!Array.isArray(list)) return [];
    return list.flatMap((entry, index) => {
      const word = str(field(entry, "word"));
      if (word === "") return [];
      const label = str(field(entry, "label_name")) || str(field(entry, "sentence_tag"));
      return [{
        rank: num(field(entry, "position")) || index + 1,
        word,
        hot: num(field(entry, "hot_value")),
        ...label === "" ? {} : { label }
      }];
    });
  }
};

// src/index.ts
var name = "dsh-social";
var inject = ["tools", "llm", "webServer", "agentDefaultModel"];
function jsonRes(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(text) });
  res.end(text);
}
function errRes(res, status, error) {
  jsonRes(res, status, { error });
}
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}
async function jsonBody(req) {
  return JSON.parse(await readBody(req));
}
function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
async function llmGenerate(env, system, userText, signal) {
  const defaultModel = env.agentDefaultModel.currentSelection();
  const provider = env.config.provider ?? defaultModel.provider;
  const model = env.config.model ?? defaultModel.model;
  const msg = createUserMessage({
    content: [{ type: "text", text: userText }],
    source: { kind: "plugin", plugin: name }
  });
  const options = {
    provider,
    model,
    system,
    messages: [msg],
    maxTokens: env.config.maxOutputTokens,
    signal
  };
  const assembler = new BlockAssembler();
  for await (const chunk of env.llm.stream(options)) {
    assembler.push(chunk);
  }
  return assembler.blocks().filter((b) => b.type === "text").map((b) => b.text).join("");
}
function profileContext(profile) {
  const parts = [];
  if (profile.name) parts.push(`\u521B\u4F5C\u8005\uFF1A${profile.name}`);
  if (profile.niche) parts.push(`\u8D5B\u9053\uFF1A${profile.niche}`);
  if (profile.audience) parts.push(`\u76EE\u6807\u53D7\u4F17\uFF1A${profile.audience}`);
  if (profile.offer) parts.push(`\u53D8\u73B0\u65B9\u5411\uFF1A${profile.offer}`);
  if (profile.voiceGuide) parts.push(`\u6587\u98CE\u6307\u5357\uFF1A${profile.voiceGuide}`);
  if (profile.forbidden) parts.push(`\u7981\u5FCC\u5185\u5BB9\uFF1A${profile.forbidden}`);
  return parts.length > 0 ? `## \u521B\u4F5C\u8005\u753B\u50CF
${parts.join("\n")}` : "";
}
var TOPIC_EXTRACT_SYSTEM = `\u4F60\u662F\u4E00\u4F4D\u8D44\u6DF1\u81EA\u5A92\u4F53\u9009\u9898\u7B56\u5212\u5E08\u3002\u6839\u636E\u7ED9\u5B9A\u7684\u7D20\u6750\uFF0C\u63D0\u70BC\u51FA\u6709\u6F5C\u529B\u7684\u9009\u9898\u3002
\u6BCF\u4E2A\u9009\u9898\u9700\u5305\u542B\uFF1Atitle\uFF08\u6807\u9898\uFF09\u3001angle\uFF08\u5207\u5165\u89D2\u5EA6\uFF09\u3001audience\uFF08\u76EE\u6807\u4EBA\u7FA4\uFF09\u3001hook\uFF08\u94A9\u5B50/\u7206\u70B9\uFF09\u3001quotes\uFF08\u7D20\u6750\u4E2D\u7684\u539F\u8BDD\u5F15\u7528\uFF09\u3002
\u4EE5 JSON \u6570\u7EC4\u5F62\u5F0F\u8F93\u51FA\uFF0C\u793A\u4F8B\uFF1A
[{"title":"...","angle":"...","audience":"...","hook":"...","quotes":["..."]}]
\u53EA\u8F93\u51FA JSON\uFF0C\u4E0D\u8981\u6709\u5176\u4ED6\u6587\u5B57\u3002`;
var DRAFT_WRITE_SYSTEM = `\u4F60\u662F\u4E00\u4F4D\u9876\u7EA7\u81EA\u5A92\u4F53\u5185\u5BB9\u521B\u4F5C\u8005\u3002\u6839\u636E\u9009\u9898\u548C\u521B\u4F5C\u8005\u753B\u50CF\u5199\u51FA\u4E00\u7BC7\u5B8C\u6574\u7684\u5185\u5BB9\u8349\u7A3F\u3002
\u8981\u6C42\uFF1A
1. \u6807\u9898\u5177\u6709\u5F3A\u70C8\u5438\u5F15\u529B
2. \u5F00\u5934 3 \u79D2\u5C31\u80FD\u6293\u4F4F\u6CE8\u610F\u529B
3. \u5185\u5BB9\u6709\u6D1E\u89C1\u3001\u6709\u60C5\u7EEA\u3001\u6709\u4EF7\u503C
4. \u7ED3\u5C3E\u6709\u5F15\u5BFC\u4E92\u52A8\u7684 CTA
\u4EE5 JSON \u8F93\u51FA\uFF1A{"title":"...","body":"..."}
\u53EA\u8F93\u51FA JSON\uFF0C\u4E0D\u8981\u6709\u5176\u4ED6\u6587\u5B57\u3002`;
function checkSystem(kind) {
  const checks = {
    resonance: `\u4F60\u662F\u5185\u5BB9\u5171\u9E23\u5EA6\u68C0\u6D4B\u4E13\u5BB6\u3002\u5206\u6790\u8FD9\u7BC7\u5185\u5BB9\u80FD\u5426\u5F15\u8D77\u76EE\u6807\u53D7\u4F17\u7684\u60C5\u7EEA\u5171\u9E23\u548C\u8BA4\u540C\u611F\u3002
\u8BC4\u4F30\u7EF4\u5EA6\uFF1A\u75DB\u70B9\u51FB\u4E2D\u5EA6\u3001\u60C5\u7EEA\u5F3A\u5EA6\u3001\u4EE3\u5165\u611F\u3001\u8BA4\u540C\u5EA6\u3002`,
    ai_flavor: `\u4F60\u662F AI \u75D5\u8FF9\u68C0\u6D4B\u4E13\u5BB6\u3002\u8BC6\u522B\u5185\u5BB9\u4E2D\u7684 AI \u5473\u9053\u2014\u2014\u7A7A\u6D1E\u7684\u6B63\u786E\u5E9F\u8BDD\u3001\u7F3A\u4E4F\u7EC6\u8282\u7684\u6982\u62EC\u3001\u4E0D\u81EA\u7136\u7684\u6392\u6BD4\u7B49\u3002
\u91CD\u70B9\u5173\u6CE8\uFF1A\u662F\u5426\u50CF\u771F\u4EBA\u8BF4\u8BDD\u3001\u6709\u65E0\u72EC\u7279\u89C6\u89D2\u3001\u662F\u5426\u6709\u53EF\u9A8C\u8BC1\u7684\u7EC6\u8282\u3002`,
    risk: `\u4F60\u662F\u5185\u5BB9\u5408\u89C4\u5BA1\u67E5\u4E13\u5BB6\u3002\u68C0\u67E5\u5185\u5BB9\u662F\u5426\u5B58\u5728\u8FDD\u89C4\u98CE\u9669\u2014\u2014\u5305\u62EC\u4F46\u4E0D\u9650\u4E8E\u5E7F\u544A\u6CD5\u7981\u7528\u8BCD\u3001\u7EDD\u5BF9\u5316\u7528\u8BED\u3001\u5938\u5927\u5BA3\u4F20\u3001\u654F\u611F\u8BDD\u9898\u3001\u7248\u6743\u98CE\u9669\u3002`,
    script_flow: `\u4F60\u662F\u53E3\u64AD\u7A3F\u5BA1\u6838\u4E13\u5BB6\u3002\u8BC4\u4F30\u8FD9\u7BC7\u53E3\u64AD\u7A3F\u7684\u6D41\u7545\u5EA6\u2014\u2014\u662F\u5426\u9002\u5408\u6717\u8BFB\u3001\u8282\u594F\u662F\u5426\u81EA\u7136\u3001\u662F\u5426\u6709\u62D7\u53E3\u7684\u53E5\u5B50\u3002`,
    title_cover_intro: `\u4F60\u662F\u6807\u9898\u5C01\u9762\u5F00\u5934\u5BA1\u6838\u4E13\u5BB6\u3002\u8BC4\u4F30\u6807\u9898\u7684\u70B9\u51FB\u7387\u6F5C\u529B\u3001\u5C01\u9762\u6587\u6848\u7684\u5438\u5F15\u529B\u3001\u5F00\u5934\u7684\u7559\u4EBA\u80FD\u529B\u3002
\u540C\u65F6\u63D0\u4F9B 5 \u4E2A\u5907\u9009\u6807\u9898\u5EFA\u8BAE\u3002`,
    spread: `\u4F60\u662F\u5185\u5BB9\u4F20\u64AD\u529B\u5206\u6790\u4E13\u5BB6\u3002\u8BC4\u4F30\u5185\u5BB9\u7684\u4F20\u64AD\u6F5C\u529B\u2014\u2014\u662F\u5426\u6709\u5206\u4EAB\u6B32\u3001\u662F\u5426\u89E6\u53D1\u793E\u4EA4\u8D27\u5E01\u3001\u662F\u5426\u6709\u4E89\u8BAE\u6027/\u5171\u8BC6\u6027\u3002`
  };
  return `${checks[kind]}
\u4EE5 JSON \u8F93\u51FA\uFF1A{"score": 0-100, "verdict": "\u4E00\u53E5\u8BDD\u603B\u7ED3", "issues": [{"severity":"high|medium|low","quote":"\u539F\u6587\u5F15\u7528","problem":"\u95EE\u9898","suggestion":"\u5EFA\u8BAE"}], "suggestions": ["..."]}
\u53EA\u8F93\u51FA JSON\uFF0C\u4E0D\u8981\u6709\u5176\u4ED6\u6587\u5B57\u3002`;
}
var ADAPT_SYSTEM = `\u4F60\u662F\u8D44\u6DF1\u591A\u5E73\u53F0\u5185\u5BB9\u8FD0\u8425\u4E13\u5BB6\u3002\u5C06\u7ED9\u5B9A\u7684\u8349\u7A3F\u9002\u914D\u5230\u6307\u5B9A\u5E73\u53F0\u3002
\u6BCF\u4E2A\u5E73\u53F0\u6709\u4E0D\u540C\u7684\u98CE\u683C\u3001\u957F\u5EA6\u9650\u5236\u548C\u6392\u7248\u89C4\u8303\uFF1A
- \u5C0F\u7EA2\u4E66\uFF1A\u6807\u9898\u8981\u6709 emoji\uFF0C\u6B63\u6587\u5206\u6BB5\u77ED\u5C0F\u3001\u79CD\u8349\u98CE\u3001\u5E26 hashtag
- \u6296\u97F3\uFF1A\u53E3\u64AD\u811A\u672C\u98CE\u683C\uFF0C\u8282\u594F\u5FEB\uFF0C\u5F00\u5934\u5373\u7206\u70B9
- \u516C\u4F17\u53F7\uFF1A\u6DF1\u5EA6\u957F\u6587\uFF0C\u6709\u903B\u8F91\u9012\u8FDB\uFF0C\u53EF\u52A0\u5C0F\u6807\u9898
- B \u7AD9\uFF1A\u8F7B\u677E\u6D3B\u6CFC\uFF0C\u6897\u591A\uFF0C\u9002\u5408\u5E74\u8F7B\u4EBA
- \u89C6\u9891\u53F7\uFF1A\u4E2D\u8001\u5E74\u53CB\u597D\uFF0C\u6734\u5B9E\u6E29\u6696
- X/Twitter\uFF1A\u6781\u7B80\u7CBE\u70BC\uFF0C280 \u5B57\u5185\uFF0C\u8BDD\u9898\u6027\u5F3A
\u4EE5 JSON \u8F93\u51FA\uFF1A{"title":"...","body":"...","coverText":"...","hashtags":["..."]}
\u53EA\u8F93\u51FA JSON\u3002`;
function apply(ctx, config) {
  const store = new WorkbenchStore(config.dataDir);
  const tikhub = new TikHubClient({
    baseUrl: config.tikhubBaseUrl,
    timeoutMs: config.tikhubTimeoutMs,
    apiKey: async () => {
      const secrets = await store.secrets();
      if (secrets.tikhubKey) return secrets.tikhubKey;
      const envKey = process.env[config.tikhubKeyEnv];
      return envKey || void 0;
    }
  });
  const llmEnv = { llm: ctx.llm, agentDefaultModel: ctx.agentDefaultModel, config };
  const opencli = new OpenCLIBridge({ timeoutMs: 12e4, throttleMinMs: 2e4, throttleMaxMs: 35e3 });
  const wenyan = new WenyanBridge({ timeoutMs: 12e4 });
  const isTikhubReady = async () => {
    const secrets = await store.secrets();
    return !!(secrets.tikhubKey || process.env[config.tikhubKeyEnv]);
  };
  ctx.tools.register(defineTool({
    name: "social_radar_video",
    description: "\u901A\u8FC7\u6296\u97F3\u5206\u4EAB\u94FE\u63A5\u6216\u5206\u4EAB\u6587\u672C\u63D0\u53D6\u89C6\u9891\u7684\u5B8C\u6574\u6570\u636E\uFF08\u64AD\u653E\u91CF\u3001\u70B9\u8D5E\u3001\u8BC4\u8BBA\u3001\u5206\u4EAB\u3001\u6536\u85CF\u3001\u4E92\u52A8\u7387\u3001\u4F5C\u8005\u4FE1\u606F\u7B49\uFF09\u3002",
    parameters: {
      share_text: { type: "string", required: true, description: "\u6296\u97F3\u5206\u4EAB\u94FE\u63A5\u6216\u5305\u542B\u94FE\u63A5\u7684\u5206\u4EAB\u6587\u672C" }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: true,
        properties: {
          id: { type: "string", required: true },
          platform: { type: "string", required: true },
          url: { type: "string", required: true },
          desc: { type: "string", required: true },
          author: { type: "object", additionalProperties: true, properties: { nickname: { type: "string", required: true } } },
          stats: {
            type: "object",
            additionalProperties: true,
            properties: {
              plays: { type: "integer", required: true },
              likes: { type: "integer", required: true },
              comments: { type: "integer", required: true }
            }
          },
          engagementRate: { type: "number", required: true }
        }
      },
      render: (_args, value) => {
        const v = value;
        return [{
          type: "text",
          text: `\u{1F3AC} **${v.desc?.slice(0, 60) || "(\u65E0\u63CF\u8FF0)"}**
\u4F5C\u8005: @${v.author.nickname} (${(v.author.followers / 1e4).toFixed(1)}w \u7C89)
\u25B6\uFE0F ${v.stats.plays.toLocaleString()} | \u2764\uFE0F ${v.stats.likes.toLocaleString()} | \u{1F4AC} ${v.stats.comments.toLocaleString()}
\u4E92\u52A8\u7387: ${(v.engagementRate * 100).toFixed(2)}%`
        }];
      }
    },
    timeoutMs: 12e4,
    async execute(args, exec3) {
      const useTikhub = await isTikhubReady();
      if (useTikhub) {
        return await tikhub.videoByShareUrl(args.share_text, exec3.signal);
      }
      const awemeIdMatch = args.share_text.match(/video\/(\d+)/);
      if (!awemeIdMatch) {
        throw new Error("\u672A\u914D\u7F6E TikHub API Key\uFF0COpenCLI \u9700\u8981\u89C6\u9891 aweme_id\uFF08\u65E0\u6CD5\u4ECE\u77ED\u94FE\u63A5\u63D0\u53D6\uFF09\u3002\u8BF7\u63D0\u4F9B\u5B8C\u6574\u89C6\u9891\u94FE\u63A5\uFF08\u542B /video/ID\uFF09\u3002");
      }
      const awemeId = awemeIdMatch[1];
      const stats = await opencli.douyinStats(awemeId);
      const statsMap = new Map(stats.map((s) => [s.metric, s.value]));
      const video = {
        id: awemeId,
        platform: "douyin",
        url: args.share_text,
        desc: String(statsMap.get("title") ?? ""),
        createTime: nowIso(),
        durationSec: 0,
        author: {
          id: "",
          secUid: "",
          nickname: String(statsMap.get("author") ?? "\u672A\u77E5"),
          followers: 0
        },
        stats: {
          plays: Number(statsMap.get("play_count") ?? statsMap.get("\u64AD\u653E") ?? 0),
          likes: Number(statsMap.get("digg_count") ?? statsMap.get("\u70B9\u8D5E") ?? 0),
          comments: Number(statsMap.get("comment_count") ?? statsMap.get("\u8BC4\u8BBA") ?? 0),
          shares: Number(statsMap.get("share_count") ?? statsMap.get("\u5206\u4EAB") ?? 0),
          collects: Number(statsMap.get("collect_count") ?? statsMap.get("\u6536\u85CF") ?? 0)
        },
        engagementRate: 0
      };
      const totalInteractions = video.stats.likes + video.stats.comments + video.stats.shares + video.stats.collects;
      video.engagementRate = video.stats.plays > 0 ? totalInteractions / video.stats.plays : 0;
      return video;
    }
  }));
  ctx.tools.register(defineTool({
    name: "social_radar_hot",
    description: "\u83B7\u53D6\u6296\u97F3\u5B9E\u65F6\u70ED\u641C\u699C\u5355\uFF0C\u4E86\u89E3\u5F53\u524D\u70ED\u70B9\u8BDD\u9898\u3002",
    parameters: {},
    output: {
      schema: {
        type: "object",
        additionalProperties: true,
        properties: {
          items: { type: "array", required: true, items: { type: "object", additionalProperties: true, properties: { rank: { type: "integer" }, word: { type: "string" }, hot: { type: "integer" } } } },
          fetchedAt: { type: "string", required: true }
        }
      },
      render: (_args, value) => {
        const hot = value;
        const lines = hot.items.slice(0, 20).map((i) => `${i.rank}. ${i.word}${i.label ? ` [${i.label}]` : ""} \u{1F525}${i.hot.toLocaleString()}`);
        return [{ type: "text", text: `\u{1F525} **\u6296\u97F3\u70ED\u641C** (${hot.fetchedAt})

${lines.join("\n")}` }];
      }
    },
    timeoutMs: 12e4,
    async execute(_args, exec3) {
      const useTikhub = await isTikhubReady();
      let items;
      if (useTikhub) {
        items = await tikhub.hotSearch(exec3.signal);
      } else {
        const cliItems = await opencli.douyinHot(30);
        items = cliItems.map((h, i) => ({
          rank: i + 1,
          word: h.name,
          hot: h.view_count,
          label: "\u70ED\u70B9"
        }));
      }
      const hotList = { platform: "douyin", fetchedAt: nowIso(), items };
      await store.mutate((data) => {
        data.hot = hotList;
      });
      return hotList;
    }
  }));
  ctx.tools.register(defineTool({
    name: "social_radar_scan",
    description: "\u626B\u63CF\u4E00\u4E2A\u6296\u97F3\u5BF9\u6807\u8D26\u53F7\u7684\u6700\u65B0\u4F5C\u54C1\uFF0C\u627E\u51FA\u7206\u6B3E\uFF08\u64AD\u653E\u91CF\u8D85\u4E2D\u4F4D\u6570 N \u500D\u7684\u5185\u5BB9\uFF09\u3002\u8F93\u5165 sec_uid \u6216\u7528\u6237\u4E3B\u9875\u94FE\u63A5\u3002",
    parameters: {
      identifier: { type: "string", required: true, description: "\u8D26\u53F7\u7684 sec_uid \u6216\u4E3B\u9875\u94FE\u63A5" },
      nickname: { type: "string", description: "\u8D26\u53F7\u6635\u79F0\uFF08\u53EF\u9009\uFF0C\u7528\u4E8E\u8BB0\u5F55\uFF09" },
      note: { type: "string", description: '\u5907\u6CE8\u6807\u7B7E\uFF0C\u5982"\u540C\u8D5B\u9053\u7ADE\u54C1""\u5B66\u4E60\u5BF9\u8C61"' }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: true,
        properties: {
          accountId: { type: "string", required: true },
          videos: { type: "array", required: true, items: { type: "object", additionalProperties: true, properties: {} } },
          outlierIds: { type: "array", required: true, items: { type: "string" } },
          medianPlays: { type: "number", required: true }
        }
      },
      render: (_args, value) => {
        const scan = value;
        const outliers = scan.videos.filter((v) => scan.outlierIds.includes(v.id));
        const lines = outliers.map(
          (v) => `  \u{1F525} ${v.desc.slice(0, 50)} \u2014 \u25B6\uFE0F${v.stats.plays.toLocaleString()} (${(v.engagementRate * 100).toFixed(1)}%)`
        );
        return [{
          type: "text",
          text: `\u{1F4CA} \u626B\u63CF\u5B8C\u6210\uFF1A${scan.videos.length} \u6761\u4F5C\u54C1\uFF0C\u4E2D\u4F4D\u6570\u64AD\u653E ${scan.medianPlays.toLocaleString()}` + (outliers.length > 0 ? `

\u{1F31F} **${outliers.length} \u6761\u7206\u6B3E\uFF1A**
${lines.join("\n")}` : "\n\u65E0\u660E\u663E\u7206\u6B3E")
        }];
      }
    },
    timeoutMs: 18e4,
    async execute(args, exec3) {
      const useTikhub = await isTikhubReady();
      let secUid = args.identifier;
      let videos;
      if (useTikhub) {
        if (secUid.startsWith("http")) {
          secUid = await tikhub.secUidFromUrl(secUid, exec3.signal);
        }
        videos = await tikhub.userPosts(secUid, config.scanPostCount, exec3.signal);
      } else {
        if (secUid.startsWith("http")) {
          const match = secUid.match(/user\/([A-Za-z0-9_-]+)/);
          if (match?.[1]) {
            secUid = match[1];
          } else {
            throw new Error("\u8BF7\u63D0\u4F9B\u7528\u6237 sec_uid \u6216\u5305\u542B /user/SEC_UID \u7684\u5B8C\u6574\u4E3B\u9875\u94FE\u63A5\u3002");
          }
        }
        const cliVideos = await opencli.douyinUserVideos(secUid, config.scanPostCount);
        videos = cliVideos.map((cv) => ({
          id: cv.aweme_id,
          platform: "douyin",
          url: `https://www.douyin.com/video/${cv.aweme_id}`,
          desc: cv.title,
          createTime: nowIso(),
          durationSec: cv.duration,
          author: {
            id: "",
            secUid,
            nickname: args.nickname ?? secUid.slice(0, 8),
            followers: 0
          },
          stats: {
            plays: 0,
            likes: cv.digg_count,
            comments: 0,
            shares: 0,
            collects: 0
          },
          engagementRate: 0
        }));
      }
      const plays = videos.map((v) => v.stats.plays || v.stats.likes);
      const med = median(plays);
      const outlierIds = videos.filter((v) => (v.stats.plays || v.stats.likes) > med * config.outlierFactor).map((v) => v.id);
      const accountId = await store.mutate((data) => {
        let account = data.accounts.find((a) => a.secUid === secUid);
        if (!account) {
          account = {
            id: newId("acct"),
            platform: "douyin",
            secUid,
            nickname: args.nickname ?? videos[0]?.author.nickname ?? secUid.slice(0, 8),
            note: args.note ?? "",
            followers: videos[0]?.author.followers ?? 0,
            addedAt: nowIso()
          };
          data.accounts.push(account);
        }
        account.lastScanAt = nowIso();
        if (args.nickname) account.nickname = args.nickname;
        if (args.note) account.note = args.note;
        const scan = {
          accountId: account.id,
          scannedAt: nowIso(),
          videos,
          outlierIds,
          medianPlays: med
        };
        data.scans.push(scan);
        return account.id;
      });
      return { accountId, scannedAt: nowIso(), videos, outlierIds, medianPlays: med };
    }
  }));
  ctx.tools.register(defineTool({
    name: "social_material_save",
    description: "\u4FDD\u5B58\u4E00\u6761\u7D20\u6750\u5230\u81EA\u5A92\u4F53\u5DE5\u4F5C\u53F0\uFF08\u968F\u624B\u8BB0\u3001\u53E3\u8FF0\u9010\u5B57\u7A3F\u3001\u7F51\u9875\u6458\u5F55\u3001\u5BF9\u6807\u5185\u5BB9\u3001\u8BC4\u8BBA\u533A\u53D1\u73B0\u7B49\uFF09\u3002",
    parameters: {
      source: { type: "string", required: true, description: "\u7D20\u6750\u6765\u6E90\uFF1Anote / transcript / link / competitor / comment" },
      title: { type: "string", required: true, description: "\u7D20\u6750\u6807\u9898" },
      content: { type: "string", required: true, description: "\u7D20\u6750\u6B63\u6587" },
      url: { type: "string", description: "\u6765\u6E90\u94FE\u63A5\uFF08\u53EF\u9009\uFF09" },
      tags: { type: "array", description: "\u6807\u7B7E", items: { type: "string" } }
    },
    output: {
      schema: { type: "object", additionalProperties: true, properties: { id: { type: "string", required: true }, title: { type: "string", required: true } } },
      render: (_args, value) => {
        const m = value;
        return [{ type: "text", text: `\u{1F4DD} \u5DF2\u4FDD\u5B58\u7D20\u6750\uFF1A**${m.title}** (${m.id})` }];
      }
    },
    async execute(args) {
      const material = {
        id: newId("mat"),
        source: args.source,
        title: args.title,
        content: args.content,
        url: args.url,
        tags: args.tags ?? [],
        createdAt: nowIso()
      };
      await store.mutate((data) => {
        data.materials.push(material);
      });
      return material;
    }
  }));
  ctx.tools.register(defineTool({
    name: "social_topic_extract",
    description: "\u4ECE\u5DE5\u4F5C\u53F0\u7D20\u6750\u4E2D AI \u63D0\u70BC\u9009\u9898\u3002\u53EF\u6307\u5B9A\u7D20\u6750 ID \u5217\u8868\uFF0C\u6216\u81EA\u52A8\u4F7F\u7528\u6700\u8FD1\u7684\u7D20\u6750\u3002",
    parameters: {
      material_ids: { type: "array", description: "\u7D20\u6750 ID \u5217\u8868\uFF0C\u4E3A\u7A7A\u5219\u4F7F\u7528\u6700\u8FD1 5 \u6761", items: { type: "string" } }
    },
    output: {
      schema: { type: "array", items: { type: "object", additionalProperties: true, properties: { title: { type: "string", required: true }, angle: { type: "string", required: true } } } },
      render: (_args, value) => {
        const topics = value;
        const lines = topics.map((t, i) => `${i + 1}. **${t.title}** \u2014 ${t.angle}`);
        return [{ type: "text", text: `\u{1F4A1} \u63D0\u70BC\u51FA ${topics.length} \u4E2A\u9009\u9898\uFF1A

${lines.join("\n")}` }];
      }
    },
    timeoutMs: config.llmTimeoutMs + 1e4,
    async execute(args, exec3) {
      const data = await store.read();
      let materials;
      if (args.material_ids && args.material_ids.length > 0) {
        materials = data.materials.filter((m) => args.material_ids.includes(m.id));
      } else {
        materials = data.materials.slice(-5);
      }
      if (materials.length === 0) throw new Error("\u6CA1\u6709\u53EF\u7528\u7684\u7D20\u6750\u3002\u8BF7\u5148\u4FDD\u5B58\u4E00\u4E9B\u7D20\u6750\u3002");
      const profile = profileContext(data.profile);
      const materialsText = materials.map((m, i) => `\u3010\u7D20\u6750${i + 1}: ${m.title}\u3011
${m.content}`).join("\n\n");
      const prompt = `${profile}

## \u7D20\u6750
${materialsText}

\u8BF7\u4ECE\u4EE5\u4E0A\u7D20\u6750\u4E2D\u63D0\u70BC\u9009\u9898\u3002`;
      const raw = await llmGenerate(llmEnv, TOPIC_EXTRACT_SYSTEM, prompt, exec3.signal);
      const parsed = JSON.parse(raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
      const topics = await store.mutate((d) => {
        return parsed.map((t) => {
          const topic = {
            id: newId("topic"),
            title: t.title,
            angle: t.angle,
            audience: t.audience ?? "",
            hook: t.hook ?? "",
            quotes: t.quotes ?? [],
            materialIds: materials.map((m) => m.id),
            status: "new",
            score: 0,
            createdAt: nowIso()
          };
          d.topics.push(topic);
          return topic;
        });
      });
      return topics;
    }
  }));
  ctx.tools.register(defineTool({
    name: "social_draft_write",
    description: "\u4E3A\u6307\u5B9A\u9009\u9898 AI \u8D77\u8349\u4E00\u7BC7\u5185\u5BB9\u3002\u53EF\u9009\u76EE\u6807\u5E73\u53F0\u3002",
    parameters: {
      topic_id: { type: "string", required: true, description: "\u9009\u9898 ID" },
      platform: { type: "string", description: "\u76EE\u6807\u5E73\u53F0\uFF1Axiaohongshu / douyin / wechat / bilibili / shipinhao / twitter" },
      extra_instructions: { type: "string", description: "\u989D\u5916\u5199\u4F5C\u6307\u4EE4" }
    },
    output: {
      schema: { type: "object", additionalProperties: true, properties: { id: { type: "string", required: true }, title: { type: "string", required: true }, body: { type: "string", required: true } } },
      render: (_args, value) => {
        const draft = value;
        return [{ type: "text", text: `\u270D\uFE0F **${draft.title}**

${draft.body.slice(0, 300)}${draft.body.length > 300 ? "\u2026" : ""}` }];
      }
    },
    timeoutMs: config.llmTimeoutMs + 1e4,
    async execute(args, exec3) {
      const data = await store.read();
      const topic = data.topics.find((t) => t.id === args.topic_id);
      if (!topic) throw new Error(`\u672A\u627E\u5230\u9009\u9898 ${args.topic_id}`);
      const profile = profileContext(data.profile);
      const platform = args.platform ?? "xiaohongshu";
      const prompt = [
        profile,
        `
## \u9009\u9898\u4FE1\u606F`,
        `\u6807\u9898\uFF1A${topic.title}`,
        `\u5207\u5165\u89D2\u5EA6\uFF1A${topic.angle}`,
        `\u76EE\u6807\u53D7\u4F17\uFF1A${topic.audience}`,
        `\u94A9\u5B50\uFF1A${topic.hook}`,
        topic.quotes.length > 0 ? `\u539F\u59CB\u7D20\u6750\u5F15\u7528\uFF1A
${topic.quotes.map((q) => `> ${q}`).join("\n")}` : "",
        `
\u76EE\u6807\u5E73\u53F0\uFF1A${platform}`,
        args.extra_instructions ? `
\u989D\u5916\u8981\u6C42\uFF1A${args.extra_instructions}` : ""
      ].filter(Boolean).join("\n");
      const raw = await llmGenerate(llmEnv, DRAFT_WRITE_SYSTEM, prompt, exec3.signal);
      const parsed = JSON.parse(raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
      const draft = await store.mutate((d) => {
        const newDraft = {
          id: newId("draft"),
          topicId: topic.id,
          title: parsed.title,
          body: parsed.body,
          platform,
          status: "writing",
          versions: [],
          checks: [],
          publishResults: [],
          createdAt: nowIso(),
          updatedAt: nowIso()
        };
        d.drafts.push(newDraft);
        const t = d.topics.find((x) => x.id === topic.id);
        if (t) t.status = "drafted";
        return newDraft;
      });
      return draft;
    }
  }));
  ctx.tools.register(defineTool({
    name: "social_draft_check",
    description: '\u5BF9\u5185\u5BB9\u8349\u7A3F\u8FDB\u884C\u53D1\u5E03\u524D"\u4F53\u68C0"\uFF1A\u5171\u9E23\u68C0\u67E5\u3001AI \u5473\u68C0\u6D4B\u3001\u8FDD\u89C4\u98CE\u9669\u3001\u53E3\u64AD\u6D41\u7545\u5EA6\u3001\u6807\u9898\u5C01\u9762\u5F00\u5934\u3001\u4F20\u64AD\u5206\u6790\u3002\u53EF\u9009\u62E9\u5355\u9879\u6216\u5168\u90E8\u3002',
    parameters: {
      draft_id: { type: "string", required: true, description: "\u8349\u7A3F ID" },
      checks: { type: "array", description: "\u8981\u6267\u884C\u7684\u68C0\u67E5\u9879\uFF08\u7559\u7A7A=\u5168\u90E8\uFF09\uFF1Aresonance / ai_flavor / risk / script_flow / title_cover_intro / spread", items: { type: "string" } }
    },
    output: {
      schema: { type: "array", items: { type: "object", additionalProperties: true, properties: { kind: { type: "string", required: true }, score: { type: "integer", required: true }, verdict: { type: "string", required: true } } } },
      render: (_args, value) => {
        const reports = value;
        const avg = Math.round(reports.reduce((s, r) => s + r.score, 0) / reports.length);
        const lines = reports.map((r) => {
          const icon = r.score >= 80 ? "\u2705" : r.score >= 60 ? "\u26A0\uFE0F" : "\u274C";
          return `${icon} **${r.kind}** ${r.score}/100 \u2014 ${r.verdict}`;
        });
        return [{ type: "text", text: `\u{1F4CB} **\u4F53\u68C0\u62A5\u544A** \u7EFC\u5408\u5F97\u5206 ${avg}/100

${lines.join("\n")}` }];
      }
    },
    timeoutMs: config.llmTimeoutMs * 6 + 3e4,
    async execute(args, exec3) {
      const data = await store.read();
      const draft = data.drafts.find((d) => d.id === args.draft_id);
      if (!draft) throw new Error(`\u672A\u627E\u5230\u8349\u7A3F ${args.draft_id}`);
      const kindsToRun = args.checks && args.checks.length > 0 ? args.checks.filter((k) => CHECK_KINDS.includes(k)) : [...CHECK_KINDS];
      const profile = profileContext((await store.read()).profile);
      const content = `${profile}

## \u5F85\u68C0\u67E5\u5185\u5BB9
\u6807\u9898\uFF1A${draft.title}
\u5E73\u53F0\uFF1A${draft.platform}

${draft.body}`;
      const reports = [];
      for (const kind of kindsToRun) {
        if (exec3.signal?.aborted) break;
        const raw = await llmGenerate(llmEnv, checkSystem(kind), content, exec3.signal);
        try {
          const parsed = JSON.parse(raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
          reports.push({
            kind,
            score: parsed.score,
            verdict: parsed.verdict,
            issues: parsed.issues ?? [],
            suggestions: parsed.suggestions ?? [],
            createdAt: nowIso()
          });
        } catch {
          reports.push({ kind, score: 0, verdict: "\u89E3\u6790\u5931\u8D25", issues: [], suggestions: [], createdAt: nowIso() });
        }
      }
      await store.mutate((d) => {
        const target = d.drafts.find((x) => x.id === draft.id);
        if (target) {
          target.checks = reports;
          target.status = "reviewing";
          target.updatedAt = nowIso();
        }
      });
      return reports;
    }
  }));
  ctx.tools.register(defineTool({
    name: "social_draft_adapt",
    description: "\u5C06\u4E00\u7BC7\u8349\u7A3F\u6539\u5199\u9002\u914D\u5230\u5176\u4ED6\u5E73\u53F0\uFF08\u5C0F\u7EA2\u4E66\u3001\u6296\u97F3\u3001\u516C\u4F17\u53F7\u3001B\u7AD9\u3001\u89C6\u9891\u53F7\u3001X\uFF09\u3002",
    parameters: {
      draft_id: { type: "string", required: true, description: "\u8349\u7A3F ID" },
      target_platforms: { type: "array", required: true, description: "\u76EE\u6807\u5E73\u53F0\u5217\u8868", items: { type: "string" } }
    },
    output: {
      schema: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: true,
          properties: {
            platform: { type: "string", required: true },
            title: { type: "string", required: true },
            body: { type: "string", required: true }
          }
        }
      },
      render: (_args, value) => {
        const versions = value;
        const lines = versions.map((v) => `\u{1F4F1} **${v.platform}**: ${v.title}`);
        return [{ type: "text", text: `\u{1F504} \u5DF2\u9002\u914D ${versions.length} \u4E2A\u5E73\u53F0\u7248\u672C\uFF1A

${lines.join("\n")}` }];
      }
    },
    timeoutMs: config.llmTimeoutMs * 6 + 3e4,
    async execute(args, exec3) {
      const data = await store.read();
      const draft = data.drafts.find((d) => d.id === args.draft_id);
      if (!draft) throw new Error(`\u672A\u627E\u5230\u8349\u7A3F ${args.draft_id}`);
      const targets = args.target_platforms.filter((p) => PLATFORMS.includes(p));
      if (targets.length === 0) throw new Error("\u8BF7\u6307\u5B9A\u81F3\u5C11\u4E00\u4E2A\u6709\u6548\u5E73\u53F0");
      const profile = profileContext((await store.read()).profile);
      const versions = [];
      for (const platform of targets) {
        if (exec3.signal?.aborted) break;
        const prompt = `${profile}

## \u539F\u59CB\u8349\u7A3F
\u6807\u9898\uFF1A${draft.title}
\u539F\u5E73\u53F0\uFF1A${draft.platform}

${draft.body}

\u8BF7\u9002\u914D\u5230\u5E73\u53F0\uFF1A${platform}`;
        const raw = await llmGenerate(llmEnv, ADAPT_SYSTEM, prompt, exec3.signal);
        try {
          const parsed = JSON.parse(raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
          versions.push({
            platform,
            title: parsed.title,
            body: parsed.body,
            coverText: parsed.coverText ?? "",
            hashtags: parsed.hashtags ?? [],
            updatedAt: nowIso()
          });
        } catch {
          versions.push({ platform, title: `${draft.title} (${platform})`, body: draft.body, coverText: "", hashtags: [], updatedAt: nowIso() });
        }
      }
      await store.mutate((d) => {
        const target = d.drafts.find((x) => x.id === draft.id);
        if (target) {
          for (const v of versions) {
            const existing = target.versions.findIndex((x) => x.platform === v.platform);
            if (existing >= 0) target.versions[existing] = v;
            else target.versions.push(v);
          }
          target.updatedAt = nowIso();
        }
      });
      return versions;
    }
  }));
  ctx.tools.register(defineTool({
    name: "social_publish",
    description: "\u901A\u8FC7 OpenCLI \u81EA\u52A8\u53D1\u5E03\u8349\u7A3F\u5230\u76EE\u6807\u5E73\u53F0\u3002\u9700\u8981\u7528\u6237\u5DF2\u5B89\u88C5 opencli \u5E76\u767B\u5F55\u5BF9\u5E94\u5E73\u53F0\u3002\u5F53\u524D\u652F\u6301\u5C0F\u7EA2\u4E66\u548C X/Twitter\u3002",
    parameters: {
      draft_id: { type: "string", required: true, description: "\u8349\u7A3F ID" },
      platform: { type: "string", description: "\u76EE\u6807\u5E73\u53F0\uFF08\u9ED8\u8BA4\u4F7F\u7528\u8349\u7A3F\u539F\u59CB\u5E73\u53F0\uFF09\u3002\u652F\u6301 xiaohongshu, twitter" }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: true,
        properties: {
          platform: { type: "string", required: true },
          publishedAt: { type: "string", required: true }
        }
      },
      render(_args, value) {
        const lines = [`\u2705 \u5DF2\u53D1\u5E03\u5230 ${value.platform}`];
        if ("url" in value && typeof value.url === "string") lines.push(`\u{1F517} ${value.url}`);
        lines.push(`\u{1F4C5} ${value.publishedAt}`);
        return [{ type: "text", text: lines.join("\n") }];
      }
    },
    timeoutMs: 18e4,
    async execute(args) {
      const data = await store.read();
      const draft = data.drafts.find((d) => d.id === args.draft_id);
      if (!draft) throw new Error(`\u8349\u7A3F\u4E0D\u5B58\u5728\uFF1A${args.draft_id}`);
      if (draft.status === "published") throw new Error("\u8349\u7A3F\u5DF2\u53D1\u5E03");
      const targetPlatform = args.platform ?? draft.platform;
      const version = draft.versions.find((v) => v.platform === targetPlatform);
      const title = version?.title ?? draft.title;
      const body = version?.body ?? draft.body;
      const hashtags = version?.hashtags ?? [];
      const result = await opencli.publish(targetPlatform, { title, content: body, hashtags });
      const publishResult = {
        platform: targetPlatform,
        url: result.url,
        publishedAt: nowIso(),
        opencliOutput: result.output
      };
      await store.mutate((d) => {
        const target = d.drafts.find((x) => x.id === draft.id);
        if (target) {
          if (!target.publishResults) target.publishResults = [];
          target.publishResults.push(publishResult);
          target.status = "published";
          target.updatedAt = nowIso();
        }
      });
      return publishResult;
    }
  }));
  ctx.tools.register(defineTool({
    name: "social_trending",
    description: "\u901A\u8FC7 OpenCLI \u83B7\u53D6\u591A\u5E73\u53F0\u70ED\u641C/\u70ED\u95E8\u8D8B\u52BF\uFF08B\u7AD9\u3001\u77E5\u4E4E\u7B49\uFF09\uFF0C\u53D1\u73B0\u5185\u5BB9\u7075\u611F\u3002\u9700\u8981\u7528\u6237\u5DF2\u5B89\u88C5 opencli\u3002",
    parameters: {},
    output: {
      schema: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: true,
          properties: {
            platform: { type: "string", required: true },
            title: { type: "string", required: true },
            heat: { type: "number", required: true }
          }
        }
      },
      render(_args, value) {
        const items = value;
        const byPlatform = {};
        for (const item of items) {
          const key = item.platform;
          if (!byPlatform[key]) byPlatform[key] = [];
          byPlatform[key].push(item);
        }
        const lines = [`\u{1F525} \u83B7\u53D6\u5230 ${items.length} \u6761\u70ED\u641C\u8D8B\u52BF`];
        for (const [platform, pItems] of Object.entries(byPlatform)) {
          lines.push(`
**${platform}:**`);
          for (const item of pItems.slice(0, 5)) {
            lines.push(`  ${item.rank}. ${item.title} (\u70ED\u5EA6 ${item.heat.toLocaleString()})`);
          }
        }
        return [{ type: "text", text: lines.join("\n") }];
      }
    },
    timeoutMs: 6e4,
    async execute() {
      const items = await opencli.fetchAllTrending();
      return items;
    }
  }));
  ctx.tools.register(defineTool({
    name: "social_xhs_search",
    description: "\u901A\u8FC7 OpenCLI \u5728\u5C0F\u7EA2\u4E66\u4E0A\u641C\u7D22\u5185\u5BB9\uFF0C\u4E86\u89E3\u7ADE\u54C1\u548C\u5E02\u573A\u52A8\u6001\u3002\u9700\u8981\u7528\u6237\u5DF2\u5B89\u88C5 opencli \u5E76\u767B\u5F55\u5C0F\u7EA2\u4E66\u3002",
    parameters: {
      query: { type: "string", required: true, description: "\u641C\u7D22\u5173\u952E\u8BCD" },
      limit: { type: "number", description: "\u8FD4\u56DE\u6761\u6570\uFF08\u9ED8\u8BA4 10\uFF09" }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: true,
        properties: {
          items: { type: "array", required: true, items: { type: "object", additionalProperties: true } }
        }
      },
      render(_args, value) {
        const items = value.items ?? [];
        const lines = [`\u{1F4D5} \u5C0F\u7EA2\u4E66\u641C\u7D22\u7ED3\u679C\uFF08${items.length} \u6761\uFF09\uFF1A
`];
        for (const item of items.slice(0, 10)) {
          lines.push(`\u2022 **${String(item.title ?? "")}** \u2014 \u2764\uFE0F ${item.likes ?? 0} \u{1F4D1} ${item.collects ?? 0}`);
        }
        return [{ type: "text", text: lines.join("\n") }];
      }
    },
    timeoutMs: 6e4,
    async execute(args) {
      const result = await opencli.xhsSearch(args.query, typeof args.limit === "number" ? args.limit : 10);
      return result;
    }
  }));
  ctx.tools.register(defineTool({
    name: "social_wechat_render",
    description: "\u4F7F\u7528\u6587\u989C(wenyan)\u5C06 Markdown \u5185\u5BB9\u6E32\u67D3\u4E3A\u5FAE\u4FE1\u516C\u4F17\u53F7\u9002\u914D\u7684 HTML \u6392\u7248\u3002\u652F\u6301\u591A\u79CD\u4E3B\u9898\u3002\u9700\u5B89\u88C5 wenyan CLI\u3002",
    parameters: {
      markdown: { type: "string", required: true, description: "Markdown \u5185\u5BB9\uFF08\u542B frontmatter\uFF1Atitle, cover, author\uFF09" },
      theme: { type: "string", description: "\u6392\u7248\u4E3B\u9898\u540D\u79F0\uFF08\u53EF\u9009\uFF09" }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: true,
        properties: {
          html: { type: "string", required: true }
        }
      },
      render(_args, value) {
        const htmlLen = typeof value.html === "string" ? value.html.length : 0;
        return [{ type: "text", text: `\u2705 \u5DF2\u6E32\u67D3\u516C\u4F17\u53F7 HTML\uFF08${htmlLen} \u5B57\u7B26\uFF09` }];
      }
    },
    timeoutMs: 6e4,
    async execute(args) {
      const result = await wenyan.render(args.markdown, {
        theme: typeof args.theme === "string" ? args.theme : void 0
      });
      return { html: result.html };
    }
  }));
  ctx.tools.register(defineTool({
    name: "social_wechat_publish",
    description: "\u901A\u8FC7\u6587\u989C(wenyan)\u5C06 Markdown \u8349\u7A3F\u53D1\u5E03\u5230\u5FAE\u4FE1\u516C\u4F17\u53F7\u8349\u7A3F\u7BB1\u3002\u9700\u5B89\u88C5 wenyan CLI \u5E76\u914D\u7F6E WECHAT_APP_ID \u548C WECHAT_APP_SECRET\u3002",
    parameters: {
      draft_id: { type: "string", required: true, description: "\u8349\u7A3F ID" },
      theme: { type: "string", description: "\u6392\u7248\u4E3B\u9898\uFF08\u53EF\u9009\uFF09" }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: true,
        properties: {
          success: { type: "boolean", required: true },
          platform: { type: "string", required: true }
        }
      },
      render(_args, value) {
        if (value.success) {
          return [{ type: "text", text: "\u2705 \u5DF2\u63A8\u9001\u5230\u5FAE\u4FE1\u516C\u4F17\u53F7\u8349\u7A3F\u7BB1\uFF01" }];
        }
        const msg = "message" in value ? String(value.message) : "\u53D1\u5E03\u5931\u8D25";
        return [{ type: "text", text: `\u274C ${msg}` }];
      }
    },
    timeoutMs: 18e4,
    async execute(args) {
      const data = await store.read();
      const draft = data.drafts.find((d) => d.id === args.draft_id);
      if (!draft) throw new Error(`\u8349\u7A3F\u4E0D\u5B58\u5728\uFF1A${args.draft_id}`);
      const version = draft.versions.find((v) => v.platform === "wechat");
      const title = version?.title ?? draft.title;
      const body = version?.body ?? draft.body;
      const markdown = [
        "---",
        `title: ${title}`,
        `author: ${data.profile.name || ""}`,
        "---",
        "",
        body
      ].join("\n");
      const result = await wenyan.publish(markdown, {
        theme: typeof args.theme === "string" ? args.theme : void 0
      });
      if (result.success) {
        const publishResult = {
          platform: "wechat",
          publishedAt: nowIso(),
          opencliOutput: result.output
        };
        await store.mutate((d) => {
          const target = d.drafts.find((x) => x.id === draft.id);
          if (target) {
            if (!target.publishResults) target.publishResults = [];
            target.publishResults.push(publishResult);
            if (target.status !== "published") target.status = "published";
            target.updatedAt = nowIso();
          }
        });
      }
      return { success: result.success, platform: "wechat", message: result.message, mediaId: result.mediaId };
    }
  }));
  ctx.tools.register(defineTool({
    name: "social_title_gen",
    description: "\u4E3A\u8349\u7A3F\u751F\u6210 10 \u4E2A\u7206\u6B3E\u6807\u9898\u5019\u9009\u3002\u501F\u9274\u5C0F\u7EA2\u4E66/\u6296\u97F3/\u516C\u4F17\u53F7\u7684\u7206\u6B3E\u6807\u9898\u516C\u5F0F\uFF08\u6570\u5B57\u6CD5\u3001\u60AC\u5FF5\u6CD5\u3001\u5BF9\u6BD4\u6CD5\u3001\u8E6D\u70ED\u70B9\u7B49\uFF09\uFF0C\u751F\u6210\u9002\u5408\u76EE\u6807\u5E73\u53F0\u98CE\u683C\u7684\u6807\u9898\u3002",
    parameters: {
      draft_id: { type: "string", required: true, description: "\u8349\u7A3F ID" },
      platform: { type: "string", description: "\u8986\u76D6\u76EE\u6807\u5E73\u53F0\uFF08\u9ED8\u8BA4\u7528\u8349\u7A3F\u672C\u8EAB\u7684\u5E73\u53F0\uFF09" }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: true,
        properties: {
          titles: { type: "array", items: { type: "string" }, required: true }
        }
      },
      render(_args, value) {
        const titles = Array.isArray(value.titles) ? value.titles : [];
        if (titles.length === 0) return [{ type: "text", text: "\u672A\u80FD\u751F\u6210\u6807\u9898" }];
        return [{ type: "text", text: `\u{1F525} ${titles.length} \u4E2A\u7206\u6B3E\u6807\u9898\u5019\u9009\uFF1A

${titles.map((t, i) => `${i + 1}. ${t}`).join("\n")}` }];
      }
    },
    timeoutMs: config.llmTimeoutMs + 1e4,
    async execute(args) {
      const data = await store.read();
      const draft = data.drafts.find((d) => d.id === args.draft_id);
      if (!draft) throw new Error(`\u8349\u7A3F\u4E0D\u5B58\u5728\uFF1A${args.draft_id}`);
      const platform = typeof args.platform === "string" ? args.platform : draft.platform;
      const system = `\u4F60\u662F\u8D44\u6DF1\u81EA\u5A92\u4F53\u6807\u9898\u4F18\u5316\u4E13\u5BB6\u3002\u4F60\u9700\u8981\u4E3A\u7528\u6237\u7684\u5185\u5BB9\u751F\u6210 10 \u4E2A\u7206\u6B3E\u6807\u9898\u5019\u9009\u3002

\u76EE\u6807\u5E73\u53F0\uFF1A${platform}

\u7206\u6B3E\u6807\u9898\u516C\u5F0F\uFF1A
1. \u6570\u5B57\u6CD5\uFF1A\u300C3 \u4E2A\u65B9\u6CD5\u8BA9\u4F60...\u300D\u300C90% \u7684\u4EBA\u4E0D\u77E5\u9053\u7684...\u300D
2. \u60AC\u5FF5\u6CD5\uFF1A\u300C\u6211\u7EC8\u4E8E\u53D1\u73B0\u4E86...\u7684\u79D8\u5BC6\u300D\u300C\u5343\u4E07\u522B...\u5426\u5219...\u300D
3. \u5BF9\u6BD4\u6CD5\uFF1A\u300C\u6708\u85AA 3000 \u548C\u6708\u85AA 30000 \u7684\u533A\u522B\u300D
4. \u60C5\u7EEA\u6CD5\uFF1A\u300C\u770B\u5B8C\u6211\u6C89\u9ED8\u4E86\u300D\u300C\u592A\u79BB\u8C31\u4E86\uFF01\u300D
5. \u8EAB\u4EFD\u8BA4\u540C\uFF1A\u300C\u6253\u5DE5\u4EBA\u5FC5\u770B\u300D\u300C\u5B9D\u5988\u6536\u85CF\u300D
6. \u65F6\u6548\u6CD5\uFF1A\u300C2024 \u6700\u65B0\u300D\u300C\u521A\u521A\u53D1\u73B0\u300D
7. \u5229\u4ED6\u6CD5\uFF1A\u300C\u6559\u4F60\u4E00\u62DB\u300D\u300C\u5EFA\u8BAE\u6536\u85CF\u300D

\u4EE5 JSON \u6570\u7EC4\u8F93\u51FA 10 \u4E2A\u6807\u9898\uFF0C\u53EA\u8F93\u51FA JSON \u6570\u7EC4\u3002`;
      const raw = await llmGenerate(llmEnv, system, `\u6807\u9898\uFF1A${draft.title}

\u6B63\u6587\u6458\u8981\uFF1A${draft.body.slice(0, 500)}`, void 0);
      const match = raw.match(/\[[\s\S]*\]/);
      const titles = match ? JSON.parse(match[0]) : [];
      return { titles };
    }
  }));
  ctx.tools.register(defineTool({
    name: "social_weekly_plan",
    description: "\u6839\u636E\u521B\u4F5C\u8005\u753B\u50CF\u548C\u7D20\u6750\u5E93\uFF0C\u751F\u6210 7 \u5929\u5185\u5BB9\u53D1\u5E03\u8BA1\u5212\u3002\u5305\u542B\u6BCF\u5929\u7684\u4E3B\u9898\u3001\u6807\u9898\u5EFA\u8BAE\u3001\u76EE\u6807\u5E73\u53F0\u548C\u53D1\u5E03\u65F6\u95F4\u5EFA\u8BAE\u3002",
    parameters: {
      focus: { type: "string", description: "\u672C\u5468\u91CD\u70B9\u65B9\u5411\uFF08\u53EF\u9009\uFF09" }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: true,
        properties: {
          plan: { type: "array", items: { type: "object", additionalProperties: true }, required: true }
        }
      },
      render(_args, value) {
        const plan = Array.isArray(value.plan) ? value.plan : [];
        if (plan.length === 0) return [{ type: "text", text: "\u672A\u80FD\u751F\u6210\u8BA1\u5212" }];
        return [{ type: "text", text: `\u{1F4C6} 7 \u5929\u5185\u5BB9\u8BA1\u5212\uFF1A

${plan.map((p) => `**${p.day}** | ${p.platform} | ${p.time}
\u{1F4CC} ${p.theme}
\u{1F4A1} ${p.title}`).join("\n\n")}` }];
      }
    },
    timeoutMs: config.llmTimeoutMs * 2 + 1e4,
    async execute(args) {
      const data = await store.read();
      const profile = data.profile;
      const focus = typeof args.focus === "string" ? args.focus : "";
      const recentTopics = data.topics.slice(-10).map((t) => t.title).join("\u3001");
      const recentMaterials = data.materials.slice(-10).map((m) => m.title).join("\u3001");
      const system = `\u4F60\u662F\u8D44\u6DF1\u81EA\u5A92\u4F53\u5185\u5BB9\u7B56\u7565\u5E08\u3002\u6839\u636E\u521B\u4F5C\u8005\u753B\u50CF\u548C\u5DF2\u6709\u7D20\u6750\uFF0C\u5236\u5B9A 7 \u5929\u5185\u5BB9\u53D1\u5E03\u8BA1\u5212\u3002

\u521B\u4F5C\u8005\u753B\u50CF\uFF1A
- \u540D\u79F0\uFF1A${profile.name}
- \u8D5B\u9053\uFF1A${profile.niche}
- \u53D7\u4F17\uFF1A${profile.audience}
- \u5B9A\u4F4D\uFF1A${profile.offer}
${focus ? `- \u672C\u5468\u91CD\u70B9\uFF1A${focus}` : ""}

\u5DF2\u6709\u9009\u9898\u53C2\u8003\uFF1A${recentTopics || "\u65E0"}
\u5DF2\u6709\u7D20\u6750\u53C2\u8003\uFF1A${recentMaterials || "\u65E0"}

\u8981\u6C42\uFF1A
1. \u6BCF\u5929 1 \u6761\u5185\u5BB9\uFF0C\u8986\u76D6\u4E0D\u540C\u5E73\u53F0\uFF08\u5C0F\u7EA2\u4E66\u3001\u6296\u97F3\u3001\u516C\u4F17\u53F7\u3001B\u7AD9\u3001\u89C6\u9891\u53F7\u3001X \u5404\u81F3\u5C11 1 \u6761\uFF09
2. \u5185\u5BB9\u4E3B\u9898\u6709\u8282\u594F\u611F\uFF08\u77E5\u8BC6/\u6545\u4E8B/\u4E92\u52A8/\u5E72\u8D27/\u70ED\u70B9 \u7A7F\u63D2\uFF09
3. \u5EFA\u8BAE\u6700\u4F73\u53D1\u5E03\u65F6\u95F4
4. \u6807\u9898\u8981\u6709\u7F51\u611F\u548C\u5438\u5F15\u529B

\u4EE5 JSON \u6570\u7EC4\u8F93\u51FA\uFF0C\u6BCF\u9879\u5305\u542B { day, theme, title, platform, time, type }\uFF0C\u53EA\u8F93\u51FA JSON\u3002`;
      const raw = await llmGenerate(llmEnv, system, `\u8BF7\u751F\u6210\u672C\u5468\u5185\u5BB9\u8BA1\u5212`, void 0);
      const match = raw.match(/\[[\s\S]*\]/);
      const plan = match ? JSON.parse(match[0]) : [];
      return { plan };
    }
  }));
  ctx.tools.register(defineTool({
    name: "social_content_score",
    description: "\u5BF9\u8349\u7A3F\u8FDB\u884C\u7EFC\u5408\u8BC4\u5206\uFF080-100\uFF09\uFF0C\u7ED9\u51FA\u5404\u7EF4\u5EA6\u8BC4\u5206\u548C\u6539\u8FDB\u5EFA\u8BAE\u3002\u7EF4\u5EA6\uFF1A\u6807\u9898\u5438\u5F15\u529B\u3001\u5185\u5BB9\u4EF7\u503C\u3001\u5E73\u53F0\u9002\u914D\u3001\u60C5\u7EEA\u5171\u9E23\u3001\u7ED3\u6784\u6E05\u6670\u5EA6\u3001\u53D1\u5E03\u65F6\u673A\u3002",
    parameters: {
      draft_id: { type: "string", required: true, description: "\u8349\u7A3F ID" }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: true,
        properties: {
          total: { type: "number", required: true },
          grade: { type: "string", required: true }
        }
      },
      render(_args, value) {
        const total = typeof value.total === "number" ? value.total : 0;
        const grade = typeof value.grade === "string" ? value.grade : "?";
        const dims = Array.isArray(value.dimensions) ? value.dimensions : [];
        const lines = [`\u{1F4CA} \u5185\u5BB9\u8BC4\u5206\uFF1A${total}/100 (${grade})`, ""];
        for (const d of dims) {
          const bar = "\u2588".repeat(Math.round(d.score / 10)) + "\u2591".repeat(10 - Math.round(d.score / 10));
          lines.push(`${d.name} ${bar} ${d.score}/100`);
          lines.push(`  \u{1F4A1} ${d.feedback}`);
        }
        return [{ type: "text", text: lines.join("\n") }];
      }
    },
    timeoutMs: config.llmTimeoutMs + 1e4,
    async execute(args) {
      const data = await store.read();
      const draft = data.drafts.find((d) => d.id === args.draft_id);
      if (!draft) throw new Error(`\u8349\u7A3F\u4E0D\u5B58\u5728\uFF1A${args.draft_id}`);
      const system = `\u4F60\u662F\u5185\u5BB9\u8D28\u91CF\u8BC4\u4F30\u4E13\u5BB6\u3002\u5BF9\u4EE5\u4E0B\u81EA\u5A92\u4F53\u5185\u5BB9\u8FDB\u884C\u591A\u7EF4\u5EA6\u8BC4\u5206\uFF08\u6BCF\u9879 0-100\uFF09\uFF1A

\u7EF4\u5EA6\uFF1A
1. title_appeal - \u6807\u9898\u5438\u5F15\u529B\uFF1A\u662F\u5426\u6709\u597D\u5947\u5FC3\u7F3A\u53E3\u3001\u60C5\u7EEA\u70B9\u3001\u6570\u5B57
2. content_value - \u5185\u5BB9\u4EF7\u503C\uFF1A\u662F\u5426\u6709\u5E72\u8D27/\u6545\u4E8B/\u5171\u9E23/\u65B0\u77E5
3. platform_fit - \u5E73\u53F0\u9002\u914D\uFF1A\u662F\u5426\u7B26\u5408\u76EE\u6807\u5E73\u53F0\u98CE\u683C\u548C\u89C4\u8303
4. emotional - \u60C5\u7EEA\u5171\u9E23\uFF1A\u662F\u5426\u80FD\u5F15\u53D1\u70B9\u8D5E/\u6536\u85CF/\u8BC4\u8BBA
5. structure - \u7ED3\u6784\u6E05\u6670\u5EA6\uFF1A\u5F00\u5934\u662F\u5426\u6293\u4EBA\u3001\u4E2D\u95F4\u662F\u5426\u6709\u8282\u594F\u3001\u7ED3\u5C3E\u662F\u5426\u6709\u884C\u52A8\u53F7\u53EC
6. ai_natural - \u81EA\u7136\u5EA6\uFF1A\u662F\u5426\u50CF\u771F\u4EBA\u5199\u7684\u3001\u6709\u6CA1\u6709 AI \u5473

\u4EE5 JSON \u8F93\u51FA\uFF1A
{
  "total": \u603B\u5206(\u52A0\u6743\u5E73\u5747),
  "grade": "S/A/B/C/D",
  "dimensions": [
    { "name": "\u6807\u9898\u5438\u5F15\u529B", "score": \u5206\u6570, "feedback": "\u4E00\u53E5\u8BDD\u5EFA\u8BAE" },
    ...
  ],
  "summary": "\u6574\u4F53\u70B9\u8BC4"
}
\u53EA\u8F93\u51FA JSON\u3002`;
      const raw = await llmGenerate(llmEnv, system, `\u5E73\u53F0\uFF1A${draft.platform}
\u6807\u9898\uFF1A${draft.title}

${draft.body}`, void 0);
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("\u8BC4\u5206\u89E3\u6790\u5931\u8D25");
      return JSON.parse(match[0]);
    }
  }));
  ctx.tools.register(defineTool({
    name: "social_adapt_all",
    description: "\u4E00\u952E\u5C06\u8349\u7A3F\u6539\u5199\u4E3A\u6240\u6709\u4E3B\u6D41\u5E73\u53F0\u7248\u672C\uFF08\u5C0F\u7EA2\u4E66\u3001\u6296\u97F3\u3001\u516C\u4F17\u53F7\u3001B\u7AD9\u3001\u89C6\u9891\u53F7\u3001X/Twitter\uFF09\u3002\u6BCF\u4E2A\u5E73\u53F0\u7248\u672C\u6839\u636E\u5E73\u53F0\u7279\u70B9\u8C03\u6574\u98CE\u683C\u3001\u5B57\u6570\u3001\u683C\u5F0F\u3002",
    parameters: {
      draft_id: { type: "string", required: true, description: "\u8349\u7A3F ID" },
      platforms: { type: "string", description: "\u9017\u53F7\u5206\u9694\u7684\u76EE\u6807\u5E73\u53F0\u5217\u8868\uFF08\u9ED8\u8BA4\u5168\u90E8\uFF09" }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: true,
        properties: {
          versions: { type: "number", required: true }
        }
      },
      render(_args, value) {
        const count = typeof value.versions === "number" ? value.versions : 0;
        return [{ type: "text", text: `\u2705 \u5DF2\u751F\u6210 ${count} \u4E2A\u5E73\u53F0\u7248\u672C\uFF01\u53EF\u5728\u5DE5\u4F5C\u53F0\u8349\u7A3F\u8BE6\u60C5\u67E5\u770B\u3002` }];
      }
    },
    timeoutMs: config.llmTimeoutMs * 6 + 3e4,
    async execute(args, exec3) {
      const data = await store.read();
      const draft = data.drafts.find((d) => d.id === args.draft_id);
      if (!draft) throw new Error(`\u8349\u7A3F\u4E0D\u5B58\u5728\uFF1A${args.draft_id}`);
      const targetPlatforms = typeof args.platforms === "string" ? args.platforms.split(",").map((s) => s.trim()).filter(Boolean) : PLATFORMS.filter((p) => p !== draft.platform);
      let count = 0;
      for (const platform of targetPlatforms) {
        if (exec3.signal?.aborted) break;
        const existing = draft.versions.find((v) => v.platform === platform);
        if (existing) continue;
        const raw = await llmGenerate(
          llmEnv,
          `${DRAFT_WRITE_SYSTEM}

\u521B\u4F5C\u8005\u753B\u50CF\uFF1A
\u8D5B\u9053\uFF1A${data.profile.niche}
\u53D7\u4F17\uFF1A${data.profile.audience}
\u6587\u98CE\uFF1A${data.profile.voiceGuide || "\u81EA\u7136\u771F\u8BDA"}`,
          `\u5C06\u4EE5\u4E0B\u5185\u5BB9\u6539\u5199\u4E3A ${platform} \u5E73\u53F0\u7248\u672C\uFF1A

\u6807\u9898\uFF1A${draft.title}
\u539F\u6587\uFF1A${draft.body}

\u76EE\u6807\u5E73\u53F0\uFF1A${platform}`,
          exec3.signal
        );
        try {
          const match = raw.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            await store.mutate((d) => {
              const target = d.drafts.find((x) => x.id === draft.id);
              if (target) {
                target.versions.push({
                  platform,
                  title: parsed.title,
                  body: parsed.body,
                  coverText: parsed.coverText ?? "",
                  hashtags: parsed.hashtags ?? [],
                  updatedAt: nowIso()
                });
                target.updatedAt = nowIso();
              }
            });
            count++;
          }
        } catch {
        }
      }
      return { versions: count, platforms: targetPlatforms };
    }
  }));
  const prefix = config.routePrefix.replace(/\/+$/, "");
  ctx.webServer.register({
    kind: "prefix",
    path: prefix,
    handler: async (req, res) => {
      const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
      const path = url.pathname.slice(prefix.length);
      const method = req.method ?? "GET";
      try {
        if (method === "GET" && path === "/api/dashboard") {
          const data = await store.read();
          const summary = {
            materials: data.materials.length,
            topicsNew: data.topics.filter((t) => t.status === "new").length,
            drafts: {
              writing: data.drafts.filter((d) => d.status === "writing").length,
              reviewing: data.drafts.filter((d) => d.status === "reviewing").length,
              ready: data.drafts.filter((d) => d.status === "ready").length,
              published: data.drafts.filter((d) => d.status === "published").length
            },
            watched: data.accounts.length,
            outliers: data.scans.flatMap((scan) => {
              const acct = data.accounts.find((a) => a.id === scan.accountId);
              return scan.outlierIds.flatMap((oid) => {
                const video = scan.videos.find((v) => v.id === oid);
                return video ? [{ account: acct?.nickname ?? scan.accountId, video }] : [];
              });
            }).slice(0, 10),
            upcoming: data.drafts.filter((d) => d.scheduledAt && d.status === "ready").sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? "")).slice(0, 5).map((d) => ({ id: d.id, title: d.title, platform: d.platform, scheduledAt: d.scheduledAt })),
            tikhubReady: await tikhub.ready(),
            opencliReady: await opencli.isAvailable(),
            wenyanReady: await wenyan.isAvailable(),
            wechatConfigured: wenyan.isWechatConfigured(),
            llmReady: true
          };
          return jsonRes(res, 200, summary);
        }
        if (method === "GET" && path === "/api/materials") {
          const data = await store.read();
          return jsonRes(res, 200, data.materials);
        }
        if (method === "POST" && path === "/api/materials") {
          const body = await jsonBody(req);
          const material = {
            id: newId("mat"),
            source: body.source ?? "note",
            title: body.title ?? "\u672A\u547D\u540D",
            content: body.content ?? "",
            url: body.url,
            tags: body.tags ?? [],
            createdAt: nowIso()
          };
          await store.mutate((data) => {
            data.materials.push(material);
          });
          return jsonRes(res, 201, material);
        }
        if (method === "DELETE" && path.startsWith("/api/materials/")) {
          const id = path.split("/").pop();
          await store.mutate((data) => {
            data.materials = data.materials.filter((m) => m.id !== id);
          });
          return jsonRes(res, 200, { ok: true });
        }
        if (method === "GET" && path === "/api/topics") {
          const data = await store.read();
          return jsonRes(res, 200, data.topics);
        }
        if (method === "DELETE" && path.startsWith("/api/topics/")) {
          const id = path.split("/").pop();
          await store.mutate((data) => {
            data.topics = data.topics.filter((t) => t.id !== id);
          });
          return jsonRes(res, 200, { ok: true });
        }
        if (method === "GET" && path === "/api/drafts") {
          const data = await store.read();
          return jsonRes(res, 200, data.drafts);
        }
        if (method === "GET" && path.startsWith("/api/drafts/") && !path.endsWith("/")) {
          const id = path.split("/").pop();
          const data = await store.read();
          const draft = data.drafts.find((d) => d.id === id);
          if (!draft) return errRes(res, 404, "\u672A\u627E\u5230\u8349\u7A3F");
          return jsonRes(res, 200, draft);
        }
        if (method === "PUT" && path.startsWith("/api/drafts/")) {
          const id = path.split("/").pop();
          const body = await jsonBody(req);
          const updated = await store.mutate((data) => {
            const draft = data.drafts.find((d) => d.id === id);
            if (!draft) return null;
            if (body.title !== void 0) draft.title = body.title;
            if (body.body !== void 0) draft.body = body.body;
            if (body.status !== void 0) draft.status = body.status;
            if (body.platform !== void 0) draft.platform = body.platform;
            if (body.scheduledAt !== void 0) draft.scheduledAt = body.scheduledAt;
            draft.updatedAt = nowIso();
            return draft;
          });
          if (!updated) return errRes(res, 404, "\u672A\u627E\u5230\u8349\u7A3F");
          return jsonRes(res, 200, updated);
        }
        if (method === "DELETE" && path.startsWith("/api/drafts/")) {
          const id = path.split("/").pop();
          await store.mutate((data) => {
            data.drafts = data.drafts.filter((d) => d.id !== id);
          });
          return jsonRes(res, 200, { ok: true });
        }
        if (method === "GET" && path === "/api/accounts") {
          const data = await store.read();
          return jsonRes(res, 200, data.accounts);
        }
        if (method === "GET" && path === "/api/scans") {
          const data = await store.read();
          return jsonRes(res, 200, data.scans);
        }
        if (method === "DELETE" && path.startsWith("/api/accounts/")) {
          const id = path.split("/").pop();
          await store.mutate((data) => {
            data.accounts = data.accounts.filter((a) => a.id !== id);
            data.scans = data.scans.filter((s) => s.accountId !== id);
          });
          return jsonRes(res, 200, { ok: true });
        }
        if (method === "GET" && path === "/api/hot") {
          const data = await store.read();
          return jsonRes(res, 200, data.hot);
        }
        if (method === "GET" && path === "/api/settings") {
          const data = await store.read();
          const secrets = await store.secrets();
          const defaultModel = ctx.agentDefaultModel.currentSelection();
          const view = {
            profile: data.profile,
            tikhubConfigured: !!(secrets.tikhubKey || process.env[config.tikhubKeyEnv]),
            opencliReady: await opencli.isAvailable(),
            wenyanReady: await wenyan.isAvailable(),
            wechatConfigured: wenyan.isWechatConfigured(),
            dataDir: store.dataDir,
            model: config.provider && config.model ? { provider: config.provider, model: config.model } : { provider: defaultModel.provider, model: defaultModel.model }
          };
          return jsonRes(res, 200, view);
        }
        if (method === "PUT" && path === "/api/settings/profile") {
          const body = await jsonBody(req);
          await store.mutate((data) => {
            Object.assign(data.profile, body);
          });
          return jsonRes(res, 200, { ok: true });
        }
        if (method === "PUT" && path === "/api/settings/tikhub-key") {
          const body = await jsonBody(req);
          await store.saveSecrets({ tikhubKey: body.key || void 0 });
          return jsonRes(res, 200, { ok: true });
        }
        if (method === "POST" && path.startsWith("/api/drafts/") && path.endsWith("/publish")) {
          const draftId = path.split("/")[3];
          const body = await jsonBody(req);
          const data = await store.read();
          const draft = data.drafts.find((d) => d.id === draftId);
          if (!draft) return errRes(res, 404, "\u8349\u7A3F\u4E0D\u5B58\u5728");
          const targetPlatform = body.platform ?? draft.platform;
          const version = draft.versions.find((v) => v.platform === targetPlatform);
          const title = version?.title ?? draft.title;
          const content = version?.body ?? draft.body;
          const hashtags = version?.hashtags ?? [];
          const result = await opencli.publish(targetPlatform, { title, content, hashtags });
          const publishResult = {
            platform: targetPlatform,
            url: result.url,
            publishedAt: nowIso(),
            opencliOutput: result.output
          };
          await store.mutate((d) => {
            const target = d.drafts.find((x) => x.id === draftId);
            if (target) {
              if (!target.publishResults) target.publishResults = [];
              target.publishResults.push(publishResult);
              target.status = "published";
              target.updatedAt = nowIso();
            }
          });
          return jsonRes(res, 200, publishResult);
        }
        if (method === "GET" && path.startsWith("/api/drafts/") && path.endsWith("/preview")) {
          const draftId = path.split("/")[3];
          const platform = url.searchParams.get("platform") ?? "wechat";
          const data = await store.read();
          const draft = data.drafts.find((d) => d.id === draftId);
          if (!draft) return errRes(res, 404, "\u8349\u7A3F\u4E0D\u5B58\u5728");
          const version = draft.versions.find((v) => v.platform === platform);
          const title = version?.title ?? draft.title;
          const body = version?.body ?? draft.body;
          const hashtags = version?.hashtags ?? [];
          if (platform === "wechat") {
            const wenyanReady = await wenyan.isAvailable();
            if (wenyanReady) {
              const markdown = `---
title: ${title}
author: ${data.profile.name || ""}
---

${body}`;
              const result = await wenyan.render(markdown);
              return jsonRes(res, 200, { platform, title, body, hashtags, html: result.html });
            }
            return jsonRes(res, 200, { platform, title, body, hashtags, html: null });
          }
          return jsonRes(res, 200, { platform, title, body, hashtags, html: null });
        }
        if (method === "POST" && path.startsWith("/api/drafts/") && path.endsWith("/wechat-publish")) {
          const draftId = path.split("/")[3];
          const data = await store.read();
          const draft = data.drafts.find((d) => d.id === draftId);
          if (!draft) return errRes(res, 404, "\u8349\u7A3F\u4E0D\u5B58\u5728");
          const version = draft.versions.find((v) => v.platform === "wechat");
          const title = version?.title ?? draft.title;
          const body = version?.body ?? draft.body;
          const markdown = [
            "---",
            `title: ${title}`,
            `author: ${data.profile.name || ""}`,
            "---",
            "",
            body
          ].join("\n");
          const result = await wenyan.publish(markdown);
          if (result.success) {
            const publishResult = {
              platform: "wechat",
              publishedAt: nowIso(),
              opencliOutput: result.output
            };
            await store.mutate((d) => {
              const target = d.drafts.find((x) => x.id === draftId);
              if (target) {
                if (!target.publishResults) target.publishResults = [];
                target.publishResults.push(publishResult);
                if (target.status !== "published") target.status = "published";
                target.updatedAt = nowIso();
              }
            });
          }
          return jsonRes(res, 200, { success: result.success, message: result.message, mediaId: result.mediaId });
        }
        if (method === "GET" && path === "/api/opencli/status") {
          const ready = await opencli.isAvailable();
          return jsonRes(res, 200, { ready });
        }
        if (method === "GET" && path === "/api/trending") {
          const items = await opencli.fetchAllTrending();
          return jsonRes(res, 200, items);
        }
        if (method === "GET" && path === "/api/workspace") {
          return jsonRes(res, 200, { dataDir: store.dataDir });
        }
        if (method === "POST" && path === "/api/workspace/pick") {
          const picker = ctx.get("directoryPicker");
          if (!picker) return errRes(res, 501, "\u76EE\u5F55\u9009\u62E9\u5668\u4E0D\u53EF\u7528\uFF0C\u8BF7\u786E\u8BA4 DSH Desktop \u7248\u672C\u652F\u6301");
          const cap = picker.capability();
          if (cap.kind !== "native") return errRes(res, 501, "\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301\u539F\u751F\u76EE\u5F55\u9009\u62E9");
          const ac = new AbortController();
          req.on("close", () => ac.abort());
          const picked = await cap.pick(ac.signal);
          if (!picked) return jsonRes(res, 200, { picked: null, dataDir: store.dataDir });
          await store.switchDir(picked);
          return jsonRes(res, 200, { picked, dataDir: store.dataDir });
        }
        if (method === "POST" && path === "/api/workspace/set") {
          const body = await jsonBody(req);
          if (!body.dataDir) return errRes(res, 400, "\u7F3A\u5C11 dataDir");
          await store.switchDir(body.dataDir);
          return jsonRes(res, 200, { dataDir: store.dataDir });
        }
        errRes(res, 404, "Not found");
      } catch (error) {
        const message = error instanceof TikHubError ? error.message : error instanceof Error ? error.message : "\u5185\u90E8\u9519\u8BEF";
        const status = error instanceof TikHubError ? error.status ?? 500 : 500;
        errRes(res, status, message);
      }
    }
  });
}
export {
  Config,
  apply,
  inject,
  name
};
//# sourceMappingURL=index.js.map
