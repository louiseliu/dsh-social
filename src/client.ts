import type { Context } from '@deepseek-ai/cordis'
import '@deepseek-ai/dsh-client-ui-slots'
import { createElement, useCallback, useEffect, useState } from 'react'
import type { FC, ReactNode } from 'react'
import type {
  AccountScan, DashboardSummary, Draft, DraftStatus, HotList,
  Material, MaterialSource, Platform, SettingsView, Topic, WatchedAccount,
} from './shared/types.ts'
import {
  CHECK_LABELS, DRAFT_STATUS_LABELS, MATERIAL_SOURCE_LABELS, PLATFORM_LABELS,
} from './shared/types.ts'

export const name = 'dsh-social-client'
export const inject = ['slots'] as const

// ─── Styles ──────────────────────────────────────────────────────────

const CSS_TAG_ID = 'dsh-social-workbench'

const CSS = /* css */`
/* ─── Variables ───────────────────────── */
.dsh-social-overlay {
  position: fixed; inset: 0; z-index: 9990;
  background: var(--dsw-alias-bg-base, #fff);
  color: var(--dsw-alias-label-primary, #1a1a1a);
  display: flex; flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px; line-height: 1.5;
  overflow: hidden;
}
.dsh-social-overlay * { box-sizing: border-box; }

/* ─── Top bar ─────────────────────────── */
.dsw-topbar {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, #e5e5e5);
  flex-shrink: 0;
}
.dsw-topbar-title {
  font-size: 16px; font-weight: 600; margin-right: auto;
}
.dsw-topbar-close {
  background: none; border: none; cursor: pointer; font-size: 20px;
  color: var(--dsw-alias-label-secondary, #666);
  padding: 4px 8px; border-radius: 6px;
}
.dsw-topbar-close:hover {
  background: var(--dsw-alias-interactive-bg-hover, #f0f0f0);
}

/* ─── Layout ──────────────────────────── */
.dsw-body { display: flex; flex: 1; overflow: hidden; }
.dsw-nav {
  width: 180px; flex-shrink: 0;
  border-right: 1px solid var(--dsw-alias-border-l1, #e5e5e5);
  padding: 12px 0; overflow-y: auto;
}
.dsw-nav-item {
  display: block; width: 100%; text-align: left;
  padding: 8px 20px; border: none; background: none; cursor: pointer;
  color: var(--dsw-alias-label-secondary, #666);
  font-size: 14px; transition: all .15s;
}
.dsw-nav-item:hover { background: var(--dsw-alias-interactive-bg-hover, #f5f5f5); }
.dsw-nav-item[data-active="true"] {
  color: var(--dsw-alias-state-business-primary, #0070f3);
  background: var(--dsw-alias-interactive-bg-hover, #f0f0f0);
  font-weight: 500;
}
.dsw-content { flex: 1; overflow-y: auto; padding: 24px; }

/* ─── Cards & common ──────────────────── */
.dsw-card {
  border: 1px solid var(--dsw-alias-border-l1, #e5e5e5);
  border-radius: 12px; padding: 16px; margin-bottom: 12px;
  background: var(--dsw-alias-bg-base, #fff);
}
.dsw-card-title { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
.dsw-stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
.dsw-stat-card {
  border: 1px solid var(--dsw-alias-border-l1, #e5e5e5);
  border-radius: 10px; padding: 16px; text-align: center;
}
.dsw-stat-num { font-size: 28px; font-weight: 700; color: var(--dsw-alias-state-business-primary, #0070f3); }
.dsw-stat-label { font-size: 12px; color: var(--dsw-alias-label-tertiary, #999); margin-top: 4px; }

.dsw-badge {
  display: inline-block; padding: 2px 8px; border-radius: 99px;
  font-size: 12px; font-weight: 500;
}
.dsw-badge-green { background: #e8f5e9; color: #2e7d32; }
.dsw-badge-yellow { background: #fff8e1; color: #f57f17; }
.dsw-badge-blue { background: #e3f2fd; color: #1565c0; }
.dsw-badge-gray { background: #f5f5f5; color: #616161; }
.dsw-badge-red { background: #fce4ec; color: #c62828; }

.dsw-table { width: 100%; border-collapse: collapse; }
.dsw-table th, .dsw-table td {
  padding: 8px 12px; text-align: left; font-size: 13px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, #e5e5e5);
}
.dsw-table th {
  font-weight: 600; color: var(--dsw-alias-label-tertiary, #999);
  font-size: 12px; text-transform: uppercase;
}
.dsw-table tr:hover { background: var(--dsw-alias-interactive-bg-hover, #fafafa); }

.dsw-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l2, #ddd);
  background: var(--dsw-alias-bg-base, #fff); cursor: pointer;
  font-size: 13px; color: var(--dsw-alias-label-primary, #333);
  transition: all .15s;
}
.dsw-btn:hover { background: var(--dsw-alias-interactive-bg-hover, #f0f0f0); }
.dsw-btn-primary {
  background: var(--dsw-alias-state-business-primary, #0070f3);
  color: #fff; border-color: transparent;
}
.dsw-btn-primary:hover { opacity: .9; }
.dsw-btn-danger { color: #c62828; border-color: #c62828; }
.dsw-btn-sm { padding: 4px 10px; font-size: 12px; }

.dsw-input, .dsw-textarea, .dsw-select {
  display: block; width: 100%; padding: 8px 12px;
  border: 1px solid var(--dsw-alias-border-l2, #ddd);
  border-radius: 8px; font-size: 14px; background: var(--dsw-alias-bg-base, #fff);
  color: var(--dsw-alias-label-primary, #333);
  outline: none; transition: border-color .15s;
}
.dsw-input:focus, .dsw-textarea:focus, .dsw-select:focus {
  border-color: var(--dsw-alias-state-business-primary, #0070f3);
}
.dsw-textarea { min-height: 80px; resize: vertical; font-family: inherit; }
.dsw-form-row { margin-bottom: 12px; }
.dsw-form-label {
  display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px;
  color: var(--dsw-alias-label-secondary, #666);
}

.dsw-empty {
  text-align: center; padding: 48px 20px;
  color: var(--dsw-alias-label-caption, #aaa);
}
.dsw-empty-icon { font-size: 48px; margin-bottom: 8px; }

.dsw-actions { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }

.dsw-tag {
  display: inline-block; padding: 2px 6px; border-radius: 4px;
  font-size: 11px; background: #f0f0f0; color: #555; margin-right: 4px;
}

/* ─── Sidebar button (footer action) ─── */
.dsw-sidebar-btn {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 8px 12px; border: none; background: none;
  cursor: pointer; color: var(--dsw-alias-label-secondary, #999);
  font-size: 13px; border-radius: 8px; transition: all .15s;
}
.dsw-sidebar-btn:hover {
  background: var(--dsw-alias-interactive-bg-hover, #f0f0f0);
  color: var(--dsw-alias-label-primary, #333);
}
.dsw-sidebar-btn-icon { font-size: 16px; }

/* ─── Responsive ──────────────────────── */
@media (max-width: 640px) {
  .dsw-nav { width: 60px; }
  .dsw-nav-item { padding: 8px 8px; font-size: 18px; text-align: center; }
}
`

function injectStyles(): void {
  if (typeof document === 'undefined') return
  if (document.querySelector(`style[data-plugin-css="${CSS_TAG_ID}"]`)) return
  const tag = document.createElement('style')
  tag.dataset.plugin = 'dsh-social'
  tag.dataset.pluginCss = CSS_TAG_ID
  tag.textContent = CSS
  document.head.appendChild(tag)
}

// ─── API helper ──────────────────────────────────────────────────────

const API_BASE = '/social/api'

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error: string }
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return await res.json() as T
}

// ─── Hooks ───────────────────────────────────────────────────────────

function useApi<T>(path: string, deps: unknown[] = []): { data: T | null; loading: boolean; error: string | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const reload = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<T>(path).then(d => {
      if (!cancelled) { setData(d); setError(null) }
    }).catch(e => {
      if (!cancelled) setError(e instanceof Error ? e.message : String(e))
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick, ...deps])

  return { data, loading, error, reload }
}

// ─── h shorthand (createElement) ─────────────────────────────────────

const h = createElement

// ─── Tab Pages ───────────────────────────────────────────────────────

// ── Dashboard ────────────────────────────────────────────────────────

const DashboardPage: FC = () => {
  const { data, loading } = useApi<DashboardSummary>('/dashboard')
  if (loading || !data) return h('div', { className: 'dsw-empty' }, '加载中…')

  return h('div', null,
    h('h2', null, '📊 工作台概览'),
    h('div', { className: 'dsw-stat-grid', style: { marginTop: 16 } },
      h('div', { className: 'dsw-stat-card' },
        h('div', { className: 'dsw-stat-num' }, data.materials),
        h('div', { className: 'dsw-stat-label' }, '素材'),
      ),
      h('div', { className: 'dsw-stat-card' },
        h('div', { className: 'dsw-stat-num' }, data.topicsNew),
        h('div', { className: 'dsw-stat-label' }, '待处理选题'),
      ),
      h('div', { className: 'dsw-stat-card' },
        h('div', { className: 'dsw-stat-num' }, data.drafts.writing + data.drafts.reviewing),
        h('div', { className: 'dsw-stat-label' }, '进行中草稿'),
      ),
      h('div', { className: 'dsw-stat-card' },
        h('div', { className: 'dsw-stat-num' }, data.drafts.ready),
        h('div', { className: 'dsw-stat-label' }, '待发布'),
      ),
      h('div', { className: 'dsw-stat-card' },
        h('div', { className: 'dsw-stat-num' }, data.watched),
        h('div', { className: 'dsw-stat-label' }, '监控账号'),
      ),
      h('div', { className: 'dsw-stat-card' },
        h('div', { className: 'dsw-stat-num' }, data.tikhubReady ? '✅' : '❌'),
        h('div', { className: 'dsw-stat-label' }, 'TikHub'),
      ),
    ),

    data.outliers.length > 0 && h('div', { className: 'dsw-card', style: { marginTop: 20 } },
      h('div', { className: 'dsw-card-title' }, '🌟 最近爆款'),
      h('table', { className: 'dsw-table' },
        h('thead', null,
          h('tr', null,
            h('th', null, '账号'),
            h('th', null, '内容'),
            h('th', null, '播放'),
            h('th', null, '互动率'),
          ),
        ),
        h('tbody', null,
          ...data.outliers.map((o, i) =>
            h('tr', { key: i },
              h('td', null, o.account),
              h('td', null, o.video.desc.slice(0, 40)),
              h('td', null, o.video.stats.plays.toLocaleString()),
              h('td', null, `${(o.video.engagementRate * 100).toFixed(1)}%`),
            ),
          ),
        ),
      ),
    ),

    data.upcoming.length > 0 && h('div', { className: 'dsw-card', style: { marginTop: 12 } },
      h('div', { className: 'dsw-card-title' }, '📅 即将发布'),
      ...data.upcoming.map((u, i) =>
        h('div', { key: i, style: { padding: '4px 0', fontSize: 13 } },
          h('span', { className: 'dsw-badge dsw-badge-blue' }, PLATFORM_LABELS[u.platform] ?? u.platform),
          ' ',
          h('strong', null, u.title),
          ' — ',
          new Date(u.scheduledAt).toLocaleDateString('zh-CN'),
        ),
      ),
    ),
  )
}

// ── Materials ────────────────────────────────────────────────────────

const MaterialsPage: FC = () => {
  const { data, loading, reload } = useApi<Material[]>('/materials')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ source: 'note' as MaterialSource, title: '', content: '', url: '', tags: '' })

  const handleAdd = async () => {
    await api('/materials', {
      method: 'POST',
      body: JSON.stringify({
        source: form.source,
        title: form.title,
        content: form.content,
        url: form.url || undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      }),
    })
    setForm({ source: 'note', title: '', content: '', url: '', tags: '' })
    setAdding(false)
    reload()
  }

  const handleDelete = async (id: string) => {
    await api(`/materials/${id}`, { method: 'DELETE' })
    reload()
  }

  if (loading) return h('div', { className: 'dsw-empty' }, '加载中…')

  return h('div', null,
    h('div', { className: 'dsw-actions' },
      h('h2', { style: { margin: 0, flex: 1 } }, '📝 素材库'),
      h('button', { className: 'dsw-btn dsw-btn-primary', onClick: () => setAdding(!adding) }, adding ? '取消' : '+ 添加素材'),
    ),

    adding && h('div', { className: 'dsw-card' },
      h('div', { className: 'dsw-form-row' },
        h('label', { className: 'dsw-form-label' }, '类型'),
        h('select', { className: 'dsw-select', value: form.source, onChange: (e: { target: { value: string } }) => setForm({ ...form, source: e.target.value as MaterialSource }) },
          ...Object.entries(MATERIAL_SOURCE_LABELS).map(([k, v]) => h('option', { key: k, value: k }, v)),
        ),
      ),
      h('div', { className: 'dsw-form-row' },
        h('label', { className: 'dsw-form-label' }, '标题'),
        h('input', { className: 'dsw-input', value: form.title, onChange: (e: { target: { value: string } }) => setForm({ ...form, title: e.target.value }), placeholder: '素材标题' }),
      ),
      h('div', { className: 'dsw-form-row' },
        h('label', { className: 'dsw-form-label' }, '内容'),
        h('textarea', { className: 'dsw-textarea', value: form.content, onChange: (e: { target: { value: string } }) => setForm({ ...form, content: e.target.value }), placeholder: '素材内容', rows: 4 }),
      ),
      h('div', { className: 'dsw-form-row' },
        h('label', { className: 'dsw-form-label' }, '链接（可选）'),
        h('input', { className: 'dsw-input', value: form.url, onChange: (e: { target: { value: string } }) => setForm({ ...form, url: e.target.value }), placeholder: 'https://...' }),
      ),
      h('div', { className: 'dsw-form-row' },
        h('label', { className: 'dsw-form-label' }, '标签（逗号分隔）'),
        h('input', { className: 'dsw-input', value: form.tags, onChange: (e: { target: { value: string } }) => setForm({ ...form, tags: e.target.value }), placeholder: '标签1, 标签2' }),
      ),
      h('button', { className: 'dsw-btn dsw-btn-primary', onClick: handleAdd, disabled: !form.title || !form.content }, '保存'),
    ),

    !data || data.length === 0
      ? h('div', { className: 'dsw-empty' }, h('div', { className: 'dsw-empty-icon' }, '📭'), h('div', null, '还没有素材，开始收集吧'))
      : h('table', { className: 'dsw-table' },
        h('thead', null,
          h('tr', null,
            h('th', null, '类型'),
            h('th', null, '标题'),
            h('th', null, '标签'),
            h('th', null, '时间'),
            h('th', null, '操作'),
          ),
        ),
        h('tbody', null,
          ...data.slice().reverse().map(m =>
            h('tr', { key: m.id },
              h('td', null, h('span', { className: 'dsw-badge dsw-badge-gray' }, MATERIAL_SOURCE_LABELS[m.source] ?? m.source)),
              h('td', null, m.title),
              h('td', null, ...m.tags.map(t => h('span', { key: t, className: 'dsw-tag' }, t))),
              h('td', null, new Date(m.createdAt).toLocaleDateString('zh-CN')),
              h('td', null, h('button', { className: 'dsw-btn dsw-btn-sm dsw-btn-danger', onClick: () => handleDelete(m.id) }, '删除')),
            ),
          ),
        ),
      ),
  )
}

// ── Topics ───────────────────────────────────────────────────────────

const statusBadge = (status: string) => {
  const map: Record<string, string> = { new: 'dsw-badge-blue', planned: 'dsw-badge-yellow', drafted: 'dsw-badge-green', dropped: 'dsw-badge-gray' }
  return h('span', { className: `dsw-badge ${map[status] ?? 'dsw-badge-gray'}` }, status)
}

const TopicsPage: FC = () => {
  const { data, loading, reload } = useApi<Topic[]>('/topics')
  const handleDelete = async (id: string) => {
    await api(`/topics/${id}`, { method: 'DELETE' })
    reload()
  }

  if (loading) return h('div', { className: 'dsw-empty' }, '加载中…')

  return h('div', null,
    h('h2', null, '💡 选题库'),
    !data || data.length === 0
      ? h('div', { className: 'dsw-empty' }, h('div', { className: 'dsw-empty-icon' }, '💡'), h('div', null, '还没有选题。在对话中让 AI 帮你从素材中提炼选题'))
      : h('div', null,
        ...data.slice().reverse().map(t =>
          h('div', { key: t.id, className: 'dsw-card' },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
              h('div', { className: 'dsw-card-title' }, t.title),
              h('div', null,
                statusBadge(t.status),
                ' ',
                h('button', { className: 'dsw-btn dsw-btn-sm dsw-btn-danger', onClick: () => handleDelete(t.id) }, '删除'),
              ),
            ),
            h('div', { style: { fontSize: 13, color: '#666', marginTop: 4 } },
              h('strong', null, '切入角度：'), t.angle,
            ),
            t.hook && h('div', { style: { fontSize: 13, color: '#666', marginTop: 2 } },
              h('strong', null, '钩子：'), t.hook,
            ),
            t.audience && h('div', { style: { fontSize: 13, color: '#666', marginTop: 2 } },
              h('strong', null, '受众：'), t.audience,
            ),
            t.quotes.length > 0 && h('div', { style: { marginTop: 8, padding: '8px 12px', background: '#f9f9f9', borderRadius: 8, fontSize: 13, fontStyle: 'italic', color: '#888' } },
              ...t.quotes.map((q, i) => h('div', { key: i }, `"${q}"`)),
            ),
          ),
        ),
      ),
  )
}

// ── Drafts ───────────────────────────────────────────────────────────

const draftStatusBadge = (status: DraftStatus) => {
  const map: Record<DraftStatus, string> = { writing: 'dsw-badge-yellow', reviewing: 'dsw-badge-blue', ready: 'dsw-badge-green', published: 'dsw-badge-gray' }
  return h('span', { className: `dsw-badge ${map[status]}` }, DRAFT_STATUS_LABELS[status])
}

const DraftsPage: FC = () => {
  const { data, loading, reload } = useApi<Draft[]>('/drafts')
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<Draft | null>(null)

  useEffect(() => {
    if (selected) {
      api<Draft>(`/drafts/${selected}`).then(setDetail).catch(() => setDetail(null))
    } else {
      setDetail(null)
    }
  }, [selected])

  const handleDelete = async (id: string) => {
    await api(`/drafts/${id}`, { method: 'DELETE' })
    if (selected === id) { setSelected(null); setDetail(null) }
    reload()
  }

  const handleStatusChange = async (id: string, status: DraftStatus) => {
    await api(`/drafts/${id}`, { method: 'PUT', body: JSON.stringify({ status }) })
    reload()
    if (selected === id) {
      api<Draft>(`/drafts/${id}`).then(setDetail).catch(() => setDetail(null))
    }
  }

  if (loading) return h('div', { className: 'dsw-empty' }, '加载中…')

  if (detail) {
    return h('div', null,
      h('div', { className: 'dsw-actions' },
        h('button', { className: 'dsw-btn', onClick: () => setSelected(null) }, '← 返回列表'),
        draftStatusBadge(detail.status),
        h('span', { className: 'dsw-badge dsw-badge-blue' }, PLATFORM_LABELS[detail.platform] ?? detail.platform),
      ),
      h('h2', null, detail.title),
      h('div', {
        style: {
          whiteSpace: 'pre-wrap', background: '#fafafa', padding: 20,
          borderRadius: 12, border: '1px solid #e5e5e5', lineHeight: 1.8, fontSize: 15,
        },
      }, detail.body),

      detail.checks.length > 0 && h('div', { style: { marginTop: 20 } },
        h('h3', null, '📋 体检报告'),
        ...detail.checks.map((c, i) => {
          const icon = c.score >= 80 ? '✅' : c.score >= 60 ? '⚠️' : '❌'
          return h('div', { key: i, className: 'dsw-card' },
            h('div', { style: { display: 'flex', justifyContent: 'space-between' } },
              h('strong', null, `${icon} ${CHECK_LABELS[c.kind] ?? c.kind}`),
              h('span', { style: { fontSize: 18, fontWeight: 700, color: c.score >= 80 ? '#2e7d32' : c.score >= 60 ? '#f57f17' : '#c62828' } }, `${c.score}/100`),
            ),
            h('div', { style: { fontSize: 13, color: '#666', marginTop: 4 } }, c.verdict),
            c.issues.length > 0 && h('div', { style: { marginTop: 8 } },
              ...c.issues.map((issue, j) => h('div', {
                key: j,
                style: { padding: '6px 0', borderTop: j > 0 ? '1px solid #eee' : 'none', fontSize: 13 },
              },
                h('span', { className: `dsw-badge ${issue.severity === 'high' ? 'dsw-badge-red' : issue.severity === 'medium' ? 'dsw-badge-yellow' : 'dsw-badge-gray'}` }, issue.severity),
                ' ',
                issue.quote && h('span', { style: { fontStyle: 'italic', color: '#888' } }, `"${issue.quote}" `),
                h('span', null, issue.problem),
                h('div', { style: { color: '#0070f3', marginTop: 2 } }, `💡 ${issue.suggestion}`),
              )),
            ),
          )
        }),
      ),

      detail.versions.length > 0 && h('div', { style: { marginTop: 20 } },
        h('h3', null, '🔄 平台适配版本'),
        ...detail.versions.map((v, i) =>
          h('div', { key: i, className: 'dsw-card' },
            h('div', { className: 'dsw-card-title' },
              h('span', { className: 'dsw-badge dsw-badge-blue' }, PLATFORM_LABELS[v.platform] ?? v.platform),
              ' ',
              v.title,
            ),
            h('div', { style: { whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.7, marginTop: 8 } }, v.body),
            v.hashtags.length > 0 && h('div', { style: { marginTop: 8 } },
              ...v.hashtags.map(tag => h('span', { key: tag, className: 'dsw-tag' }, `#${tag}`)),
            ),
          ),
        ),
      ),

      h('div', { className: 'dsw-actions', style: { marginTop: 20 } },
        detail.status === 'writing' && h('button', { className: 'dsw-btn dsw-btn-primary', onClick: () => handleStatusChange(detail.id, 'reviewing') }, '送去体检'),
        detail.status === 'reviewing' && h('button', { className: 'dsw-btn dsw-btn-primary', onClick: () => handleStatusChange(detail.id, 'ready') }, '标记可发布'),
        detail.status === 'ready' && h('button', { className: 'dsw-btn dsw-btn-primary', onClick: () => handleStatusChange(detail.id, 'published') }, '标记已发布'),
        h('button', { className: 'dsw-btn dsw-btn-danger', onClick: () => handleDelete(detail.id) }, '删除'),
      ),
    )
  }

  return h('div', null,
    h('h2', null, '✍️ 草稿箱'),
    !data || data.length === 0
      ? h('div', { className: 'dsw-empty' }, h('div', { className: 'dsw-empty-icon' }, '✍️'), h('div', null, '还没有草稿。在对话中让 AI 帮你起草'))
      : h('table', { className: 'dsw-table' },
        h('thead', null,
          h('tr', null,
            h('th', null, '标题'),
            h('th', null, '平台'),
            h('th', null, '状态'),
            h('th', null, '体检'),
            h('th', null, '更新时间'),
            h('th', null, '操作'),
          ),
        ),
        h('tbody', null,
          ...data.slice().reverse().map(d =>
            h('tr', { key: d.id, style: { cursor: 'pointer' }, onClick: () => setSelected(d.id) },
              h('td', null, d.title),
              h('td', null, h('span', { className: 'dsw-badge dsw-badge-blue' }, PLATFORM_LABELS[d.platform] ?? d.platform)),
              h('td', null, draftStatusBadge(d.status)),
              h('td', null, d.checks.length > 0 ? `${Math.round(d.checks.reduce((s, c) => s + c.score, 0) / d.checks.length)}/100` : '—'),
              h('td', null, new Date(d.updatedAt).toLocaleDateString('zh-CN')),
              h('td', null,
                h('button', { className: 'dsw-btn dsw-btn-sm dsw-btn-danger', onClick: (e: { stopPropagation: () => void }) => { e.stopPropagation(); handleDelete(d.id) } }, '删除'),
              ),
            ),
          ),
        ),
      ),
  )
}

// ── Radar ────────────────────────────────────────────────────────────

const RadarPage: FC = () => {
  const { data: accounts, loading: loadingAccounts, reload: reloadAccounts } = useApi<WatchedAccount[]>('/accounts')
  const { data: hot } = useApi<HotList | null>('/hot')
  const { data: scans } = useApi<AccountScan[]>('/scans')

  const handleDeleteAccount = async (id: string) => {
    await api(`/accounts/${id}`, { method: 'DELETE' })
    reloadAccounts()
  }

  if (loadingAccounts) return h('div', { className: 'dsw-empty' }, '加载中…')

  return h('div', null,
    h('h2', null, '📡 社交雷达'),

    h('div', { className: 'dsw-card' },
      h('div', { className: 'dsw-card-title' }, '👀 监控账号'),
      !accounts || accounts.length === 0
        ? h('div', { style: { color: '#999', fontSize: 13 } }, '还没有监控账号。在对话中输入抖音主页链接，让 AI 帮你添加')
        : h('table', { className: 'dsw-table' },
          h('thead', null,
            h('tr', null,
              h('th', null, '昵称'),
              h('th', null, '备注'),
              h('th', null, '粉丝'),
              h('th', null, '上次扫描'),
              h('th', null, '操作'),
            ),
          ),
          h('tbody', null,
            ...accounts.map(a =>
              h('tr', { key: a.id },
                h('td', null, `@${a.nickname}`),
                h('td', null, a.note || '—'),
                h('td', null, a.followers > 10000 ? `${(a.followers / 10000).toFixed(1)}w` : a.followers.toLocaleString()),
                h('td', null, a.lastScanAt ? new Date(a.lastScanAt).toLocaleDateString('zh-CN') : '未扫描'),
                h('td', null, h('button', { className: 'dsw-btn dsw-btn-sm dsw-btn-danger', onClick: () => handleDeleteAccount(a.id) }, '删除')),
              ),
            ),
          ),
        ),
    ),

    scans && scans.length > 0 && h('div', { className: 'dsw-card', style: { marginTop: 12 } },
      h('div', { className: 'dsw-card-title' }, '🌟 爆款发现'),
      h('table', { className: 'dsw-table' },
        h('thead', null,
          h('tr', null,
            h('th', null, '内容'),
            h('th', null, '播放'),
            h('th', null, '互动率'),
            h('th', null, '时间'),
          ),
        ),
        h('tbody', null,
          ...scans.flatMap(scan =>
            scan.videos.filter(v => scan.outlierIds.includes(v.id)).map(v =>
              h('tr', { key: v.id },
                h('td', null, v.desc.slice(0, 50)),
                h('td', null, v.stats.plays.toLocaleString()),
                h('td', null, `${(v.engagementRate * 100).toFixed(1)}%`),
                h('td', null, v.createTime ? new Date(v.createTime).toLocaleDateString('zh-CN') : '—'),
              ),
            ),
          ).slice(0, 20),
        ),
      ),
    ),

    hot && h('div', { className: 'dsw-card', style: { marginTop: 12 } },
      h('div', { className: 'dsw-card-title' }, `🔥 抖音热搜 (${new Date(hot.fetchedAt).toLocaleString('zh-CN')})`),
      h('table', { className: 'dsw-table' },
        h('thead', null,
          h('tr', null,
            h('th', null, '#'),
            h('th', null, '话题'),
            h('th', null, '标签'),
            h('th', null, '热度'),
          ),
        ),
        h('tbody', null,
          ...hot.items.slice(0, 30).map((item, i) =>
            h('tr', { key: i },
              h('td', null, item.rank),
              h('td', null, item.word),
              h('td', null, item.label ? h('span', { className: 'dsw-badge dsw-badge-red' }, item.label) : ''),
              h('td', null, item.hot.toLocaleString()),
            ),
          ),
        ),
      ),
    ),
  )
}

// ── Settings ─────────────────────────────────────────────────────────

const SettingsPage: FC = () => {
  const { data, loading, reload } = useApi<SettingsView>('/settings')
  const [profile, setProfile] = useState<SettingsView['profile'] | null>(null)
  const [tikKey, setTikKey] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) setProfile(data.profile)
  }, [data])

  const handleSaveProfile = async () => {
    if (!profile) return
    setSaving(true)
    await api('/settings/profile', { method: 'PUT', body: JSON.stringify(profile) })
    setSaving(false)
    reload()
  }

  const handleSaveTikKey = async () => {
    setSaving(true)
    await api('/settings/tikhub-key', { method: 'PUT', body: JSON.stringify({ key: tikKey }) })
    setTikKey('')
    setSaving(false)
    reload()
  }

  if (loading || !data || !profile) return h('div', { className: 'dsw-empty' }, '加载中…')

  return h('div', null,
    h('h2', null, '⚙️ 设置'),

    h('div', { className: 'dsw-card' },
      h('div', { className: 'dsw-card-title' }, '👤 创作者画像'),
      h('div', { style: { fontSize: 13, color: '#999', marginBottom: 12 } }, '设定你的创作方向，AI 会据此生成更贴合你的内容'),

      ...(['name', 'niche', 'audience', 'offer'] as const).map(field =>
        h('div', { key: field, className: 'dsw-form-row' },
          h('label', { className: 'dsw-form-label' },
            ({ name: '名称/IP', niche: '赛道/领域', audience: '目标受众', offer: '变现方向' } as Record<string, string>)[field],
          ),
          h('input', {
            className: 'dsw-input',
            value: profile[field],
            onChange: (e: { target: { value: string } }) => setProfile({ ...profile, [field]: e.target.value }),
          }),
        ),
      ),

      h('div', { className: 'dsw-form-row' },
        h('label', { className: 'dsw-form-label' }, '文风指南'),
        h('textarea', {
          className: 'dsw-textarea', value: profile.voiceGuide, rows: 3,
          onChange: (e: { target: { value: string } }) => setProfile({ ...profile, voiceGuide: e.target.value }),
          placeholder: '描述你的写作风格，例如"轻松幽默、多用口语化表达、爱用问句和感叹号"',
        }),
      ),

      h('div', { className: 'dsw-form-row' },
        h('label', { className: 'dsw-form-label' }, '禁忌内容'),
        h('textarea', {
          className: 'dsw-textarea', value: profile.forbidden, rows: 2,
          onChange: (e: { target: { value: string } }) => setProfile({ ...profile, forbidden: e.target.value }),
          placeholder: '不要出现的内容或词汇',
        }),
      ),

      h('button', { className: 'dsw-btn dsw-btn-primary', onClick: handleSaveProfile, disabled: saving }, saving ? '保存中…' : '保存画像'),
    ),

    h('div', { className: 'dsw-card', style: { marginTop: 16 } },
      h('div', { className: 'dsw-card-title' }, '🔑 TikHub API Key'),
      h('div', { style: { fontSize: 13, color: '#999', marginBottom: 8 } },
        '状态：',
        data.tikhubConfigured
          ? h('span', { className: 'dsw-badge dsw-badge-green' }, '已配置')
          : h('span', { className: 'dsw-badge dsw-badge-red' }, '未配置'),
      ),
      h('div', { className: 'dsw-form-row' },
        h('input', {
          className: 'dsw-input', type: 'password',
          value: tikKey,
          onChange: (e: { target: { value: string } }) => setTikKey(e.target.value),
          placeholder: '输入新的 API Key',
        }),
      ),
      h('button', { className: 'dsw-btn dsw-btn-primary', onClick: handleSaveTikKey, disabled: saving || !tikKey }, '更新 Key'),
    ),

    h('div', { className: 'dsw-card', style: { marginTop: 16 } },
      h('div', { className: 'dsw-card-title' }, '🤖 写作模型'),
      h('div', { style: { fontSize: 13, color: '#666' } },
        data.model ? `${data.model.provider} / ${data.model.model}` : '使用 Agent 默认模型',
      ),
    ),
  )
}

// ─── Workbench Overlay ───────────────────────────────────────────────

type TabId = 'dashboard' | 'materials' | 'topics' | 'drafts' | 'radar' | 'settings'

interface NavItem {
  id: TabId
  icon: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: '📊', label: '概览' },
  { id: 'materials', icon: '📝', label: '素材' },
  { id: 'topics', icon: '💡', label: '选题' },
  { id: 'drafts', icon: '✍️', label: '草稿' },
  { id: 'radar', icon: '📡', label: '雷达' },
  { id: 'settings', icon: '⚙️', label: '设置' },
]

const TAB_COMPONENTS: Record<TabId, FC> = {
  dashboard: DashboardPage,
  materials: MaterialsPage,
  topics: TopicsPage,
  drafts: DraftsPage,
  radar: RadarPage,
  settings: SettingsPage,
}

const Workbench: FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tab, setTab] = useState<TabId>('dashboard')
  const Page = TAB_COMPONENTS[tab]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return h('div', { className: 'dsh-social-overlay' },
    h('div', { className: 'dsw-topbar' },
      h('span', { className: 'dsw-topbar-title' }, '📱 自媒体工作台'),
      h('button', { className: 'dsw-topbar-close', onClick: onClose, title: '关闭 (Esc)' }, '✕'),
    ),
    h('div', { className: 'dsw-body' },
      h('nav', { className: 'dsw-nav' },
        ...NAV_ITEMS.map(item =>
          h('button', {
            key: item.id,
            className: 'dsw-nav-item',
            'data-active': String(tab === item.id),
            onClick: () => setTab(item.id),
          }, `${item.icon} ${item.label}`),
        ),
      ),
      h('main', { className: 'dsw-content' },
        h(Page, null),
      ),
    ),
  )
}

// ─── Sidebar Footer Action Button ────────────────────────────────────

const SidebarButton: FC<{ wide?: boolean }> = ({ wide }) => {
  const [open, setOpen] = useState(false)

  return h('div', null,
    h('button', {
      className: 'dsw-sidebar-btn',
      onClick: () => setOpen(true),
      title: '自媒体工作台',
    },
      h('span', { className: 'dsw-sidebar-btn-icon' }, '📱'),
      wide && h('span', null, '自媒体工作台'),
    ),
    open && h(Workbench, { onClose: () => setOpen(false) }),
  )
}

// ─── Plugin entry ────────────────────────────────────────────────────

export function apply(ctx: Context) {
  injectStyles()

  // The slot type declarations in the bundled DSH packages are minified,
  // so third-party plugins must bypass the generic constraints at the call
  // site. The runtime contract is: register into an existing declared slot,
  // provide a component that receives `wide?: boolean` from the sidebar.
  const slots = ctx.slots as {
    register(options: { name: string; id: string; inject: () => object }, component: FC<{ wide?: boolean }>): () => void
  }
  slots.register(
    { name: 'sidebar.footer.action', id: 'dsh-social', inject: () => ({}) },
    SidebarButton,
  )
}
