import { randomUUID } from 'node:crypto'
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type {
  AccountScan, CreatorProfile, Draft, HotList, Material, Topic, WatchedAccount,
} from './shared/types.ts'

export interface WorkbenchData {
  profile: CreatorProfile
  materials: Material[]
  topics: Topic[]
  drafts: Draft[]
  accounts: WatchedAccount[]
  scans: AccountScan[]
  hot: HotList | null
}

interface Secrets {
  tikhubKey?: string
}

const EMPTY_PROFILE: CreatorProfile = {
  name: '',
  niche: '',
  audience: '',
  offer: '',
  voiceGuide: '',
  forbidden: '',
}

function emptyData(): WorkbenchData {
  return { profile: { ...EMPTY_PROFILE }, materials: [], topics: [], drafts: [], accounts: [], scans: [], hot: null }
}

export function expandHome(path: string): string {
  return path === '~' || path.startsWith('~/') ? join(homedir(), path.slice(1)) : path
}

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().slice(0, 8)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

async function readJson<T>(path: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

async function writeJsonAtomic(path: string, value: unknown, mode: number): Promise<void> {
  const tmp = `${path}.${process.pid}.tmp`
  await writeFile(tmp, JSON.stringify(value, null, 2), { encoding: 'utf8', mode })
  await rename(tmp, path)
  await chmod(path, mode)
}

/**
 * Single-file JSON store. Mutations run through one promise chain so
 * concurrent HTTP requests and tool calls never interleave read-modify-write.
 */
export class WorkbenchStore {
  #dir: string
  #data: WorkbenchData | undefined
  #secrets: Secrets | undefined
  #queue: Promise<unknown> = Promise.resolve()

  constructor(dataDir: string) {
    this.#dir = expandHome(dataDir)
  }

  /** Current data directory path. */
  get dataDir(): string { return this.#dir }

  /**
   * Switch to a different data directory at runtime. Flushes the in-memory
   * cache so the next read loads from the new path. Existing queued mutations
   * targeting the old directory finish before the swap takes effect.
   */
  async switchDir(newDir: string): Promise<void> {
    const resolved = expandHome(newDir)
    await mkdir(resolved, { recursive: true, mode: 0o700 })
    await this.#queue
    this.#dir = resolved
    this.#data = undefined
    this.#secrets = undefined
  }

  async #load(): Promise<WorkbenchData> {
    if (this.#data === undefined) {
      await mkdir(this.#dir, { recursive: true, mode: 0o700 })
      const stored = await readJson<Partial<WorkbenchData>>(join(this.#dir, 'workbench.json'))
      this.#data = { ...emptyData(), ...stored }
      for (const draft of this.#data.drafts) {
        if (!draft.publishResults) draft.publishResults = []
      }
    }
    return this.#data
  }

  async read(): Promise<WorkbenchData> {
    await this.#queue
    return this.#load()
  }

  mutate<T>(fn: (data: WorkbenchData) => T): Promise<T> {
    const run = this.#queue.then(async () => {
      const data = await this.#load()
      const result = fn(data)
      await writeJsonAtomic(join(this.#dir, 'workbench.json'), data, 0o600)
      return result
    })
    this.#queue = run.catch(() => undefined)
    return run
  }

  async secrets(): Promise<Secrets> {
    if (this.#secrets === undefined) {
      await mkdir(this.#dir, { recursive: true, mode: 0o700 })
      this.#secrets = (await readJson<Secrets>(join(this.#dir, 'secrets.json'))) ?? {}
    }
    return this.#secrets
  }

  async saveSecrets(patch: Secrets): Promise<void> {
    const next = { ...(await this.secrets()), ...patch }
    await writeJsonAtomic(join(this.#dir, 'secrets.json'), next, 0o600)
    this.#secrets = next
  }
}
