import type { Context } from '@deepseek-ai/cordis'
import '@deepseek-ai/dsh-client-ui-slots'
import { createElement, useCallback, useEffect, useState } from 'react'
import type { FC, ReactNode } from 'react'
import type {
  AccountScan, DashboardSummary, Draft, DraftStatus, HotList,
  Material, MaterialSource, Platform, PublishResult, SettingsView, Topic, WatchedAccount,
} from './shared/types.ts'
import {
  CHECK_LABELS, DRAFT_STATUS_LABELS, MATERIAL_SOURCE_LABELS, PLATFORM_LABELS,
} from './shared/types.ts'

export const name = 'dsh-social-client'
export const inject = ['slots'] as const

// ─── Styles ──────────────────────────────────────────────────────────

const CSS_TAG_ID = 'dsh-social-workbench'

const CSS = /* css */`
/* ═══ Keyframes ═══════════════════════════ */
@keyframes dsw-slide-in {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes dsw-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes dsw-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
@keyframes dsw-toast-in {
  from { opacity: 0; transform: translateY(-12px) scale(.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes dsw-toast-out {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to   { opacity: 0; transform: translateY(-12px) scale(.92); }
}
@keyframes dsw-pop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.08); }
  100% { transform: scale(1); }
}
@keyframes dsw-count-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ═══ Overlay ═════════════════════════════ */
.dsh-social-overlay {
  position: fixed; inset: 0; z-index: 9990;
  background: var(--dsw-alias-bg-base, #fff);
  color: var(--dsw-alias-label-primary, #1a1a1a);
  display: flex; flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px; line-height: 1.5;
  overflow: hidden;
  animation: dsw-fade-in .2s ease-out;
}
.dsh-social-overlay * { box-sizing: border-box; }

/* ═══ Top bar ═════════════════════════════ */
.dsw-topbar {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px;
  padding-top: calc(env(titlebar-area-height, 36px) + 6px);
  border-bottom: 1px solid var(--dsw-alias-border-l1, #e5e5e5);
  flex-shrink: 0;
  backdrop-filter: blur(8px);
  background: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 85%, transparent);
  -webkit-app-region: drag;
}
.dsw-topbar * { -webkit-app-region: no-drag; }
.dsw-topbar-title {
  font-size: 16px; font-weight: 600; margin-right: auto;
  letter-spacing: .02em;
}
.dsw-topbar-close {
  background: none; border: none; cursor: pointer; font-size: 18px;
  color: var(--dsw-alias-label-secondary, #666);
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  border-radius: 8px; transition: all .15s;
}
.dsw-topbar-close:hover {
  background: var(--dsw-alias-interactive-bg-hover, #f0f0f0);
  transform: scale(1.05);
}

/* ═══ Layout ══════════════════════════════ */
.dsw-body { display: flex; flex: 1; overflow: hidden; }

.dsw-nav {
  width: 180px; flex-shrink: 0;
  border-right: 1px solid var(--dsw-alias-border-l1, #e5e5e5);
  padding: 8px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 2px;
}
.dsw-nav-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; text-align: left;
  padding: 10px 14px; border: none; background: none; cursor: pointer;
  color: var(--dsw-alias-label-secondary, #666);
  font-size: 14px; border-radius: 10px;
  transition: all .2s ease; position: relative;
}
.dsw-nav-item:hover {
  background: var(--dsw-alias-interactive-bg-hover, #f5f5f5);
  color: var(--dsw-alias-label-primary, #333);
}
.dsw-nav-item[data-active="true"] {
  color: var(--dsw-alias-state-business-primary, #0070f3);
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #0070f3) 8%, transparent);
  font-weight: 600;
}
.dsw-nav-item[data-active="true"]::before {
  content: '';
  position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 3px; height: 20px; border-radius: 0 3px 3px 0;
  background: var(--dsw-alias-state-business-primary, #0070f3);
}
.dsw-nav-icon { font-size: 16px; flex-shrink: 0; width: 20px; text-align: center; }

.dsw-content {
  flex: 1; overflow-y: auto; padding: 24px 28px;
  scroll-behavior: smooth;
}
.dsw-content::-webkit-scrollbar { width: 6px; }
.dsw-content::-webkit-scrollbar-thumb {
  background: var(--dsw-alias-scrollbar-bg-l2, rgba(0,0,0,.12)); border-radius: 3px;
}
.dsw-content::-webkit-scrollbar-thumb:hover {
  background: var(--dsw-alias-scrollbar-hover-l2, rgba(0,0,0,.22));
}

/* ═══ Page transition ═════════════════════ */
.dsw-page-enter { animation: dsw-slide-in .25s ease-out; }

/* ═══ Cards ═══════════════════════════════ */
.dsw-card {
  border: 1px solid var(--dsw-alias-border-l1, #e5e5e5);
  border-radius: 14px; padding: 18px; margin-bottom: 14px;
  background: var(--dsw-alias-bg-base, #fff);
  transition: box-shadow .2s ease, border-color .2s ease;
}
.dsw-card:hover {
  box-shadow: 0 2px 12px color-mix(in srgb, var(--dsw-alias-label-primary, #000) 6%, transparent);
  border-color: var(--dsw-alias-border-l2, #d0d0d0);
}
.dsw-card-title { font-size: 15px; font-weight: 600; margin-bottom: 10px; }
.dsw-card-subtitle { font-size: 13px; color: var(--dsw-alias-label-tertiary, #999); margin-bottom: 12px; }

/* ═══ Stats ═══════════════════════════════ */
.dsw-stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; }
.dsw-stat-card {
  border: 1px solid var(--dsw-alias-border-l1, #e5e5e5);
  border-radius: 14px; padding: 18px 16px; text-align: center;
  background: var(--dsw-alias-bg-base, #fff);
  transition: transform .2s ease, box-shadow .2s ease;
  cursor: default;
}
.dsw-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px color-mix(in srgb, var(--dsw-alias-label-primary, #000) 8%, transparent);
}
.dsw-stat-icon { font-size: 24px; margin-bottom: 6px; }
.dsw-stat-num {
  font-size: 28px; font-weight: 700;
  color: var(--dsw-alias-state-business-primary, #0070f3);
  animation: dsw-count-up .4s ease-out backwards;
}
.dsw-stat-label {
  font-size: 12px; color: var(--dsw-alias-label-tertiary, #999);
  margin-top: 4px; letter-spacing: .02em;
}

/* ═══ Badges ══════════════════════════════ */
.dsw-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 10px; border-radius: 99px;
  font-size: 12px; font-weight: 500; white-space: nowrap;
}
.dsw-badge-green  { background: color-mix(in srgb, #2e7d32 12%, var(--dsw-alias-bg-base, #fff)); color: #2e7d32; }
.dsw-badge-yellow { background: color-mix(in srgb, #f57f17 12%, var(--dsw-alias-bg-base, #fff)); color: #f57f17; }
.dsw-badge-blue   { background: color-mix(in srgb, #1565c0 10%, var(--dsw-alias-bg-base, #fff)); color: #1565c0; }
.dsw-badge-gray   { background: color-mix(in srgb, #616161 8%, var(--dsw-alias-bg-base, #fff)); color: #616161; }
.dsw-badge-red    { background: color-mix(in srgb, #c62828 10%, var(--dsw-alias-bg-base, #fff)); color: #c62828; }

/* ═══ Tables ══════════════════════════════ */
.dsw-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.dsw-table th, .dsw-table td {
  padding: 10px 14px; text-align: left; font-size: 13px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, #e5e5e5);
}
.dsw-table th {
  font-weight: 600; color: var(--dsw-alias-label-tertiary, #999);
  font-size: 11px; text-transform: uppercase; letter-spacing: .06em;
  background: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 95%, var(--dsw-alias-label-primary, #000));
  position: sticky; top: 0; z-index: 1;
}
.dsw-table tbody tr { transition: background .15s ease; }
.dsw-table tbody tr:hover {
  background: var(--dsw-alias-interactive-bg-hover, #fafafa);
}
.dsw-table tbody tr:active {
  background: color-mix(in srgb, var(--dsw-alias-interactive-bg-hover, #f0f0f0) 60%, var(--dsw-alias-state-business-primary, #0070f3) 5%);
}

/* ═══ Buttons ═════════════════════════════ */
.dsw-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 16px; border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-l2, #ddd);
  background: var(--dsw-alias-bg-base, #fff); cursor: pointer;
  font-size: 13px; color: var(--dsw-alias-label-primary, #333);
  transition: all .15s ease; font-weight: 500; white-space: nowrap;
}
.dsw-btn:hover {
  background: var(--dsw-alias-interactive-bg-hover, #f0f0f0);
  transform: translateY(-1px);
}
.dsw-btn:active { transform: translateY(0); }
.dsw-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }
.dsw-btn-primary {
  background: var(--dsw-alias-state-business-primary, #0070f3);
  color: #fff; border-color: transparent;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--dsw-alias-state-business-primary, #0070f3) 30%, transparent);
}
.dsw-btn-primary:hover { opacity: .92; box-shadow: 0 4px 12px color-mix(in srgb, var(--dsw-alias-state-business-primary, #0070f3) 35%, transparent); }
.dsw-btn-accent {
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #fff; border-color: transparent;
  box-shadow: 0 2px 8px color-mix(in srgb, #7c3aed 30%, transparent);
}
.dsw-btn-accent:hover { opacity: .92; box-shadow: 0 4px 12px color-mix(in srgb, #7c3aed 35%, transparent); }
.dsw-btn-danger {
  color: #c62828; border-color: color-mix(in srgb, #c62828 30%, transparent);
}
.dsw-btn-danger:hover { background: color-mix(in srgb, #c62828 6%, var(--dsw-alias-bg-base, #fff)); }
.dsw-btn-sm { padding: 5px 12px; font-size: 12px; border-radius: 8px; }

/* ═══ Inputs ══════════════════════════════ */
.dsw-input, .dsw-textarea, .dsw-select {
  display: block; width: 100%; padding: 9px 14px;
  border: 1px solid var(--dsw-alias-border-l2, #ddd);
  border-radius: 10px; font-size: 14px;
  background: var(--dsw-alias-bg-base, #fff);
  color: var(--dsw-alias-label-primary, #333);
  outline: none; transition: border-color .2s, box-shadow .2s;
}
.dsw-input:focus, .dsw-textarea:focus, .dsw-select:focus {
  border-color: var(--dsw-alias-state-business-primary, #0070f3);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary, #0070f3) 12%, transparent);
}
.dsw-textarea { min-height: 80px; resize: vertical; font-family: inherit; }
.dsw-form-row { margin-bottom: 14px; }
.dsw-form-label {
  display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px;
  color: var(--dsw-alias-label-secondary, #666);
}

/* ═══ Empty state ═════════════════════════ */
.dsw-empty {
  text-align: center; padding: 56px 24px;
  color: var(--dsw-alias-label-caption, #aaa);
}
.dsw-empty-icon { font-size: 56px; margin-bottom: 12px; opacity: .7; }
.dsw-empty-text { font-size: 14px; margin-bottom: 16px; }
.dsw-empty-hint { font-size: 12px; color: var(--dsw-alias-label-tertiary, #bbb); }

.dsw-actions { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }

.dsw-tag {
  display: inline-block; padding: 2px 8px; border-radius: 6px;
  font-size: 11px; font-weight: 500;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #000) 6%, var(--dsw-alias-bg-base, #fff));
  color: var(--dsw-alias-label-secondary, #555);
  margin-right: 4px;
}

/* ═══ Skeleton ════════════════════════════ */
.dsw-skeleton {
  background: linear-gradient(90deg,
    color-mix(in srgb, var(--dsw-alias-label-primary, #000) 5%, var(--dsw-alias-bg-base, #fff)) 25%,
    color-mix(in srgb, var(--dsw-alias-label-primary, #000) 10%, var(--dsw-alias-bg-base, #fff)) 37%,
    color-mix(in srgb, var(--dsw-alias-label-primary, #000) 5%, var(--dsw-alias-bg-base, #fff)) 63%);
  background-size: 800px 100%;
  animation: dsw-shimmer 1.4s ease-in-out infinite;
  border-radius: 8px;
}

/* ═══ Toast ═══════════════════════════════ */
.dsw-toast-container {
  position: fixed; top: 16px; right: 16px; z-index: 9999;
  display: flex; flex-direction: column; gap: 8px;
  pointer-events: none;
}
.dsw-toast {
  pointer-events: auto;
  padding: 10px 18px; border-radius: 12px;
  font-size: 13px; font-weight: 500;
  box-shadow: 0 4px 20px color-mix(in srgb, var(--dsw-alias-label-primary, #000) 12%, transparent);
  animation: dsw-toast-in .25s ease-out;
  display: flex; align-items: center; gap: 8px;
  backdrop-filter: blur(12px);
}
.dsw-toast.dsw-toast-exit { animation: dsw-toast-out .2s ease-in forwards; }
.dsw-toast-success {
  background: color-mix(in srgb, #2e7d32 12%, var(--dsw-alias-bg-base, #fff));
  color: #2e7d32; border: 1px solid color-mix(in srgb, #2e7d32 20%, transparent);
}
.dsw-toast-error {
  background: color-mix(in srgb, #c62828 12%, var(--dsw-alias-bg-base, #fff));
  color: #c62828; border: 1px solid color-mix(in srgb, #c62828 20%, transparent);
}
.dsw-toast-info {
  background: color-mix(in srgb, #1565c0 10%, var(--dsw-alias-bg-base, #fff));
  color: #1565c0; border: 1px solid color-mix(in srgb, #1565c0 20%, transparent);
}

/* ═══ Confirm dialog ══════════════════════ */
.dsw-confirm-backdrop {
  position: fixed; inset: 0; z-index: 9995;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #000) 40%, transparent);
  display: flex; align-items: center; justify-content: center;
  animation: dsw-fade-in .15s ease-out;
  backdrop-filter: blur(4px);
}
.dsw-confirm-box {
  background: var(--dsw-alias-bg-base, #fff);
  border-radius: 16px; padding: 24px; min-width: 320px; max-width: 400px;
  box-shadow: 0 8px 40px color-mix(in srgb, var(--dsw-alias-label-primary, #000) 16%, transparent);
  animation: dsw-slide-in .2s ease-out;
}
.dsw-confirm-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
.dsw-confirm-msg { font-size: 14px; color: var(--dsw-alias-label-secondary, #666); margin-bottom: 20px; }
.dsw-confirm-actions { display: flex; gap: 8px; justify-content: flex-end; }

/* ═══ Pipeline ════════════════════════════ */
.dsw-pipeline {
  display: flex; align-items: center; gap: 0;
  margin: 20px 0; padding: 16px; border-radius: 14px;
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #0070f3) 4%, var(--dsw-alias-bg-base, #fff));
  border: 1px solid var(--dsw-alias-border-l1, #e5e5e5);
}
.dsw-pipeline-step {
  flex: 1; text-align: center; padding: 10px 4px;
  font-size: 12px; color: var(--dsw-alias-label-tertiary, #999);
  position: relative;
}
.dsw-pipeline-step-icon { font-size: 22px; margin-bottom: 4px; display: block; }
.dsw-pipeline-step-label { font-weight: 500; }
.dsw-pipeline-step-count { font-size: 18px; font-weight: 700; color: var(--dsw-alias-state-business-primary, #0070f3); }
.dsw-pipeline-arrow {
  color: var(--dsw-alias-label-caption, #ccc); font-size: 16px; flex-shrink: 0; margin: 0 2px;
}

/* ═══ Section header ══════════════════════ */
.dsw-section-header {
  display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
}
.dsw-section-title { font-size: 18px; font-weight: 700; flex: 1; }

/* ═══ Filter chips ════════════════════════ */
.dsw-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
.dsw-chip {
  padding: 5px 14px; border-radius: 99px; font-size: 12px; font-weight: 500;
  border: 1px solid var(--dsw-alias-border-l2, #ddd);
  background: var(--dsw-alias-bg-base, #fff); cursor: pointer;
  color: var(--dsw-alias-label-secondary, #666);
  transition: all .15s ease;
}
.dsw-chip:hover { border-color: var(--dsw-alias-state-business-primary, #0070f3); }
.dsw-chip[data-active="true"] {
  background: var(--dsw-alias-state-business-primary, #0070f3);
  color: #fff; border-color: transparent;
}

/* ═══ Draft body ══════════════════════════ */
.dsw-draft-body {
  white-space: pre-wrap; line-height: 1.8; font-size: 15px;
  padding: 20px 24px; border-radius: 14px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #000) 2%, var(--dsw-alias-bg-base, #fff));
  border: 1px solid var(--dsw-alias-border-l1, #e5e5e5);
  position: relative;
}
.dsw-copy-btn {
  position: absolute; top: 10px; right: 10px;
  background: var(--dsw-alias-bg-base, #fff); border: 1px solid var(--dsw-alias-border-l2, #ddd);
  border-radius: 8px; padding: 5px 10px; font-size: 12px; cursor: pointer;
  opacity: 0; transition: opacity .2s;
}
.dsw-draft-body:hover .dsw-copy-btn { opacity: 1; }
.dsw-copy-btn:hover { background: var(--dsw-alias-interactive-bg-hover, #f0f0f0); }

/* ═══ Score ring ══════════════════════════ */
.dsw-score { display: inline-flex; align-items: center; gap: 4px; font-weight: 700; }
.dsw-score-high { color: #2e7d32; }
.dsw-score-mid  { color: #f57f17; }
.dsw-score-low  { color: #c62828; }

/* ═══ Sidebar button ══════════════════════ */
.dsw-sidebar-btn {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 8px 12px; border: none; background: none;
  cursor: pointer; color: var(--dsw-alias-label-secondary, #999);
  font-size: 13px; border-radius: 8px; transition: all .2s ease;
}
.dsw-sidebar-btn:hover {
  background: var(--dsw-alias-interactive-bg-hover, #f0f0f0);
  color: var(--dsw-alias-label-primary, #333);
}
.dsw-sidebar-btn:active { animation: dsw-pop .25s ease; }
.dsw-sidebar-btn-icon { font-size: 16px; }

/* ═══ Responsive ══════════════════════════ */
@media (max-width: 640px) {
  .dsw-nav { width: 60px; padding: 8px 4px; }
  .dsw-nav-item { padding: 10px 8px; justify-content: center; }
  .dsw-nav-item span:last-child { display: none; }
  .dsw-content { padding: 16px; }
}

/* ═══ Platform Preview ═══════════════════ */
.dsw-preview-wrap {
  margin-top: 24px; border-radius: 16px; overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l1, #e5e5e5);
  background: var(--dsw-alias-bg-l1, #f7f7f7);
}
.dsw-preview-tabs {
  display: flex; gap: 0; border-bottom: 1px solid var(--dsw-alias-border-l1, #e5e5e5);
  background: var(--dsw-alias-bg-base, #fff);
}
.dsw-preview-tab {
  flex: 1; padding: 10px 0; text-align: center; font-size: 13px; font-weight: 500;
  cursor: pointer; border: none; background: none; transition: all .2s;
  color: var(--dsw-alias-label-secondary, #666);
  border-bottom: 2px solid transparent;
}
.dsw-preview-tab[data-active="true"] {
  color: var(--dsw-alias-state-business-primary, #0070f3);
  border-bottom-color: var(--dsw-alias-state-business-primary, #0070f3);
}
.dsw-preview-frame {
  display: flex; justify-content: center; padding: 24px;
  min-height: 400px; overflow: auto;
}
.dsw-phone-frame {
  width: 375px; max-width: 100%; border-radius: 24px; overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.06);
  background: #fff;
}

/* WeChat Preview */
.dsw-wx-header {
  padding: 20px 16px 12px; text-align: center;
}
.dsw-wx-title {
  font-size: 22px; font-weight: 700; line-height: 1.4;
  color: #1a1a1a; margin: 0;
}
.dsw-wx-meta {
  margin-top: 10px; font-size: 12px; color: #999;
  display: flex; justify-content: center; gap: 12px;
}
.dsw-wx-body {
  padding: 0 16px 20px; font-size: 15px; line-height: 1.8; color: #333;
  word-break: break-word; white-space: pre-wrap;
}
.dsw-wx-body-html {
  padding: 0 16px 20px; font-size: 15px; line-height: 1.8; color: #333;
}
.dsw-wx-footer {
  padding: 12px 16px 16px; border-top: 1px solid #f0f0f0;
  display: flex; justify-content: space-between; font-size: 12px; color: #999;
}

/* Xiaohongshu Preview */
.dsw-xhs-cover {
  width: 100%; aspect-ratio: 3/4; display: flex; align-items: center;
  justify-content: center; position: relative; overflow: hidden;
}
.dsw-xhs-cover-gradient {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24, #ff9f43);
}
.dsw-xhs-cover-title {
  position: relative; z-index: 1; padding: 24px; text-align: center;
  font-size: 24px; font-weight: 800; color: #fff; line-height: 1.5;
  text-shadow: 0 2px 8px rgba(0,0,0,.3);
}
.dsw-xhs-body { padding: 16px; }
.dsw-xhs-body-title {
  font-size: 17px; font-weight: 700; margin: 0 0 8px; color: #333;
}
.dsw-xhs-body-text {
  font-size: 14px; line-height: 1.8; color: #555; white-space: pre-wrap;
}
.dsw-xhs-tags {
  padding: 8px 16px; display: flex; flex-wrap: wrap; gap: 6px;
}
.dsw-xhs-tag {
  font-size: 13px; color: #ff6b6b; font-weight: 500;
}
.dsw-xhs-bar {
  padding: 12px 16px; display: flex; justify-content: space-around;
  font-size: 12px; color: #999; border-top: 1px solid #f0f0f0;
}

/* Douyin Preview */
.dsw-dy-frame {
  width: 375px; max-width: 100%; aspect-ratio: 9/16; border-radius: 24px;
  overflow: hidden; position: relative;
  background: linear-gradient(180deg, #1a1a2e, #16213e, #0f3460);
  box-shadow: 0 8px 32px rgba(0,0,0,.2);
}
.dsw-dy-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 16px; background: linear-gradient(transparent, rgba(0,0,0,.7));
}
.dsw-dy-author {
  font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 8px;
}
.dsw-dy-desc {
  font-size: 13px; color: rgba(255,255,255,.9); line-height: 1.6;
  white-space: pre-wrap; max-height: 120px; overflow: hidden;
}
.dsw-dy-hashtags {
  margin-top: 6px; font-size: 13px; color: #69c0ff;
}
.dsw-dy-actions {
  position: absolute; right: 12px; bottom: 120px;
  display: flex; flex-direction: column; align-items: center; gap: 18px;
}
.dsw-dy-action-btn {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  font-size: 10px; color: #fff;
}
.dsw-dy-action-icon { font-size: 24px; }

/* Twitter Preview */
.dsw-tw-frame {
  width: 500px; max-width: 100%; border-radius: 16px; overflow: hidden;
  background: #fff; box-shadow: 0 4px 16px rgba(0,0,0,.08);
}
.dsw-tw-header {
  padding: 12px 16px 0; display: flex; gap: 10px;
}
.dsw-tw-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; color: #fff; flex-shrink: 0;
}
.dsw-tw-user { font-size: 14px; }
.dsw-tw-name { font-weight: 700; color: #0f1419; }
.dsw-tw-handle { color: #536471; font-size: 13px; }
.dsw-tw-body {
  padding: 8px 16px 12px 66px; font-size: 15px; line-height: 1.5;
  color: #0f1419; white-space: pre-wrap;
}
.dsw-tw-tags { color: #1d9bf0; }
.dsw-tw-footer {
  padding: 8px 16px 12px 66px; display: flex; gap: 48px;
  font-size: 13px; color: #536471;
}
.dsw-tw-char-count {
  text-align: right; padding: 0 16px 8px; font-size: 12px;
}
.dsw-tw-char-ok { color: #536471; }
.dsw-tw-char-over { color: #f4212e; font-weight: 600; }

/* ═══ Calendar ═══════════════════════════ */
.dsw-cal-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
}
.dsw-cal-nav { display: flex; align-items: center; gap: 12px; }
.dsw-cal-nav-btn {
  width: 32px; height: 32px; border: 1px solid var(--dsw-alias-border-l1, #ddd);
  border-radius: 8px; background: var(--dsw-alias-bg-l0, #fff); cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 14px;
  transition: background .15s;
}
.dsw-cal-nav-btn:hover { background: var(--dsw-alias-bg-l1, #f0f0f0); }
.dsw-cal-month { font-size: 18px; font-weight: 700; min-width: 140px; text-align: center; }
.dsw-cal-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px;
  border: 1px solid var(--dsw-alias-border-l1, #e5e5e5); border-radius: 10px; overflow: hidden;
  background: var(--dsw-alias-border-l1, #e5e5e5);
}
.dsw-cal-dow {
  background: var(--dsw-alias-bg-l1, #f7f7f7); padding: 8px 4px; text-align: center;
  font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-secondary, #888);
}
.dsw-cal-cell {
  background: var(--dsw-alias-bg-l0, #fff); min-height: 80px; padding: 4px; cursor: pointer;
  transition: background .12s; position: relative; vertical-align: top;
}
.dsw-cal-cell:hover { background: var(--dsw-alias-bg-l1, rgba(0,0,0,.02)); }
.dsw-cal-cell[data-today='true'] { background: rgba(0,112,243,.04); }
.dsw-cal-cell[data-other='true'] { opacity: .35; }
.dsw-cal-day {
  font-size: 12px; font-weight: 600; padding: 2px 6px;
  color: var(--dsw-alias-label-secondary, #666); line-height: 1.5;
}
.dsw-cal-cell[data-today='true'] .dsw-cal-day {
  color: #fff; background: #0070f3; border-radius: 10px; display: inline-block;
}
.dsw-cal-event {
  display: block; padding: 1px 4px; margin: 1px 0; border-radius: 4px;
  font-size: 10px; line-height: 1.5; white-space: nowrap; overflow: hidden;
  text-overflow: ellipsis; cursor: pointer;
}
.dsw-cal-event[data-status='writing'] { background: rgba(59,130,246,.12); color: #3b82f6; }
.dsw-cal-event[data-status='reviewing'] { background: rgba(245,158,11,.12); color: #f59e0b; }
.dsw-cal-event[data-status='ready'] { background: rgba(16,185,129,.12); color: #10b981; }
.dsw-cal-event[data-status='published'] { background: rgba(139,92,246,.12); color: #8b5cf6; }
.dsw-cal-legend { display: flex; gap: 16px; margin-top: 12px; justify-content: center; }
.dsw-cal-legend-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--dsw-alias-label-secondary, #888); }
.dsw-cal-legend-dot {
  width: 10px; height: 10px; border-radius: 3px;
}

/* ═══ Pipeline Visualization ═════════════ */
.dsw-pipeline { display: flex; align-items: center; gap: 0; margin: 16px 0; }
.dsw-pipeline-stage {
  flex: 1; text-align: center; padding: 12px 8px; position: relative;
  background: var(--dsw-alias-bg-l1, #f5f5f5); transition: background .2s;
}
.dsw-pipeline-stage:first-child { border-radius: 8px 0 0 8px; }
.dsw-pipeline-stage:last-child { border-radius: 0 8px 8px 0; }
.dsw-pipeline-count { font-size: 24px; font-weight: 700; line-height: 1.3; }
.dsw-pipeline-label { font-size: 11px; color: var(--dsw-alias-label-secondary, #888); margin-top: 2px; }
.dsw-pipeline-arrow {
  width: 0; height: 0; border-top: 14px solid transparent; border-bottom: 14px solid transparent;
  border-left: 10px solid var(--dsw-alias-border-l1, #ddd); flex-shrink: 0;
}

/* ═══ Quick Actions ════════════════════════ */
.dsw-quick-actions { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-top: 12px; }
.dsw-quick-action {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 16px 8px; border-radius: 10px; cursor: pointer; text-align: center;
  border: 1px solid var(--dsw-alias-border-l1, #e5e5e5);
  background: var(--dsw-alias-bg-l0, #fff); transition: all .15s;
}
.dsw-quick-action:hover { border-color: var(--dsw-alias-state-business-primary, #0070f3); background: rgba(0,112,243,.03); transform: translateY(-1px); }
.dsw-quick-action-icon { font-size: 24px; }
.dsw-quick-action-label { font-size: 12px; font-weight: 500; color: var(--dsw-alias-label-primary, #333); }
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

// ─── Toast System ────────────────────────────────────────────────────

interface Toast { id: number; type: 'success' | 'error' | 'info'; message: string; exiting?: boolean }
let _toasts: Toast[] = []
let _toastId = 0
let _setToasts: ((t: Toast[]) => void) | null = null

function showToast(type: Toast['type'], message: string): void {
  const id = ++_toastId
  _toasts = [..._toasts, { id, type, message }]
  _setToasts?.(_toasts)
  setTimeout(() => {
    _toasts = _toasts.map(t => t.id === id ? { ...t, exiting: true } : t)
    _setToasts?.(_toasts)
    setTimeout(() => {
      _toasts = _toasts.filter(t => t.id !== id)
      _setToasts?.(_toasts)
    }, 200)
  }, 2800)
}

const ToastContainer: FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([])
  useEffect(() => { _setToasts = setToasts; return () => { _setToasts = null } }, [])
  if (toasts.length === 0) return null
  return h('div', { className: 'dsw-toast-container' },
    ...toasts.map(t =>
      h('div', { key: t.id, className: `dsw-toast dsw-toast-${t.type}${t.exiting ? ' dsw-toast-exit' : ''}` },
        h('span', null, t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'),
        h('span', null, t.message),
      ),
    ),
  )
}

// ─── Confirm Dialog ──────────────────────────────────────────────────

let _confirmResolve: ((v: boolean) => void) | null = null
let _setConfirmState: ((s: { open: boolean; title: string; message: string }) => void) | null = null

function confirm(title: string, message: string): Promise<boolean> {
  return new Promise(resolve => {
    _confirmResolve = resolve
    _setConfirmState?.({ open: true, title, message })
  })
}

const ConfirmDialog: FC = () => {
  const [state, setState] = useState({ open: false, title: '', message: '' })
  useEffect(() => { _setConfirmState = setState; return () => { _setConfirmState = null } }, [])

  const handle = (v: boolean) => {
    _confirmResolve?.(v)
    _confirmResolve = null
    setState(s => ({ ...s, open: false }))
  }

  if (!state.open) return null
  return h('div', { className: 'dsw-confirm-backdrop', onClick: () => handle(false) },
    h('div', { className: 'dsw-confirm-box', onClick: (e: { stopPropagation: () => void }) => e.stopPropagation() },
      h('div', { className: 'dsw-confirm-title' }, state.title),
      h('div', { className: 'dsw-confirm-msg' }, state.message),
      h('div', { className: 'dsw-confirm-actions' },
        h('button', { className: 'dsw-btn', onClick: () => handle(false) }, '取消'),
        h('button', { className: 'dsw-btn dsw-btn-danger', onClick: () => handle(true) }, '确认删除'),
      ),
    ),
  )
}

// ─── Skeleton Components ─────────────────────────────────────────────

const Skeleton: FC<{ width?: string; height?: string; style?: Record<string, string | number> }> = ({ width = '100%', height = '16px', style }) =>
  h('div', { className: 'dsw-skeleton', style: { width, height, ...style } })

const SkeletonCards: FC<{ count?: number }> = ({ count = 3 }) =>
  h('div', null, ...Array.from({ length: count }, (_, i) =>
    h('div', { key: i, className: 'dsw-card', style: { marginBottom: 12 } },
      h(Skeleton, { width: '40%', height: '18px', style: { marginBottom: 10 } }),
      h(Skeleton, { width: '100%', height: '14px', style: { marginBottom: 6 } }),
      h(Skeleton, { width: '60%', height: '14px' }),
    ),
  ))

const SkeletonStats: FC = () =>
  h('div', { className: 'dsw-stat-grid' }, ...Array.from({ length: 6 }, (_, i) =>
    h('div', { key: i, className: 'dsw-stat-card' },
      h(Skeleton, { width: '32px', height: '32px', style: { margin: '0 auto 8px', borderRadius: '50%' } }),
      h(Skeleton, { width: '60px', height: '24px', style: { margin: '0 auto 6px' } }),
      h(Skeleton, { width: '48px', height: '12px', style: { margin: '0 auto' } }),
    ),
  ))

// ─── Copy helper ─────────────────────────────────────────────────────

function copyText(text: string): void {
  navigator.clipboard.writeText(text).then(
    () => showToast('success', '已复制到剪贴板'),
    () => showToast('error', '复制失败'),
  )
}

// ─── Send to DSH Chat ────────────────────────────────────────────────

let _closeOverlay: (() => void) | null = null
let _switchTab: ((tab: string) => void) | null = null

function navigateTo(tab: string): void {
  _switchTab?.(tab)
}

function sendToDshChat(prompt: string): void {
  navigator.clipboard.writeText(prompt).then(() => {
    _closeOverlay?.()
    setTimeout(() => {
      const targets = document.querySelectorAll<HTMLElement>(
        'textarea, [contenteditable="true"], [role="textbox"]',
      )
      let input: HTMLElement | null = null
      for (const el of targets) {
        if (el.closest('.dsh-social-overlay')) continue
        const rect = el.getBoundingClientRect()
        if (rect.width > 100 && rect.height > 20) { input = el; break }
      }
      if (input) {
        input.focus()
        if (input instanceof HTMLTextAreaElement) {
          input.value = prompt
          input.dispatchEvent(new Event('input', { bubbles: true }))
          input.setSelectionRange(prompt.length, prompt.length)
        } else if (input.getAttribute('contenteditable') === 'true') {
          input.textContent = prompt
          input.dispatchEvent(new Event('input', { bubbles: true }))
          const range = document.createRange()
          range.selectNodeContents(input)
          range.collapse(false)
          const sel = window.getSelection()
          sel?.removeAllRanges()
          sel?.addRange(range)
        }
        showToast('success', '✅ AI 提示已填入对话框，请检查后发送')
      } else {
        showToast('info', '✅ AI 提示已复制到剪贴板，请粘贴到 DSH 对话发送 (⌘V)')
      }
    }, 400)
  }).catch(() => {
    showToast('error', '复制失败')
  })
}

function buildDraftAiPrompt(draft: Draft, task: 'polish' | 'rewrite' | 'expand' | 'shorten'): string {
  const taskLabels: Record<string, string> = {
    polish: '润色优化',
    rewrite: '重写改稿',
    expand: '扩写丰富',
    shorten: '精简缩写',
  }
  const platform = PLATFORM_LABELS[draft.platform] ?? draft.platform
  return `请帮我对以下自媒体草稿进行【${taskLabels[task]}】。

目标平台：${platform}
标题：${draft.title}

--- 正文 ---
${draft.body}
${draft.versions?.length ? `\n--- 已有变体 ---\n${draft.versions.map((v: { platform: string; title: string }, i: number) => `变体${i + 1} (${PLATFORM_LABELS[v.platform as Platform] ?? v.platform}): ${v.title}`).join('\n')}` : ''}
---

要求：
1. 保持 ${platform} 平台的风格和调性
2. ${task === 'polish' ? '修正语法，提升表达力，保持原意' : task === 'rewrite' ? '用全新角度重写，保留核心信息' : task === 'expand' ? '补充细节、案例或数据，丰富内容' : '删减冗余，保留精华，控制字数'}
3. 输出完整优化后的内容`
}

// ─── Tab Pages ───────────────────────────────────────────────────────

// ── Dashboard ────────────────────────────────────────────────────────

const STAT_ICONS: { icon: string; label: string }[] = [
  { icon: '📝', label: '素材' },
  { icon: '💡', label: '待处理选题' },
  { icon: '✍️', label: '进行中草稿' },
  { icon: '🚀', label: '待发布' },
  { icon: '👀', label: '监控账号' },
  { icon: '📡', label: 'TikHub' },
  { icon: '🤖', label: 'OpenCLI' },
  { icon: '✒️', label: '文颜排版' },
]

interface QuickAction {
  icon: string
  label: string
  action: () => void
}

function makeQuickActions(): QuickAction[] {
  return [
    { icon: '📝', label: '收集素材', action: () => navigateTo('materials') },
    { icon: '💡', label: '提炼选题', action: () => sendToDshChat('请根据我的素材库帮我提炼几个选题。请使用 social_topic_extract 工具。') },
    { icon: '✍️', label: 'AI 起稿', action: () => sendToDshChat('请帮我写一篇草稿。请使用 social_draft_write 工具。') },
    { icon: '🔍', label: '发布体检', action: () => navigateTo('drafts') },
    { icon: '📅', label: '内容日历', action: () => navigateTo('calendar') },
    { icon: '📡', label: '热点雷达', action: () => navigateTo('radar') },
    { icon: '📊', label: '内容评分', action: () => sendToDshChat('请对我最新的草稿进行内容评分。请使用 social_content_score 工具。') },
    { icon: '📆', label: '周计划', action: () => sendToDshChat('请使用 social_weekly_plan 工具，结合我的创作者画像生成本周 7 天内容发布计划。') },
  ]
}

const DashboardPage: FC = () => {
  const { data, loading } = useApi<DashboardSummary>('/dashboard')
  if (loading || !data) return h(SkeletonStats, null)

  const statValues = [
    data.materials,
    data.topicsNew,
    data.drafts.writing + data.drafts.reviewing,
    data.drafts.ready,
    data.watched,
    data.tikhubReady ? '✅' : '❌',
    data.opencliReady ? '✅' : '❌',
    data.wenyanReady ? '✅' : '❌',
  ]

  return h('div', { className: 'dsw-page-enter' },
    h('div', { className: 'dsw-section-header' },
      h('h2', { className: 'dsw-section-title' }, '📊 工作台概览'),
    ),

    h('div', { className: 'dsw-stat-grid', style: { marginTop: 8 } },
      ...STAT_ICONS.map((s, i) =>
        h('div', { key: i, className: 'dsw-stat-card', style: { animationDelay: `${i * 60}ms` } },
          h('div', { className: 'dsw-stat-icon' }, s.icon),
          h('div', { className: 'dsw-stat-num', style: { animationDelay: `${i * 60 + 100}ms` } }, statValues[i]),
          h('div', { className: 'dsw-stat-label' }, s.label),
        ),
      ),
    ),

    h('div', { className: 'dsw-card', style: { marginTop: 16 } },
      h('div', { className: 'dsw-card-title' }, '🔄 内容流水线'),
      h('div', { className: 'dsw-pipeline' },
        ...[
          { label: '素材', count: data.materials, color: '#94a3b8' },
          { label: '选题', count: data.topicsNew, color: '#60a5fa' },
          { label: '写作中', count: data.drafts.writing, color: '#3b82f6' },
          { label: '审核中', count: data.drafts.reviewing, color: '#f59e0b' },
          { label: '待发布', count: data.drafts.ready, color: '#10b981' },
          { label: '已发布', count: data.drafts.published, color: '#8b5cf6' },
        ].flatMap((stage, i, arr) => {
          const items: ReactNode[] = [
            h('div', { key: `s${i}`, className: 'dsw-pipeline-stage', style: { background: `${stage.color}10` } },
              h('div', { className: 'dsw-pipeline-count', style: { color: stage.color } }, stage.count),
              h('div', { className: 'dsw-pipeline-label' }, stage.label),
            ),
          ]
          if (i < arr.length - 1) items.push(h('div', { key: `a${i}`, className: 'dsw-pipeline-arrow' }))
          return items
        }),
      ),
    ),

    h('div', { className: 'dsw-card', style: { marginTop: 16 } },
      h('div', { className: 'dsw-card-title' }, '⚡ 快捷操作'),
      h('div', { className: 'dsw-card-subtitle' }, '点击跳转到对应功能或发送 AI 指令'),
      h('div', { className: 'dsw-quick-actions' },
        ...makeQuickActions().map((qa, i) =>
          h('div', { key: i, className: 'dsw-quick-action', onClick: qa.action },
            h('div', { className: 'dsw-quick-action-icon' }, qa.icon),
            h('div', { className: 'dsw-quick-action-label' }, qa.label),
          ),
        ),
      ),
    ),

    data.outliers.length > 0 && h('div', { className: 'dsw-card', style: { marginTop: 16 } },
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
        h('div', { key: i, style: { padding: '6px 0', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 } },
          h('span', { className: 'dsw-badge dsw-badge-blue' }, PLATFORM_LABELS[u.platform] ?? u.platform),
          h('strong', null, u.title),
          h('span', { style: { color: 'var(--dsw-alias-label-tertiary, #999)' } },
            new Date(u.scheduledAt).toLocaleDateString('zh-CN')),
        ),
      ),
    ),
  )
}

// ── Materials ────────────────────────────────────────────────────────

const MaterialsPage: FC = () => {
  const { data, loading, reload } = useApi<Material[]>('/materials')
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState({ source: 'note' as MaterialSource, title: '', content: '', url: '', tags: '' })

  const handleAdd = async () => {
    try {
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
      showToast('success', '素材已保存')
      reload()
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : '保存失败')
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm('删除素材', '确定要删除这条素材吗？此操作不可撤销。')
    if (!ok) return
    try {
      await api(`/materials/${id}`, { method: 'DELETE' })
      showToast('success', '已删除')
      reload()
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : '删除失败')
    }
  }

  if (loading) return h(SkeletonCards, { count: 4 })

  const filtered = data && search
    ? data.filter(m =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
    : data

  return h('div', { className: 'dsw-page-enter' },
    h('div', { className: 'dsw-section-header' },
      h('h2', { className: 'dsw-section-title' }, '📝 素材库'),
      h('button', { className: 'dsw-btn dsw-btn-primary', onClick: () => setAdding(!adding) }, adding ? '✕ 取消' : '+ 添加素材'),
    ),

    !adding && data && data.length > 3 && h('div', { style: { marginBottom: 14 } },
      h('input', {
        className: 'dsw-input', value: search, placeholder: '🔍 搜索素材…',
        onChange: (e: { target: { value: string } }) => setSearch(e.target.value),
        style: { maxWidth: 320 },
      }),
    ),

    adding && h('div', { className: 'dsw-card', style: { animation: 'dsw-slide-in .2s ease-out' } },
      h('div', { className: 'dsw-card-title' }, '添加新素材'),
      h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 } },
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
      ),
      h('div', { className: 'dsw-form-row' },
        h('label', { className: 'dsw-form-label' }, '内容'),
        h('textarea', { className: 'dsw-textarea', value: form.content, onChange: (e: { target: { value: string } }) => setForm({ ...form, content: e.target.value }), placeholder: '粘贴或输入素材内容…', rows: 5 }),
      ),
      h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 } },
        h('div', { className: 'dsw-form-row' },
          h('label', { className: 'dsw-form-label' }, '链接（可选）'),
          h('input', { className: 'dsw-input', value: form.url, onChange: (e: { target: { value: string } }) => setForm({ ...form, url: e.target.value }), placeholder: 'https://...' }),
        ),
        h('div', { className: 'dsw-form-row' },
          h('label', { className: 'dsw-form-label' }, '标签（逗号分隔）'),
          h('input', { className: 'dsw-input', value: form.tags, onChange: (e: { target: { value: string } }) => setForm({ ...form, tags: e.target.value }), placeholder: '标签1, 标签2' }),
        ),
      ),
      h('div', { style: { display: 'flex', gap: 8, justifyContent: 'flex-end' } },
        h('button', { className: 'dsw-btn', onClick: () => setAdding(false) }, '取消'),
        h('button', { className: 'dsw-btn dsw-btn-primary', onClick: handleAdd, disabled: !form.title || !form.content }, '💾 保存'),
      ),
    ),

    !filtered || filtered.length === 0
      ? h('div', { className: 'dsw-empty' },
        h('div', { className: 'dsw-empty-icon' }, search ? '🔍' : '📭'),
        h('div', { className: 'dsw-empty-text' }, search ? '没有匹配的素材' : '还没有素材，开始收集吧'),
        !search && h('div', { className: 'dsw-empty-hint' }, '💡 在 DSH 对话中说"帮我保存一条素材"即可快速添加'),
      )
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
          ...filtered.slice().reverse().flatMap(m => {
            const isExpanded = expanded === m.id
            const items: ReactNode[] = [
              h('tr', { key: m.id, style: { cursor: 'pointer' }, onClick: () => setExpanded(isExpanded ? null : m.id) },
                h('td', null, h('span', { className: 'dsw-badge dsw-badge-gray' }, MATERIAL_SOURCE_LABELS[m.source] ?? m.source)),
                h('td', null, h('strong', null, `${isExpanded ? '▾' : '▸'} ${m.title}`)),
                h('td', null, ...m.tags.map(t => h('span', { key: t, className: 'dsw-tag' }, t))),
                h('td', null, new Date(m.createdAt).toLocaleDateString('zh-CN')),
                h('td', null, h('button', { className: 'dsw-btn dsw-btn-sm dsw-btn-danger', onClick: (e: { stopPropagation: () => void }) => { e.stopPropagation(); handleDelete(m.id) } }, '🗑')),
              ),
            ]
            if (isExpanded) {
              items.push(
                h('tr', { key: `${m.id}-detail` },
                  h('td', { colSpan: 5, style: { padding: 0 } },
                    h('div', { style: {
                      padding: '12px 16px', background: 'var(--dsw-alias-bg-l1, #f7f7f7)',
                      borderTop: '1px solid var(--dsw-alias-border-l1, #eee)',
                      fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--dsw-alias-label-primary, #333)',
                    } },
                      m.content,
                      m.url && h('div', { style: { marginTop: 8 } },
                        h('a', { href: m.url, target: '_blank', rel: 'noopener noreferrer', style: { color: 'var(--dsw-alias-state-business-primary, #0070f3)', textDecoration: 'underline' } },
                          `🔗 ${m.url}`),
                      ),
                      h('div', { style: { marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' } },
                        h('button', { className: 'dsw-btn dsw-btn-sm', onClick: (e: { stopPropagation: () => void }) => { e.stopPropagation(); copyText(m.content) } }, '📋 复制内容'),
                        h('button', { className: 'dsw-btn dsw-btn-sm', onClick: (e: { stopPropagation: () => void }) => {
                          e.stopPropagation()
                          sendToDshChat(`请帮我分析以下自媒体素材，提取关键信息，给出选题建议和创作方向：\n\n标题：${m.title}\n类型：${MATERIAL_SOURCE_LABELS[m.source] ?? m.source}\n标签：${m.tags.join(', ')}\n${m.url ? `来源链接：${m.url}\n` : ''}\n--- 内容 ---\n${m.content}\n---\n\n请给出：\n1. 核心要点提炼\n2. 3个可选选题方向\n3. 适合的发布平台建议`)
                        } }, '🤖 AI 分析'),
                      ),
                    ),
                  ),
                ),
              )
            }
            return items
          }),
        ),
      ),
  )
}

// ── Topics ───────────────────────────────────────────────────────────

const TOPIC_STATUS_MAP: Record<string, { badge: string; label: string }> = {
  new: { badge: 'dsw-badge-blue', label: '新' },
  planned: { badge: 'dsw-badge-yellow', label: '计划中' },
  drafted: { badge: 'dsw-badge-green', label: '已起稿' },
  dropped: { badge: 'dsw-badge-gray', label: '已放弃' },
}

const statusBadge = (status: string) => {
  const info = TOPIC_STATUS_MAP[status]
  return h('span', { className: `dsw-badge ${info?.badge ?? 'dsw-badge-gray'}` }, info?.label ?? status)
}

const TopicsPage: FC = () => {
  const { data, loading, reload } = useApi<Topic[]>('/topics')
  const [filter, setFilter] = useState<string>('all')

  const handleDelete = async (id: string) => {
    const ok = await confirm('删除选题', '确定要删除这个选题吗？')
    if (!ok) return
    try {
      await api(`/topics/${id}`, { method: 'DELETE' })
      showToast('success', '选题已删除')
      reload()
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : '删除失败')
    }
  }

  if (loading) return h(SkeletonCards, { count: 3 })

  const filtered = data && filter !== 'all'
    ? data.filter(t => t.status === filter)
    : data

  return h('div', { className: 'dsw-page-enter' },
    h('div', { className: 'dsw-section-header' },
      h('h2', { className: 'dsw-section-title' }, '💡 选题库'),
    ),

    data && data.length > 0 && h('div', { className: 'dsw-chips' },
      h('button', { className: 'dsw-chip', 'data-active': String(filter === 'all'), onClick: () => setFilter('all') }, `全部 (${data.length})`),
      ...Object.entries(TOPIC_STATUS_MAP).map(([key, info]) => {
        const count = data.filter(t => t.status === key).length
        return count > 0
          ? h('button', { key, className: 'dsw-chip', 'data-active': String(filter === key), onClick: () => setFilter(key) }, `${info.label} (${count})`)
          : null
      }),
    ),

    !filtered || filtered.length === 0
      ? h('div', { className: 'dsw-empty' },
        h('div', { className: 'dsw-empty-icon' }, '💡'),
        h('div', { className: 'dsw-empty-text' }, filter !== 'all' ? '没有匹配的选题' : '还没有选题'),
        filter === 'all' && h('div', { className: 'dsw-empty-hint' }, '💡 在对话中说"根据我的素材库提炼几个选题"'),
      )
      : h('div', null,
        ...filtered.slice().reverse().map(t =>
          h('div', { key: t.id, className: 'dsw-card' },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 } },
              h('div', { className: 'dsw-card-title', style: { flex: 1 } }, t.title),
              h('div', { style: { display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 } },
                statusBadge(t.status),
                (t.status === 'new' || t.status === 'planned') && h('button', {
                  className: 'dsw-btn dsw-btn-sm dsw-btn-primary',
                  onClick: () => sendToDshChat(`请帮我根据以下选题写一篇自媒体草稿：\n\n选题标题：${t.title}\n切入角度：${t.angle}${t.hook ? `\n钩子：${t.hook}` : ''}${t.audience ? `\n目标受众：${t.audience}` : ''}${t.quotes.length ? `\n参考素材：\n${t.quotes.map(q => `"${q}"`).join('\n')}` : ''}\n\n请输出：\n1. 标题\n2. 正文\n3. 3-5个标签\n\n要求：风格接地气、有网感、适合短视频平台`),
                }, '✍️ AI 起草'),
                h('button', { className: 'dsw-btn dsw-btn-sm dsw-btn-danger', onClick: () => handleDelete(t.id) }, '🗑'),
              ),
            ),
            h('div', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary, #666)', marginTop: 6 } },
              h('strong', null, '🎯 切入角度：'), t.angle,
            ),
            t.hook && h('div', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary, #666)', marginTop: 4 } },
              h('strong', null, '🪝 钩子：'), t.hook,
            ),
            t.audience && h('div', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary, #666)', marginTop: 4 } },
              h('strong', null, '👥 受众：'), t.audience,
            ),
            t.quotes.length > 0 && h('div', {
              style: {
                marginTop: 10, padding: '10px 14px', borderRadius: 10, fontSize: 13, fontStyle: 'italic',
                color: 'var(--dsw-alias-label-tertiary, #888)',
                background: 'color-mix(in srgb, var(--dsw-alias-label-primary, #000) 3%, var(--dsw-alias-bg-base, #fff))',
                borderLeft: '3px solid var(--dsw-alias-state-business-primary, #0070f3)',
              },
            },
              ...t.quotes.map((q, i) => h('div', { key: i, style: { marginTop: i > 0 ? 4 : 0 } }, `"${q}"`)),
            ),
          ),
        ),
      ),
  )
}

// ── Drafts ───────────────────────────────────────────────────────────

const DRAFT_STATUS_CONFIG: Record<DraftStatus, { badge: string; emoji: string }> = {
  writing: { badge: 'dsw-badge-yellow', emoji: '✏️' },
  reviewing: { badge: 'dsw-badge-blue', emoji: '🔍' },
  ready: { badge: 'dsw-badge-green', emoji: '✅' },
  published: { badge: 'dsw-badge-gray', emoji: '🚀' },
}

const draftStatusBadge = (status: DraftStatus) =>
  h('span', { className: `dsw-badge ${DRAFT_STATUS_CONFIG[status].badge}` },
    `${DRAFT_STATUS_CONFIG[status].emoji} ${DRAFT_STATUS_LABELS[status]}`)

const scoreClass = (score: number) => score >= 80 ? 'dsw-score-high' : score >= 60 ? 'dsw-score-mid' : 'dsw-score-low'

const DraftsPage: FC = () => {
  const { data, loading, reload } = useApi<Draft[]>('/drafts')
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<Draft | null>(null)
  const [statusFilter, setStatusFilter] = useState<DraftStatus | 'all'>('all')
  const [showPreview, setShowPreview] = useState(false)
  const [previewPlatform, setPreviewPlatform] = useState<Platform>('xiaohongshu')
  const [wxHtml, setWxHtml] = useState<string | null>(null)

  useEffect(() => {
    if (selected) {
      api<Draft>(`/drafts/${selected}`).then(setDetail).catch(() => setDetail(null))
    } else {
      setDetail(null)
      setShowPreview(false)
    }
  }, [selected])

  useEffect(() => {
    if (showPreview && detail && previewPlatform === 'wechat') {
      api<{ html: string | null }>(`/drafts/${detail.id}/preview?platform=wechat`)
        .then(r => setWxHtml(r.html))
        .catch(() => setWxHtml(null))
    }
  }, [showPreview, previewPlatform, detail?.id])

  const handleDelete = async (id: string) => {
    const ok = await confirm('删除草稿', '确定要删除这篇草稿吗？此操作不可撤销。')
    if (!ok) return
    try {
      await api(`/drafts/${id}`, { method: 'DELETE' })
      if (selected === id) { setSelected(null); setDetail(null) }
      showToast('success', '草稿已删除')
      reload()
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : '删除失败')
    }
  }

  const handleStatusChange = async (id: string, status: DraftStatus) => {
    try {
      await api(`/drafts/${id}`, { method: 'PUT', body: JSON.stringify({ status }) })
      showToast('success', `已更新为"${DRAFT_STATUS_LABELS[status]}"`)
      reload()
      if (selected === id) {
        api<Draft>(`/drafts/${id}`).then(setDetail).catch(() => setDetail(null))
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : '更新失败')
    }
  }

  const handleWechatPublish = async (id: string) => {
    const ok = await confirm('发布到公众号', '将通过文颜(wenyan)排版并推送到微信公众号草稿箱。确定继续？')
    if (!ok) return
    try {
      showToast('info', '正在排版并推送公众号，请稍候…')
      const result = await api<{ success: boolean; message?: string }>(`/drafts/${id}/wechat-publish`, { method: 'POST', body: JSON.stringify({}) })
      if (result.success) {
        showToast('success', '🎉 已推送到公众号草稿箱！')
      } else {
        showToast('error', result.message ?? '发布失败')
      }
      reload()
      if (selected === id) {
        api<Draft>(`/drafts/${id}`).then(setDetail).catch(() => setDetail(null))
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : '发布失败，请确保已安装 wenyan-cli 并配置公众号凭据')
    }
  }

  const handlePublish = async (id: string) => {
    const ok = await confirm('发布草稿', '确定通过 OpenCLI 发布这篇内容到目标平台吗？发布后内容将立即公开。')
    if (!ok) return
    try {
      showToast('info', '正在发布中，请稍候…')
      const result = await api<PublishResult>(`/drafts/${id}/publish`, { method: 'POST', body: JSON.stringify({}) })
      showToast('success', `🎉 已成功发布到 ${PLATFORM_LABELS[result.platform] ?? result.platform}！`)
      reload()
      if (selected === id) {
        api<Draft>(`/drafts/${id}`).then(setDetail).catch(() => setDetail(null))
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : '发布失败，请确保已安装 OpenCLI 并登录对应平台')
    }
  }

  if (loading) return h(SkeletonCards, { count: 3 })

  if (detail) {
    const avgScore = detail.checks.length > 0
      ? Math.round(detail.checks.reduce((s, c) => s + c.score, 0) / detail.checks.length)
      : null

    const previewVersion = detail.versions.find(v => v.platform === previewPlatform)
    const previewTitle = previewVersion?.title ?? detail.title
    const previewBody = previewVersion?.body ?? detail.body
    const previewHashtags = previewVersion?.hashtags ?? []

    return h('div', { className: 'dsw-page-enter' },
      h('div', { className: 'dsw-actions' },
        h('button', { className: 'dsw-btn', onClick: () => setSelected(null) }, '← 返回列表'),
        draftStatusBadge(detail.status),
        h('span', { className: 'dsw-badge dsw-badge-blue' }, PLATFORM_LABELS[detail.platform] ?? detail.platform),
        avgScore !== null && h('span', { className: `dsw-score ${scoreClass(avgScore)}` }, `${avgScore}/100`),
        h('button', {
          className: `dsw-btn ${showPreview ? 'dsw-btn-primary' : ''}`,
          onClick: () => setShowPreview(!showPreview),
          style: { marginLeft: 'auto' },
        }, showPreview ? '📝 编辑视图' : '👁️ 预览'),
      ),

      !showPreview && h('h2', { style: { marginTop: 8, marginBottom: 12 } }, detail.title),

      !showPreview && h('div', { className: 'dsw-draft-body' },
        h('button', { className: 'dsw-copy-btn', onClick: () => copyText(detail.body) }, '📋 复制'),
        detail.body,
      ),

      showPreview && h('div', { className: 'dsw-preview-wrap' },
        h('div', { className: 'dsw-preview-tabs' },
          ...(['wechat', 'xiaohongshu', 'douyin', 'twitter'] as Platform[]).map(p =>
            h('button', {
              key: p, className: 'dsw-preview-tab',
              'data-active': String(previewPlatform === p),
              onClick: () => setPreviewPlatform(p),
            }, PLATFORM_LABELS[p] ?? p),
          ),
        ),
        h('div', { className: 'dsw-preview-frame' },
          previewPlatform === 'wechat' && h('div', { className: 'dsw-phone-frame' },
            h('div', { className: 'dsw-wx-header' },
              h('h1', { className: 'dsw-wx-title' }, previewTitle),
              h('div', { className: 'dsw-wx-meta' },
                h('span', null, '原创'),
                h('span', null, new Date().toLocaleDateString('zh-CN')),
              ),
            ),
            wxHtml
              ? h('div', { className: 'dsw-wx-body-html', dangerouslySetInnerHTML: { __html: wxHtml } })
              : h('div', { className: 'dsw-wx-body' }, previewBody),
            h('div', { className: 'dsw-wx-footer' },
              h('span', null, '❤️ 在看'),
              h('span', null, '💬 留言'),
              h('span', null, '🔄 分享'),
            ),
          ),

          previewPlatform === 'xiaohongshu' && h('div', { className: 'dsw-phone-frame' },
            h('div', { className: 'dsw-xhs-cover' },
              h('div', { className: 'dsw-xhs-cover-gradient' }),
              h('div', { className: 'dsw-xhs-cover-title' }, previewTitle),
            ),
            h('div', { className: 'dsw-xhs-body' },
              h('div', { className: 'dsw-xhs-body-title' }, previewTitle),
              h('div', { className: 'dsw-xhs-body-text' }, previewBody),
            ),
            previewHashtags.length > 0 && h('div', { className: 'dsw-xhs-tags' },
              ...previewHashtags.map(t => h('span', { key: t, className: 'dsw-xhs-tag' }, `#${t} `)),
            ),
            h('div', { className: 'dsw-xhs-bar' },
              h('span', null, '❤️ 点赞'),
              h('span', null, '⭐ 收藏'),
              h('span', null, '💬 评论'),
              h('span', null, '↗️ 分享'),
            ),
          ),

          previewPlatform === 'douyin' && h('div', { className: 'dsw-dy-frame' },
            h('div', { className: 'dsw-dy-actions' },
              h('div', { className: 'dsw-dy-action-btn' }, h('span', { className: 'dsw-dy-action-icon' }, '❤️'), '0'),
              h('div', { className: 'dsw-dy-action-btn' }, h('span', { className: 'dsw-dy-action-icon' }, '💬'), '0'),
              h('div', { className: 'dsw-dy-action-btn' }, h('span', { className: 'dsw-dy-action-icon' }, '⭐'), '0'),
              h('div', { className: 'dsw-dy-action-btn' }, h('span', { className: 'dsw-dy-action-icon' }, '↗️'), '0'),
            ),
            h('div', { className: 'dsw-dy-overlay' },
              h('div', { className: 'dsw-dy-author' }, `@创作者`),
              h('div', { className: 'dsw-dy-desc' }, previewBody.slice(0, 200)),
              previewHashtags.length > 0 && h('div', { className: 'dsw-dy-hashtags' },
                previewHashtags.map(t => `#${t}`).join(' '),
              ),
            ),
          ),

          previewPlatform === 'twitter' && h('div', { className: 'dsw-tw-frame' },
            h('div', { className: 'dsw-tw-header' },
              h('div', { className: 'dsw-tw-avatar' }, '🐦'),
              h('div', { className: 'dsw-tw-user' },
                h('div', { className: 'dsw-tw-name' }, 'Creator'),
                h('div', { className: 'dsw-tw-handle' }, '@creator'),
              ),
            ),
            h('div', { className: 'dsw-tw-body' },
              previewBody.slice(0, 280),
              previewHashtags.length > 0 && h('span', { className: 'dsw-tw-tags' },
                '\n' + previewHashtags.map(t => `#${t}`).join(' '),
              ),
            ),
            h('div', {
              className: `dsw-tw-char-count ${previewBody.length > 280 ? 'dsw-tw-char-over' : 'dsw-tw-char-ok'}`,
            }, `${previewBody.length} / 280`),
            h('div', { className: 'dsw-tw-footer' },
              h('span', null, '💬 回复'),
              h('span', null, '🔄 转推'),
              h('span', null, '❤️ 喜欢'),
              h('span', null, '🔖 书签'),
            ),
          ),
        ),
      ),

      detail.checks.length > 0 && h('div', { style: { marginTop: 24 } },
        h('h3', { style: { marginBottom: 12 } }, '📋 体检报告'),
        ...detail.checks.map((c, i) => {
          const icon = c.score >= 80 ? '✅' : c.score >= 60 ? '⚠️' : '❌'
          return h('div', { key: i, className: 'dsw-card' },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
              h('strong', null, `${icon} ${CHECK_LABELS[c.kind] ?? c.kind}`),
              h('span', { className: `dsw-score ${scoreClass(c.score)}`, style: { fontSize: 20 } }, `${c.score}`),
            ),
            h('div', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary, #666)', marginTop: 6 } }, c.verdict),
            c.issues.length > 0 && h('div', { style: { marginTop: 10 } },
              ...c.issues.map((issue, j) => h('div', {
                key: j,
                style: {
                  padding: '8px 0',
                  borderTop: j > 0 ? '1px solid var(--dsw-alias-border-l1, #eee)' : 'none',
                  fontSize: 13,
                },
              },
                h('div', { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 } },
                  h('span', { className: `dsw-badge ${issue.severity === 'high' ? 'dsw-badge-red' : issue.severity === 'medium' ? 'dsw-badge-yellow' : 'dsw-badge-gray'}` }, issue.severity),
                  h('span', { style: { fontWeight: 500 } }, issue.problem),
                ),
                issue.quote && h('div', { style: { fontStyle: 'italic', color: 'var(--dsw-alias-label-tertiary, #888)', marginBottom: 4 } }, `"${issue.quote}"`),
                h('div', { style: { color: 'var(--dsw-alias-state-business-primary, #0070f3)' } }, `💡 ${issue.suggestion}`),
              )),
            ),
          )
        }),
      ),

      detail.versions.length > 0 && h('div', { style: { marginTop: 24 } },
        h('h3', { style: { marginBottom: 12 } }, '🔄 平台适配版本'),
        ...detail.versions.map((v, i) =>
          h('div', { key: i, className: 'dsw-card' },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } },
              h('span', { className: 'dsw-badge dsw-badge-blue' }, PLATFORM_LABELS[v.platform] ?? v.platform),
              h('strong', null, v.title),
              h('button', { className: 'dsw-btn dsw-btn-sm', onClick: () => copyText(`${v.title}\n\n${v.body}${v.hashtags.length ? '\n\n' + v.hashtags.map(t => `#${t}`).join(' ') : ''}`) }, '📋'),
            ),
            h('div', { style: { whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.7 } }, v.body),
            v.hashtags.length > 0 && h('div', { style: { marginTop: 8 } },
              ...v.hashtags.map(tag => h('span', { key: tag, className: 'dsw-tag' }, `#${tag}`)),
            ),
          ),
        ),
      ),

      detail.publishResults && detail.publishResults.length > 0 && h('div', { style: { marginTop: 24 } },
        h('h3', { style: { marginBottom: 12 } }, '🚀 发布记录'),
        ...detail.publishResults.map((pr, i) =>
          h('div', { key: i, className: 'dsw-card', style: { background: 'var(--dsw-alias-bg-success, rgba(0,200,83,0.06))' } },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
              h('span', null, '✅'),
              h('span', { className: 'dsw-badge dsw-badge-blue' }, PLATFORM_LABELS[pr.platform] ?? pr.platform),
              h('span', { style: { fontSize: 12, color: 'var(--dsw-alias-label-secondary, #888)' } }, new Date(pr.publishedAt).toLocaleString()),
            ),
            pr.url && h('a', {
              href: pr.url,
              target: '_blank',
              rel: 'noopener noreferrer',
              style: { display: 'block', marginTop: 6, fontSize: 13, color: 'var(--dsw-alias-state-business-primary, #0070f3)', textDecoration: 'underline' },
            }, `🔗 ${pr.url}`),
          ),
        ),
      ),

      h('div', { style: { marginTop: 20, padding: '12px 0', borderTop: '1px solid var(--dsw-alias-border-l1, #e5e5e5)' } },
        h('div', { style: { fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--dsw-alias-label-secondary, #888)' } }, '🤖 AI 工具箱'),
        h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
          h('button', { className: 'dsw-btn dsw-btn-sm', onClick: () => sendToDshChat(buildDraftAiPrompt(detail, 'polish')) }, '✨ 润色'),
          h('button', { className: 'dsw-btn dsw-btn-sm', onClick: () => sendToDshChat(buildDraftAiPrompt(detail, 'rewrite')) }, '🔄 重写'),
          h('button', { className: 'dsw-btn dsw-btn-sm', onClick: () => sendToDshChat(buildDraftAiPrompt(detail, 'expand')) }, '📖 扩写'),
          h('button', { className: 'dsw-btn dsw-btn-sm', onClick: () => sendToDshChat(buildDraftAiPrompt(detail, 'shorten')) }, '✂️ 精简'),
        ),
        h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 } },
          h('button', { className: 'dsw-btn dsw-btn-sm', onClick: () => sendToDshChat(`请使用 social_title_gen 工具为草稿 ${detail.id} 生成 10 个爆款标题候选`) }, '🔥 爆款标题'),
          h('button', { className: 'dsw-btn dsw-btn-sm', onClick: () => sendToDshChat(`请使用 social_content_score 工具对草稿 ${detail.id} 进行综合评分`) }, '📊 内容评分'),
          h('button', { className: 'dsw-btn dsw-btn-sm', onClick: () => sendToDshChat(`请使用 social_adapt_all 工具将草稿 ${detail.id} 一键改写为所有平台版本`) }, '🌐 全平台改写'),
          h('button', { className: 'dsw-btn dsw-btn-sm', onClick: () => sendToDshChat(`请使用 social_weekly_plan 工具，结合我的创作者画像生成本周 7 天内容发布计划`) }, '📆 周计划'),
        ),
      ),

      h('div', { className: 'dsw-actions', style: { marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--dsw-alias-border-l1, #e5e5e5)' } },
        detail.status === 'writing' && h('button', { className: 'dsw-btn dsw-btn-primary', onClick: () => handleStatusChange(detail.id, 'reviewing') }, '🔍 送去体检'),
        detail.status === 'reviewing' && h('button', { className: 'dsw-btn dsw-btn-primary', onClick: () => handleStatusChange(detail.id, 'ready') }, '✅ 标记可发布'),
        detail.status === 'ready' && h('button', { className: 'dsw-btn dsw-btn-primary', onClick: () => handlePublish(detail.id) }, '🚀 一键发布'),
        detail.status === 'ready' && h('button', { className: 'dsw-btn dsw-btn-accent', onClick: () => handleWechatPublish(detail.id) }, '✒️ 发公众号'),
        detail.status === 'ready' && h('button', { className: 'dsw-btn', onClick: () => handleStatusChange(detail.id, 'published') }, '📝 仅标记已发布'),
        detail.status === 'published' && !detail.publishResults?.length && h('button', { className: 'dsw-btn dsw-btn-primary', onClick: () => handlePublish(detail.id) }, '🚀 通过 OpenCLI 发布'),
        detail.status === 'published' && h('button', { className: 'dsw-btn dsw-btn-accent', onClick: () => handleWechatPublish(detail.id) }, '✒️ 发公众号'),
        h('button', { className: 'dsw-btn dsw-btn-danger', onClick: () => handleDelete(detail.id) }, '🗑 删除'),
      ),
    )
  }

  const filtered = data && statusFilter !== 'all'
    ? data.filter(d => d.status === statusFilter)
    : data

  return h('div', { className: 'dsw-page-enter' },
    h('div', { className: 'dsw-section-header' },
      h('h2', { className: 'dsw-section-title' }, '✍️ 草稿箱'),
    ),

    data && data.length > 0 && h('div', { className: 'dsw-chips' },
      h('button', { className: 'dsw-chip', 'data-active': String(statusFilter === 'all'), onClick: () => setStatusFilter('all') }, `全部 (${data.length})`),
      ...(['writing', 'reviewing', 'ready', 'published'] as DraftStatus[]).map(s => {
        const count = data.filter(d => d.status === s).length
        return count > 0
          ? h('button', { key: s, className: 'dsw-chip', 'data-active': String(statusFilter === s), onClick: () => setStatusFilter(s) },
            `${DRAFT_STATUS_CONFIG[s].emoji} ${DRAFT_STATUS_LABELS[s]} (${count})`)
          : null
      }),
    ),

    !filtered || filtered.length === 0
      ? h('div', { className: 'dsw-empty' },
        h('div', { className: 'dsw-empty-icon' }, '✍️'),
        h('div', { className: 'dsw-empty-text' }, statusFilter !== 'all' ? '没有匹配的草稿' : '还没有草稿'),
        statusFilter === 'all' && h('div', { className: 'dsw-empty-hint' }, '💡 在对话中说"给我的第一个选题写一篇小红书笔记"'),
      )
      : h('table', { className: 'dsw-table' },
        h('thead', null,
          h('tr', null,
            h('th', null, '标题'),
            h('th', null, '平台'),
            h('th', null, '状态'),
            h('th', null, '体检'),
            h('th', null, '更新'),
            h('th', null, ''),
          ),
        ),
        h('tbody', null,
          ...filtered.slice().reverse().map(d => {
            const avg = d.checks.length > 0 ? Math.round(d.checks.reduce((s, c) => s + c.score, 0) / d.checks.length) : null
            return h('tr', { key: d.id, style: { cursor: 'pointer' }, onClick: () => setSelected(d.id) },
              h('td', null, h('strong', null, d.title)),
              h('td', null, h('span', { className: 'dsw-badge dsw-badge-blue' }, PLATFORM_LABELS[d.platform] ?? d.platform)),
              h('td', null, draftStatusBadge(d.status)),
              h('td', null, avg !== null ? h('span', { className: `dsw-score ${scoreClass(avg)}` }, `${avg}`) : h('span', { style: { color: 'var(--dsw-alias-label-caption, #bbb)' } }, '—')),
              h('td', null, new Date(d.updatedAt).toLocaleDateString('zh-CN')),
              h('td', null,
                h('button', {
                  className: 'dsw-btn dsw-btn-sm dsw-btn-danger',
                  onClick: (e: { stopPropagation: () => void }) => { e.stopPropagation(); handleDelete(d.id) },
                }, '🗑'),
              ),
            )
          }),
        ),
      ),
  )
}

// ── Radar ────────────────────────────────────────────────────────────

const formatFollowers = (n: number) => {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`
  return n.toLocaleString()
}

const RadarPage: FC = () => {
  const { data: accounts, loading: loadingAccounts, reload: reloadAccounts } = useApi<WatchedAccount[]>('/accounts')
  const { data: hot } = useApi<HotList | null>('/hot')
  const { data: scans } = useApi<AccountScan[]>('/scans')

  const handleDeleteAccount = async (id: string) => {
    const ok = await confirm('取消监控', '确定要移除这个监控账号吗？')
    if (!ok) return
    try {
      await api(`/accounts/${id}`, { method: 'DELETE' })
      showToast('success', '已移除')
      reloadAccounts()
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : '删除失败')
    }
  }

  if (loadingAccounts) return h(SkeletonCards, { count: 3 })

  return h('div', { className: 'dsw-page-enter' },
    h('div', { className: 'dsw-section-header' },
      h('h2', { className: 'dsw-section-title' }, '📡 社交雷达'),
    ),

    h('div', { className: 'dsw-card' },
      h('div', { className: 'dsw-card-title' }, '👀 监控账号'),
      !accounts || accounts.length === 0
        ? h('div', { style: { color: 'var(--dsw-alias-label-tertiary, #999)', fontSize: 13, padding: '12px 0' } },
          '还没有监控账号',
          h('div', { className: 'dsw-empty-hint', style: { marginTop: 6 } }, '💡 在对话中说"扫描这个对标账号：[抖音主页链接]"'),
        )
        : h('table', { className: 'dsw-table' },
          h('thead', null,
            h('tr', null,
              h('th', null, '昵称'),
              h('th', null, '备注'),
              h('th', null, '粉丝'),
              h('th', null, '上次扫描'),
              h('th', null, ''),
            ),
          ),
          h('tbody', null,
            ...accounts.map(a =>
              h('tr', { key: a.id },
                h('td', null, h('strong', null, `@${a.nickname}`)),
                h('td', null, a.note || h('span', { style: { color: 'var(--dsw-alias-label-caption, #bbb)' } }, '—')),
                h('td', null, formatFollowers(a.followers)),
                h('td', null, a.lastScanAt ? new Date(a.lastScanAt).toLocaleDateString('zh-CN') : h('span', { className: 'dsw-badge dsw-badge-gray' }, '未扫描')),
                h('td', null, h('button', { className: 'dsw-btn dsw-btn-sm dsw-btn-danger', onClick: () => handleDeleteAccount(a.id) }, '🗑')),
              ),
            ),
          ),
        ),
    ),

    scans && scans.length > 0 && h('div', { className: 'dsw-card', style: { marginTop: 14 } },
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
                h('td', null, h('strong', null, v.desc.slice(0, 50)), v.desc.length > 50 ? '…' : ''),
                h('td', null, v.stats.plays.toLocaleString()),
                h('td', null,
                  h('span', {
                    className: `dsw-score ${v.engagementRate >= 0.05 ? 'dsw-score-high' : v.engagementRate >= 0.02 ? 'dsw-score-mid' : 'dsw-score-low'}`,
                  }, `${(v.engagementRate * 100).toFixed(1)}%`)),
                h('td', null, v.createTime ? new Date(v.createTime).toLocaleDateString('zh-CN') : '—'),
              ),
            ),
          ).slice(0, 20),
        ),
      ),
    ),

    hot && h('div', { className: 'dsw-card', style: { marginTop: 14 } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
        h('div', { className: 'dsw-card-title', style: { marginBottom: 0 } }, '🔥 抖音热搜'),
        h('span', { style: { fontSize: 12, color: 'var(--dsw-alias-label-caption, #aaa)' } },
          new Date(hot.fetchedAt).toLocaleString('zh-CN')),
      ),
      h('table', { className: 'dsw-table' },
        h('thead', null,
          h('tr', null,
            h('th', { style: { width: 40 } }, '#'),
            h('th', null, '话题'),
            h('th', null, '标签'),
            h('th', null, '热度'),
          ),
        ),
        h('tbody', null,
          ...hot.items.slice(0, 30).map((item, i) =>
            h('tr', { key: i },
              h('td', null, h('strong', { style: { color: i < 3 ? 'var(--dsw-alias-state-business-primary, #0070f3)' : undefined } }, item.rank)),
              h('td', null, h('strong', null, item.word)),
              h('td', null, item.label ? h('span', { className: 'dsw-badge dsw-badge-red' }, item.label) : ''),
              h('td', null, item.hot.toLocaleString()),
            ),
          ),
        ),
      ),
    ),
  )
}

// ── Calendar ─────────────────────────────────────────────────────────

const DOW_LABELS = ['日', '一', '二', '三', '四', '五', '六']
const STATUS_COLORS: Record<DraftStatus, string> = {
  writing: 'rgba(59,130,246,.12)',
  reviewing: 'rgba(245,158,11,.12)',
  ready: 'rgba(16,185,129,.12)',
  published: 'rgba(139,92,246,.12)',
}

function calendarDays(year: number, month: number): { date: Date; other: boolean }[] {
  const first = new Date(year, month, 1)
  const startDow = first.getDay()
  const result: { date: Date; other: boolean }[] = []
  for (let i = startDow - 1; i >= 0; i--) result.push({ date: new Date(year, month, -i), other: true })
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) result.push({ date: new Date(year, month, d), other: false })
  const remaining = 7 - (result.length % 7)
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) result.push({ date: new Date(year, month + 1, d), other: true })
  }
  return result
}

function dateKey(d: Date): string { return d.toISOString().slice(0, 10) }

const CalendarPage: FC = () => {
  const { data: drafts } = useApi<Draft[]>('/drafts')
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const todayStr = dateKey(now)
  const days = calendarDays(year, month)

  const draftsByDate = new Map<string, Draft[]>()
  if (drafts) {
    for (const d of drafts) {
      const key = d.scheduledAt ? d.scheduledAt.slice(0, 10)
        : d.status === 'published' ? d.updatedAt.slice(0, 10)
        : d.createdAt.slice(0, 10)
      const arr = draftsByDate.get(key)
      if (arr) arr.push(d)
      else draftsByDate.set(key, [d])
    }
  }

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()) }

  const monthLabel = `${year}年${month + 1}月`

  const publishedThisMonth = drafts?.filter(d => {
    if (d.status !== 'published') return false
    const key = d.updatedAt.slice(0, 7)
    return key === `${year}-${String(month + 1).padStart(2, '0')}`
  }).length ?? 0

  const scheduledThisMonth = drafts?.filter(d => {
    if (!d.scheduledAt || d.status === 'published') return false
    return d.scheduledAt.slice(0, 7) === `${year}-${String(month + 1).padStart(2, '0')}`
  }).length ?? 0

  return h('div', { className: 'dsw-page-enter' },
    h('div', { className: 'dsw-section-header' },
      h('h2', { className: 'dsw-section-title' }, '📅 内容日历'),
    ),

    h('div', { style: { display: 'flex', gap: 12, marginBottom: 16 } },
      h('div', { className: 'dsw-badge dsw-badge-purple' }, `${monthLabel} 已发布 ${publishedThisMonth} 篇`),
      scheduledThisMonth > 0 && h('div', { className: 'dsw-badge dsw-badge-blue' }, `待发布 ${scheduledThisMonth} 篇`),
    ),

    h('div', { className: 'dsw-cal-header' },
      h('div', { className: 'dsw-cal-nav' },
        h('button', { className: 'dsw-cal-nav-btn', onClick: prev }, '‹'),
        h('div', { className: 'dsw-cal-month' }, monthLabel),
        h('button', { className: 'dsw-cal-nav-btn', onClick: next }, '›'),
      ),
      h('button', { className: 'dsw-btn dsw-btn-sm', onClick: goToday }, '今天'),
    ),

    h('div', { className: 'dsw-cal-grid' },
      ...DOW_LABELS.map(d => h('div', { key: d, className: 'dsw-cal-dow' }, d)),
      ...days.map(({ date, other }) => {
        const key = dateKey(date)
        const isToday = key === todayStr
        const events = draftsByDate.get(key) ?? []
        return h('div', {
          key,
          className: 'dsw-cal-cell',
          'data-today': String(isToday),
          'data-other': String(other),
        },
          h('div', { className: 'dsw-cal-day' }, date.getDate()),
          ...events.slice(0, 3).map(d =>
            h('div', {
              key: d.id,
              className: 'dsw-cal-event',
              'data-status': d.status,
              title: `${DRAFT_STATUS_LABELS[d.status]} | ${PLATFORM_LABELS[d.platform]} | ${d.title}`,
            }, `${PLATFORM_LABELS[d.platform]?.charAt(0) ?? '📄'} ${d.title}`),
          ),
          events.length > 3 && h('div', { style: { fontSize: 10, color: 'var(--dsw-alias-label-tertiary, #999)', textAlign: 'center' } }, `+${events.length - 3} 更多`),
        )
      }),
    ),

    h('div', { className: 'dsw-cal-legend' },
      ...(['writing', 'reviewing', 'ready', 'published'] as DraftStatus[]).map(s =>
        h('div', { key: s, className: 'dsw-cal-legend-item' },
          h('div', { className: 'dsw-cal-legend-dot', style: { background: STATUS_COLORS[s] } }),
          DRAFT_STATUS_LABELS[s],
        ),
      ),
    ),
  )
}

// ── Settings ─────────────────────────────────────────────────────────

const PROFILE_FIELDS = [
  { key: 'name' as const, label: '名称/IP', icon: '👤', placeholder: '你的品牌名或 IP 名' },
  { key: 'niche' as const, label: '赛道/领域', icon: '🎯', placeholder: '如：个人成长、AI 科技、美妆' },
  { key: 'audience' as const, label: '目标受众', icon: '👥', placeholder: '如：25-35 岁职场女性' },
  { key: 'offer' as const, label: '变现方向', icon: '💰', placeholder: '如：课程、咨询、带货' },
]

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
    try {
      await api('/settings/profile', { method: 'PUT', body: JSON.stringify(profile) })
      showToast('success', '创作者画像已保存')
      reload()
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTikKey = async () => {
    setSaving(true)
    try {
      await api('/settings/tikhub-key', { method: 'PUT', body: JSON.stringify({ key: tikKey }) })
      setTikKey('')
      showToast('success', 'TikHub API Key 已更新')
      reload()
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : '更新失败')
    } finally {
      setSaving(false)
    }
  }

  const [picking, setPicking] = useState(false)

  const handlePickDir = async () => {
    setPicking(true)
    try {
      const result = await api<{ picked: string | null; dataDir: string }>('/workspace/pick', { method: 'POST', body: JSON.stringify({}) })
      if (result.picked) {
        showToast('success', `工作空间已切换到：${result.dataDir}`)
        reload()
      } else {
        showToast('info', '已取消选择')
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : '选择目录失败')
    } finally {
      setPicking(false)
    }
  }

  if (loading || !data || !profile) return h(SkeletonCards, { count: 3 })

  return h('div', { className: 'dsw-page-enter' },
    h('div', { className: 'dsw-section-header' },
      h('h2', { className: 'dsw-section-title' }, '⚙️ 设置'),
    ),

    h('div', { className: 'dsw-card' },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
        h('div', { className: 'dsw-card-title', style: { marginBottom: 0 } }, '📂 工作空间目录'),
        h('button', { className: 'dsw-btn dsw-btn-primary', onClick: handlePickDir, disabled: picking, style: { flexShrink: 0 } },
          picking ? '⏳ 选择中…' : '📁 更换目录'),
      ),
      h('div', { className: 'dsw-card-subtitle' }, '所有素材、选题、草稿数据存储在此目录'),
      h('div', {
        style: {
          padding: '10px 14px', borderRadius: 8,
          background: 'var(--dsw-alias-bg-l1, #f7f7f7)',
          fontFamily: 'monospace', fontSize: 13,
          wordBreak: 'break-all',
          color: 'var(--dsw-alias-label-primary, #333)',
        },
      }, data.dataDir),
    ),

    h('div', { className: 'dsw-card', style: { marginTop: 16 } },
      h('div', { className: 'dsw-card-title' }, '👤 创作者画像'),
      h('div', { className: 'dsw-card-subtitle' }, '设定你的创作方向，AI 会据此生成更贴合你的内容'),

      h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 } },
        ...PROFILE_FIELDS.map(f =>
          h('div', { key: f.key, className: 'dsw-form-row' },
            h('label', { className: 'dsw-form-label' }, `${f.icon} ${f.label}`),
            h('input', {
              className: 'dsw-input',
              value: profile[f.key],
              placeholder: f.placeholder,
              onChange: (e: { target: { value: string } }) => setProfile({ ...profile, [f.key]: e.target.value }),
            }),
          ),
        ),
      ),

      h('div', { className: 'dsw-form-row' },
        h('label', { className: 'dsw-form-label' }, '🖊️ 文风指南'),
        h('textarea', {
          className: 'dsw-textarea', value: profile.voiceGuide, rows: 3,
          onChange: (e: { target: { value: string } }) => setProfile({ ...profile, voiceGuide: e.target.value }),
          placeholder: '描述你的写作风格，例如"轻松幽默、多用口语化表达、爱用问句和感叹号"',
        }),
      ),

      h('div', { className: 'dsw-form-row' },
        h('label', { className: 'dsw-form-label' }, '🚫 禁忌内容'),
        h('textarea', {
          className: 'dsw-textarea', value: profile.forbidden, rows: 2,
          onChange: (e: { target: { value: string } }) => setProfile({ ...profile, forbidden: e.target.value }),
          placeholder: '不要出现的内容或词汇',
        }),
      ),

      h('div', { style: { display: 'flex', justifyContent: 'flex-end' } },
        h('button', { className: 'dsw-btn dsw-btn-primary', onClick: handleSaveProfile, disabled: saving }, saving ? '⏳ 保存中…' : '💾 保存画像'),
      ),
    ),

    h('div', { className: 'dsw-card', style: { marginTop: 16 } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
        h('div', { className: 'dsw-card-title', style: { marginBottom: 0 } }, '🔑 TikHub API Key'),
        data.tikhubConfigured
          ? h('span', { className: 'dsw-badge dsw-badge-green' }, '✅ 已配置')
          : h('span', { className: 'dsw-badge dsw-badge-red' }, '⚠️ 未配置'),
      ),
      h('div', { className: 'dsw-card-subtitle' }, '用于社交雷达功能（视频分析、账号扫描、热搜）'),
      h('div', { style: { display: 'flex', gap: 8 } },
        h('input', {
          className: 'dsw-input', type: 'password',
          value: tikKey, style: { flex: 1 },
          onChange: (e: { target: { value: string } }) => setTikKey(e.target.value),
          placeholder: '输入 TikHub API Key…',
        }),
        h('button', { className: 'dsw-btn dsw-btn-primary', onClick: handleSaveTikKey, disabled: saving || !tikKey, style: { flexShrink: 0 } }, '更新'),
      ),
    ),

    h('div', { className: 'dsw-card', style: { marginTop: 16 } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
        h('div', { className: 'dsw-card-title', style: { marginBottom: 0 } }, '🤖 OpenCLI 自动发布'),
        data.opencliReady
          ? h('span', { className: 'dsw-badge dsw-badge-green' }, '✅ 已就绪')
          : h('span', { className: 'dsw-badge dsw-badge-red' }, '⚠️ 未安装'),
      ),
      h('div', { className: 'dsw-card-subtitle' }, '通过 OpenCLI 自动化发布内容到小红书、X/Twitter 等平台'),
      !data.opencliReady && h('div', { style: { padding: '10px 14px', borderRadius: 8, background: 'var(--dsw-alias-bg-warning, rgba(255,152,0,0.08))', fontSize: 13, lineHeight: 1.7 } },
        h('div', null, '💡 安装步骤：'),
        h('div', { style: { fontFamily: 'monospace', marginTop: 4 } }, 'npm install -g @jackwener/opencli'),
        h('div', { style: { marginTop: 4, color: 'var(--dsw-alias-label-tertiary, #888)' } }, '安装后需通过 Chrome 扩展登录对应平台'),
      ),
    ),

    h('div', { className: 'dsw-card', style: { marginTop: 16 } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
        h('div', { className: 'dsw-card-title', style: { marginBottom: 0 } }, '✒️ 文颜（公众号排版 & 发布）'),
        data.wenyanReady
          ? h('span', { className: 'dsw-badge dsw-badge-green' }, '✅ 已安装')
          : h('span', { className: 'dsw-badge dsw-badge-red' }, '⚠️ 未安装'),
      ),
      h('div', { className: 'dsw-card-subtitle' }, 'Markdown 一键排版并推送到公众号草稿箱'),
      !data.wenyanReady && h('div', { style: { padding: '10px 14px', borderRadius: 8, background: 'var(--dsw-alias-bg-warning, rgba(255,152,0,0.08))', fontSize: 13, lineHeight: 1.7 } },
        h('div', null, '💡 安装步骤：'),
        h('div', { style: { fontFamily: 'monospace', marginTop: 4 } }, 'npm install -g @wenyan-md/cli'),
      ),
      data.wenyanReady && h('div', { style: { marginTop: 8 } },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
          h('span', null, '公众号凭据：'),
          data.wechatConfigured
            ? h('span', { className: 'dsw-badge dsw-badge-green' }, '✅ WECHAT_APP_ID 已配置')
            : h('span', { className: 'dsw-badge dsw-badge-red' }, '⚠️ 需配置 WECHAT_APP_ID 和 WECHAT_APP_SECRET'),
        ),
        !data.wechatConfigured && h('div', { style: { padding: '8px 14px', borderRadius: 8, background: 'var(--dsw-alias-bg-warning, rgba(255,152,0,0.08))', fontSize: 12, lineHeight: 1.7, marginTop: 6 } },
          h('div', null, '在 .env 或系统环境变量中设置：'),
          h('div', { style: { fontFamily: 'monospace' } }, 'WECHAT_APP_ID=你的AppID'),
          h('div', { style: { fontFamily: 'monospace' } }, 'WECHAT_APP_SECRET=你的AppSecret'),
        ),
      ),
    ),

    h('div', { className: 'dsw-card', style: { marginTop: 16 } },
      h('div', { className: 'dsw-card-title' }, '🧠 写作模型'),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
        h('span', { className: 'dsw-badge dsw-badge-blue' },
          data.model ? `${data.model.provider}` : 'default'),
        h('span', { style: { fontSize: 14, color: 'var(--dsw-alias-label-secondary, #666)' } },
          data.model ? data.model.model : '使用 Agent 默认模型'),
      ),
      h('div', { className: 'dsw-card-subtitle', style: { marginTop: 8, marginBottom: 0 } },
        '模型由 DSH Agent 设置页面统一管理'),
    ),
  )
}

// ─── Workbench Overlay ───────────────────────────────────────────────

type TabId = 'dashboard' | 'materials' | 'topics' | 'drafts' | 'calendar' | 'radar' | 'settings'

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
  { id: 'calendar', icon: '📅', label: '日历' },
  { id: 'radar', icon: '📡', label: '雷达' },
  { id: 'settings', icon: '⚙️', label: '设置' },
]

const TAB_COMPONENTS: Record<TabId, FC> = {
  dashboard: DashboardPage,
  materials: MaterialsPage,
  topics: TopicsPage,
  drafts: DraftsPage,
  calendar: CalendarPage,
  radar: RadarPage,
  settings: SettingsPage,
}

const Workbench: FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tab, setTab] = useState<TabId>('dashboard')
  const [pageKey, setPageKey] = useState(0)
  const Page = TAB_COMPONENTS[tab]

  const switchTab = useCallback((id: string) => {
    if (id in TAB_COMPONENTS) {
      setTab(id as TabId)
      setPageKey(k => k + 1)
    }
  }, [])

  useEffect(() => {
    _switchTab = switchTab
    return () => { if (_switchTab === switchTab) _switchTab = null }
  }, [switchTab])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return h('div', { className: 'dsh-social-overlay' },
    h(ToastContainer, null),
    h(ConfirmDialog, null),
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
            onClick: () => switchTab(item.id),
          },
            h('span', { className: 'dsw-nav-icon' }, item.icon),
            h('span', null, item.label),
          ),
        ),
      ),
      h('main', { className: 'dsw-content', key: pageKey },
        h(Page, null),
      ),
    ),
  )
}

// ─── Sidebar Footer Action Button ────────────────────────────────────

const SidebarButton: FC<{ wide?: boolean }> = ({ wide }) => {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    _closeOverlay = close
    return () => { if (_closeOverlay === close) _closeOverlay = null }
  }, [close])

  return h('div', null,
    h('button', {
      className: 'dsw-sidebar-btn',
      onClick: () => setOpen(true),
      title: '自媒体工作台',
    },
      h('span', { className: 'dsw-sidebar-btn-icon' }, '📱'),
      wide && h('span', null, '自媒体工作台'),
    ),
    open && h(Workbench, { onClose: close }),
  )
}

// ─── Plugin entry ────────────────────────────────────────────────────

export function apply(ctx: Context) {
  injectStyles()

  // The slot type declarations in the bundled DSH packages are mingled,
  // so third-party plugins must bypass the generic constraints at the call
  // site. The runtime contract is:
  //  - ctx.slots.inject(name, callback) waits for the slot to be declared
  //    then runs callback inside a Cordis effect.
  //  - ctx.slots.register(options, component) adds our component into
  //    the declared slot (list kind, scope root).
  // 'sidebar.footer.action' is a child slot of the sidebar root, so it
  // only exists after the sidebar has initialised — inject handles the wait.
  const slots = ctx.slots as unknown as {
    inject(key: string, callback: () => (() => void) | void): () => void
    register(options: { name: string; id: string }, component: FC<{ wide?: boolean }>): () => void
  }

  slots.inject('sidebar.footer.action', () => {
    return slots.register(
      { name: 'sidebar.footer.action', id: 'dsh-social' },
      SidebarButton,
    )
  })
}
