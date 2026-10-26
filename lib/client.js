window.__ModuleLoader__.load({
  id: "dsh-social",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.ts
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(client_exports);
var import_dsh_client_ui_slots = require("@deepseek-ai/dsh-client-ui-slots");
var import_react = require("react");

// src/shared/types.ts
var PLATFORM_LABELS = {
  xiaohongshu: "\u5C0F\u7EA2\u4E66",
  douyin: "\u6296\u97F3",
  wechat: "\u516C\u4F17\u53F7",
  bilibili: "B \u7AD9",
  shipinhao: "\u89C6\u9891\u53F7",
  twitter: "X"
};
var MATERIAL_SOURCE_LABELS = {
  note: "\u968F\u624B\u8BB0",
  transcript: "\u53E3\u8FF0/\u9010\u5B57\u7A3F",
  link: "\u7F51\u9875\u6458\u5F55",
  competitor: "\u5BF9\u6807\u5185\u5BB9",
  comment: "\u8BC4\u8BBA\u533A"
};
var DRAFT_STATUS_LABELS = {
  writing: "\u5199\u4F5C\u4E2D",
  reviewing: "\u5F85\u4F53\u68C0",
  ready: "\u53EF\u53D1\u5E03",
  published: "\u5DF2\u53D1\u5E03"
};
var CHECK_LABELS = {
  resonance: "\u5171\u9E23\u68C0\u67E5",
  ai_flavor: "AI \u5473\u68C0\u6D4B",
  risk: "\u8FDD\u89C4\u98CE\u9669",
  script_flow: "\u53E3\u64AD\u6D41\u7545\u5EA6",
  title_cover_intro: "\u6807\u9898\u5C01\u9762\u5F00\u5934",
  spread: "\u4F20\u64AD\u5206\u6790"
};

// src/client.ts
var name = "dsh-social-client";
var inject = ["slots"];
var CSS_TAG_ID = "dsh-social-workbench";
var CSS = (
  /* css */
  `
/* \u2550\u2550\u2550 Keyframes \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550\u2550 Overlay \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550\u2550 Top bar \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
.dsw-topbar {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px;
  padding-top: calc(env(titlebar-area-height, 36px) + 6px);
  border-bottom: 1px solid var(--dsw-alias-border-l1, #e5e5e5);
  flex-shrink: 0;
  backdrop-filter: blur(8px);
  background: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 85%, transparent);
}
.dsw-topbar-title {
  font-size: 16px; font-weight: 600; margin-right: auto;
  letter-spacing: .02em;
}
/* topbar close button removed \u2014 Electron title bar intercepts clicks */

/* \u2550\u2550\u2550 Layout \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550\u2550 Page transition \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
.dsw-page-enter { animation: dsw-slide-in .25s ease-out; }

/* \u2550\u2550\u2550 Cards \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550\u2550 Stats \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550\u2550 Badges \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550\u2550 Tables \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550\u2550 Buttons \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550\u2550 Inputs \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550\u2550 Empty state \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550\u2550 Skeleton \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
.dsw-skeleton {
  background: linear-gradient(90deg,
    color-mix(in srgb, var(--dsw-alias-label-primary, #000) 5%, var(--dsw-alias-bg-base, #fff)) 25%,
    color-mix(in srgb, var(--dsw-alias-label-primary, #000) 10%, var(--dsw-alias-bg-base, #fff)) 37%,
    color-mix(in srgb, var(--dsw-alias-label-primary, #000) 5%, var(--dsw-alias-bg-base, #fff)) 63%);
  background-size: 800px 100%;
  animation: dsw-shimmer 1.4s ease-in-out infinite;
  border-radius: 8px;
}

/* \u2550\u2550\u2550 Toast \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550\u2550 Confirm dialog \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550\u2550 Pipeline \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550\u2550 Section header \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
.dsw-section-header {
  display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
}
.dsw-section-title { font-size: 18px; font-weight: 700; flex: 1; }

/* \u2550\u2550\u2550 Filter chips \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550\u2550 Draft body \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550\u2550 Score ring \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
.dsw-score { display: inline-flex; align-items: center; gap: 4px; font-weight: 700; }
.dsw-score-high { color: #2e7d32; }
.dsw-score-mid  { color: #f57f17; }
.dsw-score-low  { color: #c62828; }

/* \u2550\u2550\u2550 Sidebar button \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550\u2550 Responsive \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
@media (max-width: 640px) {
  .dsw-nav { width: 60px; padding: 8px 4px; }
  .dsw-nav-item { padding: 10px 8px; justify-content: center; }
  .dsw-nav-item span:last-child { display: none; }
  .dsw-content { padding: 16px; }
}

/* \u2550\u2550\u2550 Platform Preview \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550\u2550 Calendar \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550\u2550 Pipeline Visualization \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550\u2550 Quick Actions \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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
);
function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector(`style[data-plugin-css="${CSS_TAG_ID}"]`)) return;
  const tag = document.createElement("style");
  tag.dataset.plugin = "dsh-social";
  tag.dataset.pluginCss = CSS_TAG_ID;
  tag.textContent = CSS;
  document.head.appendChild(tag);
}
var API_BASE = "/social/api";
async function api(path, options) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return await res.json();
}
function useApi(path, deps = []) {
  const [data, setData] = (0, import_react.useState)(null);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [error, setError] = (0, import_react.useState)(null);
  const [tick, setTick] = (0, import_react.useState)(0);
  const reload = (0, import_react.useCallback)(() => setTick((t) => t + 1), []);
  (0, import_react.useEffect)(() => {
    let cancelled = false;
    setLoading(true);
    api(path).then((d) => {
      if (!cancelled) {
        setData(d);
        setError(null);
      }
    }).catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : String(e));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [path, tick, ...deps]);
  return { data, loading, error, reload };
}
var h = import_react.createElement;
var _toasts = [];
var _toastId = 0;
var _setToasts = null;
function showToast(type, message) {
  const id = ++_toastId;
  _toasts = [..._toasts, { id, type, message }];
  _setToasts?.(_toasts);
  setTimeout(() => {
    _toasts = _toasts.map((t) => t.id === id ? { ...t, exiting: true } : t);
    _setToasts?.(_toasts);
    setTimeout(() => {
      _toasts = _toasts.filter((t) => t.id !== id);
      _setToasts?.(_toasts);
    }, 200);
  }, 2800);
}
var ToastContainer = () => {
  const [toasts, setToasts] = (0, import_react.useState)([]);
  (0, import_react.useEffect)(() => {
    _setToasts = setToasts;
    return () => {
      _setToasts = null;
    };
  }, []);
  if (toasts.length === 0) return null;
  return h(
    "div",
    { className: "dsw-toast-container" },
    ...toasts.map(
      (t) => h(
        "div",
        { key: t.id, className: `dsw-toast dsw-toast-${t.type}${t.exiting ? " dsw-toast-exit" : ""}` },
        h("span", null, t.type === "success" ? "\u2705" : t.type === "error" ? "\u274C" : "\u2139\uFE0F"),
        h("span", null, t.message)
      )
    )
  );
};
var _confirmResolve = null;
var _setConfirmState = null;
function confirm(title, message) {
  return new Promise((resolve) => {
    _confirmResolve = resolve;
    _setConfirmState?.({ open: true, title, message });
  });
}
var ConfirmDialog = () => {
  const [state, setState] = (0, import_react.useState)({ open: false, title: "", message: "" });
  (0, import_react.useEffect)(() => {
    _setConfirmState = setState;
    return () => {
      _setConfirmState = null;
    };
  }, []);
  const handle = (v) => {
    _confirmResolve?.(v);
    _confirmResolve = null;
    setState((s) => ({ ...s, open: false }));
  };
  if (!state.open) return null;
  return h(
    "div",
    { className: "dsw-confirm-backdrop", onClick: () => handle(false) },
    h(
      "div",
      { className: "dsw-confirm-box", onClick: (e) => e.stopPropagation() },
      h("div", { className: "dsw-confirm-title" }, state.title),
      h("div", { className: "dsw-confirm-msg" }, state.message),
      h(
        "div",
        { className: "dsw-confirm-actions" },
        h("button", { className: "dsw-btn", onClick: () => handle(false) }, "\u53D6\u6D88"),
        h("button", { className: "dsw-btn dsw-btn-danger", onClick: () => handle(true) }, "\u786E\u8BA4\u5220\u9664")
      )
    )
  );
};
var Skeleton = ({ width = "100%", height = "16px", style }) => h("div", { className: "dsw-skeleton", style: { width, height, ...style } });
var SkeletonCards = ({ count = 3 }) => h("div", null, ...Array.from(
  { length: count },
  (_, i) => h(
    "div",
    { key: i, className: "dsw-card", style: { marginBottom: 12 } },
    h(Skeleton, { width: "40%", height: "18px", style: { marginBottom: 10 } }),
    h(Skeleton, { width: "100%", height: "14px", style: { marginBottom: 6 } }),
    h(Skeleton, { width: "60%", height: "14px" })
  )
));
var SkeletonStats = () => h("div", { className: "dsw-stat-grid" }, ...Array.from(
  { length: 6 },
  (_, i) => h(
    "div",
    { key: i, className: "dsw-stat-card" },
    h(Skeleton, { width: "32px", height: "32px", style: { margin: "0 auto 8px", borderRadius: "50%" } }),
    h(Skeleton, { width: "60px", height: "24px", style: { margin: "0 auto 6px" } }),
    h(Skeleton, { width: "48px", height: "12px", style: { margin: "0 auto" } })
  )
));
function copyText(text) {
  navigator.clipboard.writeText(text).then(
    () => showToast("success", "\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F"),
    () => showToast("error", "\u590D\u5236\u5931\u8D25")
  );
}
var _closeOverlay = null;
var _switchTab = null;
function navigateTo(tab) {
  _switchTab?.(tab);
}
function sendToDshChat(prompt) {
  navigator.clipboard.writeText(prompt).then(() => {
    _closeOverlay?.();
    setTimeout(() => {
      const targets = document.querySelectorAll(
        'textarea, [contenteditable="true"], [role="textbox"]'
      );
      let input = null;
      for (const el of targets) {
        if (el.closest(".dsh-social-overlay")) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width > 100 && rect.height > 20) {
          input = el;
          break;
        }
      }
      if (input) {
        input.focus();
        if (input instanceof HTMLTextAreaElement) {
          input.value = prompt;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.setSelectionRange(prompt.length, prompt.length);
        } else if (input.getAttribute("contenteditable") === "true") {
          input.textContent = prompt;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          const range = document.createRange();
          range.selectNodeContents(input);
          range.collapse(false);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
        showToast("success", "\u2705 AI \u63D0\u793A\u5DF2\u586B\u5165\u5BF9\u8BDD\u6846\uFF0C\u8BF7\u68C0\u67E5\u540E\u53D1\u9001");
      } else {
        showToast("info", "\u2705 AI \u63D0\u793A\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F\uFF0C\u8BF7\u7C98\u8D34\u5230 DSH \u5BF9\u8BDD\u53D1\u9001 (\u2318V)");
      }
    }, 400);
  }).catch(() => {
    showToast("error", "\u590D\u5236\u5931\u8D25");
  });
}
function buildDraftAiPrompt(draft, task) {
  const taskLabels = {
    polish: "\u6DA6\u8272\u4F18\u5316",
    rewrite: "\u91CD\u5199\u6539\u7A3F",
    expand: "\u6269\u5199\u4E30\u5BCC",
    shorten: "\u7CBE\u7B80\u7F29\u5199"
  };
  const platform = PLATFORM_LABELS[draft.platform] ?? draft.platform;
  return `\u8BF7\u5E2E\u6211\u5BF9\u4EE5\u4E0B\u81EA\u5A92\u4F53\u8349\u7A3F\u8FDB\u884C\u3010${taskLabels[task]}\u3011\u3002

\u76EE\u6807\u5E73\u53F0\uFF1A${platform}
\u6807\u9898\uFF1A${draft.title}

--- \u6B63\u6587 ---
${draft.body}
${draft.versions?.length ? `
--- \u5DF2\u6709\u53D8\u4F53 ---
${draft.versions.map((v, i) => `\u53D8\u4F53${i + 1} (${PLATFORM_LABELS[v.platform] ?? v.platform}): ${v.title}`).join("\n")}` : ""}
---

\u8981\u6C42\uFF1A
1. \u4FDD\u6301 ${platform} \u5E73\u53F0\u7684\u98CE\u683C\u548C\u8C03\u6027
2. ${task === "polish" ? "\u4FEE\u6B63\u8BED\u6CD5\uFF0C\u63D0\u5347\u8868\u8FBE\u529B\uFF0C\u4FDD\u6301\u539F\u610F" : task === "rewrite" ? "\u7528\u5168\u65B0\u89D2\u5EA6\u91CD\u5199\uFF0C\u4FDD\u7559\u6838\u5FC3\u4FE1\u606F" : task === "expand" ? "\u8865\u5145\u7EC6\u8282\u3001\u6848\u4F8B\u6216\u6570\u636E\uFF0C\u4E30\u5BCC\u5185\u5BB9" : "\u5220\u51CF\u5197\u4F59\uFF0C\u4FDD\u7559\u7CBE\u534E\uFF0C\u63A7\u5236\u5B57\u6570"}
3. \u8F93\u51FA\u5B8C\u6574\u4F18\u5316\u540E\u7684\u5185\u5BB9`;
}
var STAT_ICONS = [
  { icon: "\u{1F4DD}", label: "\u7D20\u6750" },
  { icon: "\u{1F4A1}", label: "\u5F85\u5904\u7406\u9009\u9898" },
  { icon: "\u270D\uFE0F", label: "\u8FDB\u884C\u4E2D\u8349\u7A3F" },
  { icon: "\u{1F680}", label: "\u5F85\u53D1\u5E03" },
  { icon: "\u{1F440}", label: "\u76D1\u63A7\u8D26\u53F7" },
  { icon: "\u{1F4E1}", label: "TikHub" },
  { icon: "\u{1F916}", label: "OpenCLI" },
  { icon: "\u2712\uFE0F", label: "\u6587\u989C\u6392\u7248" }
];
function makeQuickActions() {
  return [
    { icon: "\u{1F4DD}", label: "\u6536\u96C6\u7D20\u6750", action: () => navigateTo("materials") },
    { icon: "\u{1F4A1}", label: "\u63D0\u70BC\u9009\u9898", action: () => sendToDshChat("\u8BF7\u6839\u636E\u6211\u7684\u7D20\u6750\u5E93\u5E2E\u6211\u63D0\u70BC\u51E0\u4E2A\u9009\u9898\u3002\u8BF7\u4F7F\u7528 social_topic_extract \u5DE5\u5177\u3002") },
    { icon: "\u270D\uFE0F", label: "AI \u8D77\u7A3F", action: () => sendToDshChat("\u8BF7\u5E2E\u6211\u5199\u4E00\u7BC7\u8349\u7A3F\u3002\u8BF7\u4F7F\u7528 social_draft_write \u5DE5\u5177\u3002") },
    { icon: "\u{1F50D}", label: "\u53D1\u5E03\u4F53\u68C0", action: () => navigateTo("drafts") },
    { icon: "\u{1F4C5}", label: "\u5185\u5BB9\u65E5\u5386", action: () => navigateTo("calendar") },
    { icon: "\u{1F4E1}", label: "\u70ED\u70B9\u96F7\u8FBE", action: () => navigateTo("radar") },
    { icon: "\u{1F4CA}", label: "\u5185\u5BB9\u8BC4\u5206", action: () => sendToDshChat("\u8BF7\u5BF9\u6211\u6700\u65B0\u7684\u8349\u7A3F\u8FDB\u884C\u5185\u5BB9\u8BC4\u5206\u3002\u8BF7\u4F7F\u7528 social_content_score \u5DE5\u5177\u3002") },
    { icon: "\u{1F4C6}", label: "\u5468\u8BA1\u5212", action: () => sendToDshChat("\u8BF7\u4F7F\u7528 social_weekly_plan \u5DE5\u5177\uFF0C\u7ED3\u5408\u6211\u7684\u521B\u4F5C\u8005\u753B\u50CF\u751F\u6210\u672C\u5468 7 \u5929\u5185\u5BB9\u53D1\u5E03\u8BA1\u5212\u3002") }
  ];
}
var DashboardPage = () => {
  const { data, loading } = useApi("/dashboard");
  if (loading || !data) return h(SkeletonStats, null);
  const statValues = [
    data.materials,
    data.topicsNew,
    data.drafts.writing + data.drafts.reviewing,
    data.drafts.ready,
    data.watched,
    data.tikhubReady ? "\u2705" : "\u274C",
    data.opencliReady ? "\u2705" : "\u274C",
    data.wenyanReady ? "\u2705" : "\u274C"
  ];
  return h(
    "div",
    { className: "dsw-page-enter" },
    h(
      "div",
      { className: "dsw-section-header" },
      h("h2", { className: "dsw-section-title" }, "\u{1F4CA} \u5DE5\u4F5C\u53F0\u6982\u89C8")
    ),
    h(
      "div",
      { className: "dsw-stat-grid", style: { marginTop: 8 } },
      ...STAT_ICONS.map(
        (s, i) => h(
          "div",
          { key: i, className: "dsw-stat-card", style: { animationDelay: `${i * 60}ms` } },
          h("div", { className: "dsw-stat-icon" }, s.icon),
          h("div", { className: "dsw-stat-num", style: { animationDelay: `${i * 60 + 100}ms` } }, statValues[i]),
          h("div", { className: "dsw-stat-label" }, s.label)
        )
      )
    ),
    h(
      "div",
      { className: "dsw-card", style: { marginTop: 16 } },
      h("div", { className: "dsw-card-title" }, "\u{1F504} \u5185\u5BB9\u6D41\u6C34\u7EBF"),
      h(
        "div",
        { className: "dsw-pipeline" },
        ...[
          { label: "\u7D20\u6750", count: data.materials, color: "#94a3b8" },
          { label: "\u9009\u9898", count: data.topicsNew, color: "#60a5fa" },
          { label: "\u5199\u4F5C\u4E2D", count: data.drafts.writing, color: "#3b82f6" },
          { label: "\u5BA1\u6838\u4E2D", count: data.drafts.reviewing, color: "#f59e0b" },
          { label: "\u5F85\u53D1\u5E03", count: data.drafts.ready, color: "#10b981" },
          { label: "\u5DF2\u53D1\u5E03", count: data.drafts.published, color: "#8b5cf6" }
        ].flatMap((stage, i, arr) => {
          const items = [
            h(
              "div",
              { key: `s${i}`, className: "dsw-pipeline-stage", style: { background: `${stage.color}10` } },
              h("div", { className: "dsw-pipeline-count", style: { color: stage.color } }, stage.count),
              h("div", { className: "dsw-pipeline-label" }, stage.label)
            )
          ];
          if (i < arr.length - 1) items.push(h("div", { key: `a${i}`, className: "dsw-pipeline-arrow" }));
          return items;
        })
      )
    ),
    h(
      "div",
      { className: "dsw-card", style: { marginTop: 16 } },
      h("div", { className: "dsw-card-title" }, "\u26A1 \u5FEB\u6377\u64CD\u4F5C"),
      h("div", { className: "dsw-card-subtitle" }, "\u70B9\u51FB\u8DF3\u8F6C\u5230\u5BF9\u5E94\u529F\u80FD\u6216\u53D1\u9001 AI \u6307\u4EE4"),
      h(
        "div",
        { className: "dsw-quick-actions" },
        ...makeQuickActions().map(
          (qa, i) => h(
            "div",
            { key: i, className: "dsw-quick-action", onClick: qa.action },
            h("div", { className: "dsw-quick-action-icon" }, qa.icon),
            h("div", { className: "dsw-quick-action-label" }, qa.label)
          )
        )
      )
    ),
    data.outliers.length > 0 && h(
      "div",
      { className: "dsw-card", style: { marginTop: 16 } },
      h("div", { className: "dsw-card-title" }, "\u{1F31F} \u6700\u8FD1\u7206\u6B3E"),
      h(
        "table",
        { className: "dsw-table" },
        h(
          "thead",
          null,
          h(
            "tr",
            null,
            h("th", null, "\u8D26\u53F7"),
            h("th", null, "\u5185\u5BB9"),
            h("th", null, "\u64AD\u653E"),
            h("th", null, "\u4E92\u52A8\u7387")
          )
        ),
        h(
          "tbody",
          null,
          ...data.outliers.map(
            (o, i) => h(
              "tr",
              { key: i },
              h("td", null, o.account),
              h("td", null, o.video.desc.slice(0, 40)),
              h("td", null, o.video.stats.plays.toLocaleString()),
              h("td", null, `${(o.video.engagementRate * 100).toFixed(1)}%`)
            )
          )
        )
      )
    ),
    data.upcoming.length > 0 && h(
      "div",
      { className: "dsw-card", style: { marginTop: 12 } },
      h("div", { className: "dsw-card-title" }, "\u{1F4C5} \u5373\u5C06\u53D1\u5E03"),
      ...data.upcoming.map(
        (u, i) => h(
          "div",
          { key: i, style: { padding: "6px 0", fontSize: 13, display: "flex", alignItems: "center", gap: 8 } },
          h("span", { className: "dsw-badge dsw-badge-blue" }, PLATFORM_LABELS[u.platform] ?? u.platform),
          h("strong", null, u.title),
          h(
            "span",
            { style: { color: "var(--dsw-alias-label-tertiary, #999)" } },
            new Date(u.scheduledAt).toLocaleDateString("zh-CN")
          )
        )
      )
    )
  );
};
var MaterialsPage = () => {
  const { data, loading, reload } = useApi("/materials");
  const [adding, setAdding] = (0, import_react.useState)(false);
  const [search, setSearch] = (0, import_react.useState)("");
  const [expanded, setExpanded] = (0, import_react.useState)(null);
  const [form, setForm] = (0, import_react.useState)({ source: "note", title: "", content: "", url: "", tags: "" });
  const handleAdd = async () => {
    try {
      await api("/materials", {
        method: "POST",
        body: JSON.stringify({
          source: form.source,
          title: form.title,
          content: form.content,
          url: form.url || void 0,
          tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : []
        })
      });
      setForm({ source: "note", title: "", content: "", url: "", tags: "" });
      setAdding(false);
      showToast("success", "\u7D20\u6750\u5DF2\u4FDD\u5B58");
      reload();
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "\u4FDD\u5B58\u5931\u8D25");
    }
  };
  const handleDelete = async (id) => {
    const ok = await confirm("\u5220\u9664\u7D20\u6750", "\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u6761\u7D20\u6750\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002");
    if (!ok) return;
    try {
      await api(`/materials/${id}`, { method: "DELETE" });
      showToast("success", "\u5DF2\u5220\u9664");
      reload();
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "\u5220\u9664\u5931\u8D25");
    }
  };
  if (loading) return h(SkeletonCards, { count: 4 });
  const filtered = data && search ? data.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()) || m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))) : data;
  return h(
    "div",
    { className: "dsw-page-enter" },
    h(
      "div",
      { className: "dsw-section-header" },
      h("h2", { className: "dsw-section-title" }, "\u{1F4DD} \u7D20\u6750\u5E93"),
      h("button", { className: "dsw-btn dsw-btn-primary", onClick: () => setAdding(!adding) }, adding ? "\u2715 \u53D6\u6D88" : "+ \u6DFB\u52A0\u7D20\u6750")
    ),
    !adding && data && data.length > 3 && h(
      "div",
      { style: { marginBottom: 14 } },
      h("input", {
        className: "dsw-input",
        value: search,
        placeholder: "\u{1F50D} \u641C\u7D22\u7D20\u6750\u2026",
        onChange: (e) => setSearch(e.target.value),
        style: { maxWidth: 320 }
      })
    ),
    adding && h(
      "div",
      { className: "dsw-card", style: { animation: "dsw-slide-in .2s ease-out" } },
      h("div", { className: "dsw-card-title" }, "\u6DFB\u52A0\u65B0\u7D20\u6750"),
      h(
        "div",
        { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } },
        h(
          "div",
          { className: "dsw-form-row" },
          h("label", { className: "dsw-form-label" }, "\u7C7B\u578B"),
          h(
            "select",
            { className: "dsw-select", value: form.source, onChange: (e) => setForm({ ...form, source: e.target.value }) },
            ...Object.entries(MATERIAL_SOURCE_LABELS).map(([k, v]) => h("option", { key: k, value: k }, v))
          )
        ),
        h(
          "div",
          { className: "dsw-form-row" },
          h("label", { className: "dsw-form-label" }, "\u6807\u9898"),
          h("input", { className: "dsw-input", value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }), placeholder: "\u7D20\u6750\u6807\u9898" })
        )
      ),
      h(
        "div",
        { className: "dsw-form-row" },
        h("label", { className: "dsw-form-label" }, "\u5185\u5BB9"),
        h("textarea", { className: "dsw-textarea", value: form.content, onChange: (e) => setForm({ ...form, content: e.target.value }), placeholder: "\u7C98\u8D34\u6216\u8F93\u5165\u7D20\u6750\u5185\u5BB9\u2026", rows: 5 })
      ),
      h(
        "div",
        { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } },
        h(
          "div",
          { className: "dsw-form-row" },
          h("label", { className: "dsw-form-label" }, "\u94FE\u63A5\uFF08\u53EF\u9009\uFF09"),
          h("input", { className: "dsw-input", value: form.url, onChange: (e) => setForm({ ...form, url: e.target.value }), placeholder: "https://..." })
        ),
        h(
          "div",
          { className: "dsw-form-row" },
          h("label", { className: "dsw-form-label" }, "\u6807\u7B7E\uFF08\u9017\u53F7\u5206\u9694\uFF09"),
          h("input", { className: "dsw-input", value: form.tags, onChange: (e) => setForm({ ...form, tags: e.target.value }), placeholder: "\u6807\u7B7E1, \u6807\u7B7E2" })
        )
      ),
      h(
        "div",
        { style: { display: "flex", gap: 8, justifyContent: "flex-end" } },
        h("button", { className: "dsw-btn", onClick: () => setAdding(false) }, "\u53D6\u6D88"),
        h("button", { className: "dsw-btn dsw-btn-primary", onClick: handleAdd, disabled: !form.title || !form.content }, "\u{1F4BE} \u4FDD\u5B58")
      )
    ),
    !filtered || filtered.length === 0 ? h(
      "div",
      { className: "dsw-empty" },
      h("div", { className: "dsw-empty-icon" }, search ? "\u{1F50D}" : "\u{1F4ED}"),
      h("div", { className: "dsw-empty-text" }, search ? "\u6CA1\u6709\u5339\u914D\u7684\u7D20\u6750" : "\u8FD8\u6CA1\u6709\u7D20\u6750\uFF0C\u5F00\u59CB\u6536\u96C6\u5427"),
      !search && h("div", { className: "dsw-empty-hint" }, '\u{1F4A1} \u5728 DSH \u5BF9\u8BDD\u4E2D\u8BF4"\u5E2E\u6211\u4FDD\u5B58\u4E00\u6761\u7D20\u6750"\u5373\u53EF\u5FEB\u901F\u6DFB\u52A0')
    ) : h(
      "table",
      { className: "dsw-table" },
      h(
        "thead",
        null,
        h(
          "tr",
          null,
          h("th", null, "\u7C7B\u578B"),
          h("th", null, "\u6807\u9898"),
          h("th", null, "\u6807\u7B7E"),
          h("th", null, "\u65F6\u95F4"),
          h("th", null, "\u64CD\u4F5C")
        )
      ),
      h(
        "tbody",
        null,
        ...filtered.slice().reverse().flatMap((m) => {
          const isExpanded = expanded === m.id;
          const items = [
            h(
              "tr",
              { key: m.id, style: { cursor: "pointer" }, onClick: () => setExpanded(isExpanded ? null : m.id) },
              h("td", null, h("span", { className: "dsw-badge dsw-badge-gray" }, MATERIAL_SOURCE_LABELS[m.source] ?? m.source)),
              h("td", null, h("strong", null, `${isExpanded ? "\u25BE" : "\u25B8"} ${m.title}`)),
              h("td", null, ...m.tags.map((t) => h("span", { key: t, className: "dsw-tag" }, t))),
              h("td", null, new Date(m.createdAt).toLocaleDateString("zh-CN")),
              h("td", null, h("button", { className: "dsw-btn dsw-btn-sm dsw-btn-danger", onClick: (e) => {
                e.stopPropagation();
                handleDelete(m.id);
              } }, "\u{1F5D1}"))
            )
          ];
          if (isExpanded) {
            items.push(
              h(
                "tr",
                { key: `${m.id}-detail` },
                h(
                  "td",
                  { colSpan: 5, style: { padding: 0 } },
                  h(
                    "div",
                    { style: {
                      padding: "12px 16px",
                      background: "var(--dsw-alias-bg-l1, #f7f7f7)",
                      borderTop: "1px solid var(--dsw-alias-border-l1, #eee)",
                      fontSize: 13,
                      lineHeight: 1.8,
                      whiteSpace: "pre-wrap",
                      color: "var(--dsw-alias-label-primary, #333)"
                    } },
                    m.content,
                    m.url && h(
                      "div",
                      { style: { marginTop: 8 } },
                      h(
                        "a",
                        { href: m.url, target: "_blank", rel: "noopener noreferrer", style: { color: "var(--dsw-alias-state-business-primary, #0070f3)", textDecoration: "underline" } },
                        `\u{1F517} ${m.url}`
                      )
                    ),
                    h(
                      "div",
                      { style: { marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" } },
                      h("button", { className: "dsw-btn dsw-btn-sm", onClick: (e) => {
                        e.stopPropagation();
                        copyText(m.content);
                      } }, "\u{1F4CB} \u590D\u5236\u5185\u5BB9"),
                      h("button", { className: "dsw-btn dsw-btn-sm", onClick: (e) => {
                        e.stopPropagation();
                        sendToDshChat(`\u8BF7\u5E2E\u6211\u5206\u6790\u4EE5\u4E0B\u81EA\u5A92\u4F53\u7D20\u6750\uFF0C\u63D0\u53D6\u5173\u952E\u4FE1\u606F\uFF0C\u7ED9\u51FA\u9009\u9898\u5EFA\u8BAE\u548C\u521B\u4F5C\u65B9\u5411\uFF1A

\u6807\u9898\uFF1A${m.title}
\u7C7B\u578B\uFF1A${MATERIAL_SOURCE_LABELS[m.source] ?? m.source}
\u6807\u7B7E\uFF1A${m.tags.join(", ")}
${m.url ? `\u6765\u6E90\u94FE\u63A5\uFF1A${m.url}
` : ""}
--- \u5185\u5BB9 ---
${m.content}
---

\u8BF7\u7ED9\u51FA\uFF1A
1. \u6838\u5FC3\u8981\u70B9\u63D0\u70BC
2. 3\u4E2A\u53EF\u9009\u9009\u9898\u65B9\u5411
3. \u9002\u5408\u7684\u53D1\u5E03\u5E73\u53F0\u5EFA\u8BAE`);
                      } }, "\u{1F916} AI \u5206\u6790")
                    )
                  )
                )
              )
            );
          }
          return items;
        })
      )
    )
  );
};
var TOPIC_STATUS_MAP = {
  new: { badge: "dsw-badge-blue", label: "\u65B0" },
  planned: { badge: "dsw-badge-yellow", label: "\u8BA1\u5212\u4E2D" },
  drafted: { badge: "dsw-badge-green", label: "\u5DF2\u8D77\u7A3F" },
  dropped: { badge: "dsw-badge-gray", label: "\u5DF2\u653E\u5F03" }
};
var statusBadge = (status) => {
  const info = TOPIC_STATUS_MAP[status];
  return h("span", { className: `dsw-badge ${info?.badge ?? "dsw-badge-gray"}` }, info?.label ?? status);
};
var TopicsPage = () => {
  const { data, loading, reload } = useApi("/topics");
  const [filter, setFilter] = (0, import_react.useState)("all");
  const handleDelete = async (id) => {
    const ok = await confirm("\u5220\u9664\u9009\u9898", "\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u4E2A\u9009\u9898\u5417\uFF1F");
    if (!ok) return;
    try {
      await api(`/topics/${id}`, { method: "DELETE" });
      showToast("success", "\u9009\u9898\u5DF2\u5220\u9664");
      reload();
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "\u5220\u9664\u5931\u8D25");
    }
  };
  if (loading) return h(SkeletonCards, { count: 3 });
  const filtered = data && filter !== "all" ? data.filter((t) => t.status === filter) : data;
  return h(
    "div",
    { className: "dsw-page-enter" },
    h(
      "div",
      { className: "dsw-section-header" },
      h("h2", { className: "dsw-section-title" }, "\u{1F4A1} \u9009\u9898\u5E93")
    ),
    data && data.length > 0 && h(
      "div",
      { className: "dsw-chips" },
      h("button", { className: "dsw-chip", "data-active": String(filter === "all"), onClick: () => setFilter("all") }, `\u5168\u90E8 (${data.length})`),
      ...Object.entries(TOPIC_STATUS_MAP).map(([key, info]) => {
        const count = data.filter((t) => t.status === key).length;
        return count > 0 ? h("button", { key, className: "dsw-chip", "data-active": String(filter === key), onClick: () => setFilter(key) }, `${info.label} (${count})`) : null;
      })
    ),
    !filtered || filtered.length === 0 ? h(
      "div",
      { className: "dsw-empty" },
      h("div", { className: "dsw-empty-icon" }, "\u{1F4A1}"),
      h("div", { className: "dsw-empty-text" }, filter !== "all" ? "\u6CA1\u6709\u5339\u914D\u7684\u9009\u9898" : "\u8FD8\u6CA1\u6709\u9009\u9898"),
      filter === "all" && h("div", { className: "dsw-empty-hint" }, '\u{1F4A1} \u5728\u5BF9\u8BDD\u4E2D\u8BF4"\u6839\u636E\u6211\u7684\u7D20\u6750\u5E93\u63D0\u70BC\u51E0\u4E2A\u9009\u9898"')
    ) : h(
      "div",
      null,
      ...filtered.slice().reverse().map(
        (t) => h(
          "div",
          { key: t.id, className: "dsw-card" },
          h(
            "div",
            { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 } },
            h("div", { className: "dsw-card-title", style: { flex: 1 } }, t.title),
            h(
              "div",
              { style: { display: "flex", gap: 6, alignItems: "center", flexShrink: 0 } },
              statusBadge(t.status),
              (t.status === "new" || t.status === "planned") && h("button", {
                className: "dsw-btn dsw-btn-sm dsw-btn-primary",
                onClick: () => sendToDshChat(`\u8BF7\u5E2E\u6211\u6839\u636E\u4EE5\u4E0B\u9009\u9898\u5199\u4E00\u7BC7\u81EA\u5A92\u4F53\u8349\u7A3F\uFF1A

\u9009\u9898\u6807\u9898\uFF1A${t.title}
\u5207\u5165\u89D2\u5EA6\uFF1A${t.angle}${t.hook ? `
\u94A9\u5B50\uFF1A${t.hook}` : ""}${t.audience ? `
\u76EE\u6807\u53D7\u4F17\uFF1A${t.audience}` : ""}${t.quotes.length ? `
\u53C2\u8003\u7D20\u6750\uFF1A
${t.quotes.map((q) => `"${q}"`).join("\n")}` : ""}

\u8BF7\u8F93\u51FA\uFF1A
1. \u6807\u9898
2. \u6B63\u6587
3. 3-5\u4E2A\u6807\u7B7E

\u8981\u6C42\uFF1A\u98CE\u683C\u63A5\u5730\u6C14\u3001\u6709\u7F51\u611F\u3001\u9002\u5408\u77ED\u89C6\u9891\u5E73\u53F0`)
              }, "\u270D\uFE0F AI \u8D77\u8349"),
              h("button", { className: "dsw-btn dsw-btn-sm dsw-btn-danger", onClick: () => handleDelete(t.id) }, "\u{1F5D1}")
            )
          ),
          h(
            "div",
            { style: { fontSize: 13, color: "var(--dsw-alias-label-secondary, #666)", marginTop: 6 } },
            h("strong", null, "\u{1F3AF} \u5207\u5165\u89D2\u5EA6\uFF1A"),
            t.angle
          ),
          t.hook && h(
            "div",
            { style: { fontSize: 13, color: "var(--dsw-alias-label-secondary, #666)", marginTop: 4 } },
            h("strong", null, "\u{1FA9D} \u94A9\u5B50\uFF1A"),
            t.hook
          ),
          t.audience && h(
            "div",
            { style: { fontSize: 13, color: "var(--dsw-alias-label-secondary, #666)", marginTop: 4 } },
            h("strong", null, "\u{1F465} \u53D7\u4F17\uFF1A"),
            t.audience
          ),
          t.quotes.length > 0 && h(
            "div",
            {
              style: {
                marginTop: 10,
                padding: "10px 14px",
                borderRadius: 10,
                fontSize: 13,
                fontStyle: "italic",
                color: "var(--dsw-alias-label-tertiary, #888)",
                background: "color-mix(in srgb, var(--dsw-alias-label-primary, #000) 3%, var(--dsw-alias-bg-base, #fff))",
                borderLeft: "3px solid var(--dsw-alias-state-business-primary, #0070f3)"
              }
            },
            ...t.quotes.map((q, i) => h("div", { key: i, style: { marginTop: i > 0 ? 4 : 0 } }, `"${q}"`))
          )
        )
      )
    )
  );
};
var DRAFT_STATUS_CONFIG = {
  writing: { badge: "dsw-badge-yellow", emoji: "\u270F\uFE0F" },
  reviewing: { badge: "dsw-badge-blue", emoji: "\u{1F50D}" },
  ready: { badge: "dsw-badge-green", emoji: "\u2705" },
  published: { badge: "dsw-badge-gray", emoji: "\u{1F680}" }
};
var draftStatusBadge = (status) => h(
  "span",
  { className: `dsw-badge ${DRAFT_STATUS_CONFIG[status].badge}` },
  `${DRAFT_STATUS_CONFIG[status].emoji} ${DRAFT_STATUS_LABELS[status]}`
);
var scoreClass = (score) => score >= 80 ? "dsw-score-high" : score >= 60 ? "dsw-score-mid" : "dsw-score-low";
var DraftsPage = () => {
  const { data, loading, reload } = useApi("/drafts");
  const [selected, setSelected] = (0, import_react.useState)(null);
  const [detail, setDetail] = (0, import_react.useState)(null);
  const [statusFilter, setStatusFilter] = (0, import_react.useState)("all");
  const [showPreview, setShowPreview] = (0, import_react.useState)(false);
  const [previewPlatform, setPreviewPlatform] = (0, import_react.useState)("xiaohongshu");
  const [wxHtml, setWxHtml] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    if (selected) {
      api(`/drafts/${selected}`).then(setDetail).catch(() => setDetail(null));
    } else {
      setDetail(null);
      setShowPreview(false);
    }
  }, [selected]);
  (0, import_react.useEffect)(() => {
    if (showPreview && detail && previewPlatform === "wechat") {
      api(`/drafts/${detail.id}/preview?platform=wechat`).then((r) => setWxHtml(r.html)).catch(() => setWxHtml(null));
    }
  }, [showPreview, previewPlatform, detail?.id]);
  const handleDelete = async (id) => {
    const ok = await confirm("\u5220\u9664\u8349\u7A3F", "\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u7BC7\u8349\u7A3F\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002");
    if (!ok) return;
    try {
      await api(`/drafts/${id}`, { method: "DELETE" });
      if (selected === id) {
        setSelected(null);
        setDetail(null);
      }
      showToast("success", "\u8349\u7A3F\u5DF2\u5220\u9664");
      reload();
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "\u5220\u9664\u5931\u8D25");
    }
  };
  const handleStatusChange = async (id, status) => {
    try {
      await api(`/drafts/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
      showToast("success", `\u5DF2\u66F4\u65B0\u4E3A"${DRAFT_STATUS_LABELS[status]}"`);
      reload();
      if (selected === id) {
        api(`/drafts/${id}`).then(setDetail).catch(() => setDetail(null));
      }
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "\u66F4\u65B0\u5931\u8D25");
    }
  };
  const handleWechatPublish = async (id) => {
    const ok = await confirm("\u53D1\u5E03\u5230\u516C\u4F17\u53F7", "\u5C06\u901A\u8FC7\u6587\u989C(wenyan)\u6392\u7248\u5E76\u63A8\u9001\u5230\u5FAE\u4FE1\u516C\u4F17\u53F7\u8349\u7A3F\u7BB1\u3002\u786E\u5B9A\u7EE7\u7EED\uFF1F");
    if (!ok) return;
    try {
      showToast("info", "\u6B63\u5728\u6392\u7248\u5E76\u63A8\u9001\u516C\u4F17\u53F7\uFF0C\u8BF7\u7A0D\u5019\u2026");
      const result = await api(`/drafts/${id}/wechat-publish`, { method: "POST", body: JSON.stringify({}) });
      if (result.success) {
        showToast("success", "\u{1F389} \u5DF2\u63A8\u9001\u5230\u516C\u4F17\u53F7\u8349\u7A3F\u7BB1\uFF01");
      } else {
        showToast("error", result.message ?? "\u53D1\u5E03\u5931\u8D25");
      }
      reload();
      if (selected === id) {
        api(`/drafts/${id}`).then(setDetail).catch(() => setDetail(null));
      }
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "\u53D1\u5E03\u5931\u8D25\uFF0C\u8BF7\u786E\u4FDD\u5DF2\u5B89\u88C5 wenyan-cli \u5E76\u914D\u7F6E\u516C\u4F17\u53F7\u51ED\u636E");
    }
  };
  const handlePublish = async (id) => {
    const ok = await confirm("\u53D1\u5E03\u8349\u7A3F", "\u786E\u5B9A\u901A\u8FC7 OpenCLI \u53D1\u5E03\u8FD9\u7BC7\u5185\u5BB9\u5230\u76EE\u6807\u5E73\u53F0\u5417\uFF1F\u53D1\u5E03\u540E\u5185\u5BB9\u5C06\u7ACB\u5373\u516C\u5F00\u3002");
    if (!ok) return;
    try {
      showToast("info", "\u6B63\u5728\u53D1\u5E03\u4E2D\uFF0C\u8BF7\u7A0D\u5019\u2026");
      const result = await api(`/drafts/${id}/publish`, { method: "POST", body: JSON.stringify({}) });
      showToast("success", `\u{1F389} \u5DF2\u6210\u529F\u53D1\u5E03\u5230 ${PLATFORM_LABELS[result.platform] ?? result.platform}\uFF01`);
      reload();
      if (selected === id) {
        api(`/drafts/${id}`).then(setDetail).catch(() => setDetail(null));
      }
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "\u53D1\u5E03\u5931\u8D25\uFF0C\u8BF7\u786E\u4FDD\u5DF2\u5B89\u88C5 OpenCLI \u5E76\u767B\u5F55\u5BF9\u5E94\u5E73\u53F0");
    }
  };
  if (loading) return h(SkeletonCards, { count: 3 });
  if (detail) {
    const avgScore = detail.checks.length > 0 ? Math.round(detail.checks.reduce((s, c) => s + c.score, 0) / detail.checks.length) : null;
    const previewVersion = detail.versions.find((v) => v.platform === previewPlatform);
    const previewTitle = previewVersion?.title ?? detail.title;
    const previewBody = previewVersion?.body ?? detail.body;
    const previewHashtags = previewVersion?.hashtags ?? [];
    return h(
      "div",
      { className: "dsw-page-enter" },
      h(
        "div",
        { className: "dsw-actions" },
        h("button", { className: "dsw-btn", onClick: () => setSelected(null) }, "\u2190 \u8FD4\u56DE\u5217\u8868"),
        draftStatusBadge(detail.status),
        h("span", { className: "dsw-badge dsw-badge-blue" }, PLATFORM_LABELS[detail.platform] ?? detail.platform),
        avgScore !== null && h("span", { className: `dsw-score ${scoreClass(avgScore)}` }, `${avgScore}/100`),
        h("button", {
          className: `dsw-btn ${showPreview ? "dsw-btn-primary" : ""}`,
          onClick: () => setShowPreview(!showPreview),
          style: { marginLeft: "auto" }
        }, showPreview ? "\u{1F4DD} \u7F16\u8F91\u89C6\u56FE" : "\u{1F441}\uFE0F \u9884\u89C8")
      ),
      !showPreview && h("h2", { style: { marginTop: 8, marginBottom: 12 } }, detail.title),
      !showPreview && h(
        "div",
        { className: "dsw-draft-body" },
        h("button", { className: "dsw-copy-btn", onClick: () => copyText(detail.body) }, "\u{1F4CB} \u590D\u5236"),
        detail.body
      ),
      showPreview && h(
        "div",
        { className: "dsw-preview-wrap" },
        h(
          "div",
          { className: "dsw-preview-tabs" },
          ...["wechat", "xiaohongshu", "douyin", "twitter"].map(
            (p) => h("button", {
              key: p,
              className: "dsw-preview-tab",
              "data-active": String(previewPlatform === p),
              onClick: () => setPreviewPlatform(p)
            }, PLATFORM_LABELS[p] ?? p)
          )
        ),
        h(
          "div",
          { className: "dsw-preview-frame" },
          previewPlatform === "wechat" && h(
            "div",
            { className: "dsw-phone-frame" },
            h(
              "div",
              { className: "dsw-wx-header" },
              h("h1", { className: "dsw-wx-title" }, previewTitle),
              h(
                "div",
                { className: "dsw-wx-meta" },
                h("span", null, "\u539F\u521B"),
                h("span", null, (/* @__PURE__ */ new Date()).toLocaleDateString("zh-CN"))
              )
            ),
            wxHtml ? h("div", { className: "dsw-wx-body-html", dangerouslySetInnerHTML: { __html: wxHtml } }) : h("div", { className: "dsw-wx-body" }, previewBody),
            h(
              "div",
              { className: "dsw-wx-footer" },
              h("span", null, "\u2764\uFE0F \u5728\u770B"),
              h("span", null, "\u{1F4AC} \u7559\u8A00"),
              h("span", null, "\u{1F504} \u5206\u4EAB")
            )
          ),
          previewPlatform === "xiaohongshu" && h(
            "div",
            { className: "dsw-phone-frame" },
            h(
              "div",
              { className: "dsw-xhs-cover" },
              h("div", { className: "dsw-xhs-cover-gradient" }),
              h("div", { className: "dsw-xhs-cover-title" }, previewTitle)
            ),
            h(
              "div",
              { className: "dsw-xhs-body" },
              h("div", { className: "dsw-xhs-body-title" }, previewTitle),
              h("div", { className: "dsw-xhs-body-text" }, previewBody)
            ),
            previewHashtags.length > 0 && h(
              "div",
              { className: "dsw-xhs-tags" },
              ...previewHashtags.map((t) => h("span", { key: t, className: "dsw-xhs-tag" }, `#${t} `))
            ),
            h(
              "div",
              { className: "dsw-xhs-bar" },
              h("span", null, "\u2764\uFE0F \u70B9\u8D5E"),
              h("span", null, "\u2B50 \u6536\u85CF"),
              h("span", null, "\u{1F4AC} \u8BC4\u8BBA"),
              h("span", null, "\u2197\uFE0F \u5206\u4EAB")
            )
          ),
          previewPlatform === "douyin" && h(
            "div",
            { className: "dsw-dy-frame" },
            h(
              "div",
              { className: "dsw-dy-actions" },
              h("div", { className: "dsw-dy-action-btn" }, h("span", { className: "dsw-dy-action-icon" }, "\u2764\uFE0F"), "0"),
              h("div", { className: "dsw-dy-action-btn" }, h("span", { className: "dsw-dy-action-icon" }, "\u{1F4AC}"), "0"),
              h("div", { className: "dsw-dy-action-btn" }, h("span", { className: "dsw-dy-action-icon" }, "\u2B50"), "0"),
              h("div", { className: "dsw-dy-action-btn" }, h("span", { className: "dsw-dy-action-icon" }, "\u2197\uFE0F"), "0")
            ),
            h(
              "div",
              { className: "dsw-dy-overlay" },
              h("div", { className: "dsw-dy-author" }, `@\u521B\u4F5C\u8005`),
              h("div", { className: "dsw-dy-desc" }, previewBody.slice(0, 200)),
              previewHashtags.length > 0 && h(
                "div",
                { className: "dsw-dy-hashtags" },
                previewHashtags.map((t) => `#${t}`).join(" ")
              )
            )
          ),
          previewPlatform === "twitter" && h(
            "div",
            { className: "dsw-tw-frame" },
            h(
              "div",
              { className: "dsw-tw-header" },
              h("div", { className: "dsw-tw-avatar" }, "\u{1F426}"),
              h(
                "div",
                { className: "dsw-tw-user" },
                h("div", { className: "dsw-tw-name" }, "Creator"),
                h("div", { className: "dsw-tw-handle" }, "@creator")
              )
            ),
            h(
              "div",
              { className: "dsw-tw-body" },
              previewBody.slice(0, 280),
              previewHashtags.length > 0 && h(
                "span",
                { className: "dsw-tw-tags" },
                "\n" + previewHashtags.map((t) => `#${t}`).join(" ")
              )
            ),
            h("div", {
              className: `dsw-tw-char-count ${previewBody.length > 280 ? "dsw-tw-char-over" : "dsw-tw-char-ok"}`
            }, `${previewBody.length} / 280`),
            h(
              "div",
              { className: "dsw-tw-footer" },
              h("span", null, "\u{1F4AC} \u56DE\u590D"),
              h("span", null, "\u{1F504} \u8F6C\u63A8"),
              h("span", null, "\u2764\uFE0F \u559C\u6B22"),
              h("span", null, "\u{1F516} \u4E66\u7B7E")
            )
          )
        )
      ),
      detail.checks.length > 0 && h(
        "div",
        { style: { marginTop: 24 } },
        h("h3", { style: { marginBottom: 12 } }, "\u{1F4CB} \u4F53\u68C0\u62A5\u544A"),
        ...detail.checks.map((c, i) => {
          const icon = c.score >= 80 ? "\u2705" : c.score >= 60 ? "\u26A0\uFE0F" : "\u274C";
          return h(
            "div",
            { key: i, className: "dsw-card" },
            h(
              "div",
              { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
              h("strong", null, `${icon} ${CHECK_LABELS[c.kind] ?? c.kind}`),
              h("span", { className: `dsw-score ${scoreClass(c.score)}`, style: { fontSize: 20 } }, `${c.score}`)
            ),
            h("div", { style: { fontSize: 13, color: "var(--dsw-alias-label-secondary, #666)", marginTop: 6 } }, c.verdict),
            c.issues.length > 0 && h(
              "div",
              { style: { marginTop: 10 } },
              ...c.issues.map((issue, j) => h(
                "div",
                {
                  key: j,
                  style: {
                    padding: "8px 0",
                    borderTop: j > 0 ? "1px solid var(--dsw-alias-border-l1, #eee)" : "none",
                    fontSize: 13
                  }
                },
                h(
                  "div",
                  { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4 } },
                  h("span", { className: `dsw-badge ${issue.severity === "high" ? "dsw-badge-red" : issue.severity === "medium" ? "dsw-badge-yellow" : "dsw-badge-gray"}` }, issue.severity),
                  h("span", { style: { fontWeight: 500 } }, issue.problem)
                ),
                issue.quote && h("div", { style: { fontStyle: "italic", color: "var(--dsw-alias-label-tertiary, #888)", marginBottom: 4 } }, `"${issue.quote}"`),
                h("div", { style: { color: "var(--dsw-alias-state-business-primary, #0070f3)" } }, `\u{1F4A1} ${issue.suggestion}`)
              ))
            )
          );
        })
      ),
      detail.versions.length > 0 && h(
        "div",
        { style: { marginTop: 24 } },
        h("h3", { style: { marginBottom: 12 } }, "\u{1F504} \u5E73\u53F0\u9002\u914D\u7248\u672C"),
        ...detail.versions.map(
          (v, i) => h(
            "div",
            { key: i, className: "dsw-card" },
            h(
              "div",
              { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 } },
              h("span", { className: "dsw-badge dsw-badge-blue" }, PLATFORM_LABELS[v.platform] ?? v.platform),
              h("strong", null, v.title),
              h("button", { className: "dsw-btn dsw-btn-sm", onClick: () => copyText(`${v.title}

${v.body}${v.hashtags.length ? "\n\n" + v.hashtags.map((t) => `#${t}`).join(" ") : ""}`) }, "\u{1F4CB}")
            ),
            h("div", { style: { whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.7 } }, v.body),
            v.hashtags.length > 0 && h(
              "div",
              { style: { marginTop: 8 } },
              ...v.hashtags.map((tag) => h("span", { key: tag, className: "dsw-tag" }, `#${tag}`))
            )
          )
        )
      ),
      detail.publishResults && detail.publishResults.length > 0 && h(
        "div",
        { style: { marginTop: 24 } },
        h("h3", { style: { marginBottom: 12 } }, "\u{1F680} \u53D1\u5E03\u8BB0\u5F55"),
        ...detail.publishResults.map(
          (pr, i) => h(
            "div",
            { key: i, className: "dsw-card", style: { background: "var(--dsw-alias-bg-success, rgba(0,200,83,0.06))" } },
            h(
              "div",
              { style: { display: "flex", alignItems: "center", gap: 8 } },
              h("span", null, "\u2705"),
              h("span", { className: "dsw-badge dsw-badge-blue" }, PLATFORM_LABELS[pr.platform] ?? pr.platform),
              h("span", { style: { fontSize: 12, color: "var(--dsw-alias-label-secondary, #888)" } }, new Date(pr.publishedAt).toLocaleString())
            ),
            pr.url && h("a", {
              href: pr.url,
              target: "_blank",
              rel: "noopener noreferrer",
              style: { display: "block", marginTop: 6, fontSize: 13, color: "var(--dsw-alias-state-business-primary, #0070f3)", textDecoration: "underline" }
            }, `\u{1F517} ${pr.url}`)
          )
        )
      ),
      h(
        "div",
        { style: { marginTop: 20, padding: "12px 0", borderTop: "1px solid var(--dsw-alias-border-l1, #e5e5e5)" } },
        h("div", { style: { fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--dsw-alias-label-secondary, #888)" } }, "\u{1F916} AI \u5DE5\u5177\u7BB1"),
        h(
          "div",
          { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
          h("button", { className: "dsw-btn dsw-btn-sm", onClick: () => sendToDshChat(buildDraftAiPrompt(detail, "polish")) }, "\u2728 \u6DA6\u8272"),
          h("button", { className: "dsw-btn dsw-btn-sm", onClick: () => sendToDshChat(buildDraftAiPrompt(detail, "rewrite")) }, "\u{1F504} \u91CD\u5199"),
          h("button", { className: "dsw-btn dsw-btn-sm", onClick: () => sendToDshChat(buildDraftAiPrompt(detail, "expand")) }, "\u{1F4D6} \u6269\u5199"),
          h("button", { className: "dsw-btn dsw-btn-sm", onClick: () => sendToDshChat(buildDraftAiPrompt(detail, "shorten")) }, "\u2702\uFE0F \u7CBE\u7B80")
        ),
        h(
          "div",
          { style: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 } },
          h("button", { className: "dsw-btn dsw-btn-sm", onClick: () => sendToDshChat(`\u8BF7\u4F7F\u7528 social_title_gen \u5DE5\u5177\u4E3A\u8349\u7A3F ${detail.id} \u751F\u6210 10 \u4E2A\u7206\u6B3E\u6807\u9898\u5019\u9009`) }, "\u{1F525} \u7206\u6B3E\u6807\u9898"),
          h("button", { className: "dsw-btn dsw-btn-sm", onClick: () => sendToDshChat(`\u8BF7\u4F7F\u7528 social_content_score \u5DE5\u5177\u5BF9\u8349\u7A3F ${detail.id} \u8FDB\u884C\u7EFC\u5408\u8BC4\u5206`) }, "\u{1F4CA} \u5185\u5BB9\u8BC4\u5206"),
          h("button", { className: "dsw-btn dsw-btn-sm", onClick: () => sendToDshChat(`\u8BF7\u4F7F\u7528 social_adapt_all \u5DE5\u5177\u5C06\u8349\u7A3F ${detail.id} \u4E00\u952E\u6539\u5199\u4E3A\u6240\u6709\u5E73\u53F0\u7248\u672C`) }, "\u{1F310} \u5168\u5E73\u53F0\u6539\u5199"),
          h("button", { className: "dsw-btn dsw-btn-sm", onClick: () => sendToDshChat(`\u8BF7\u4F7F\u7528 social_weekly_plan \u5DE5\u5177\uFF0C\u7ED3\u5408\u6211\u7684\u521B\u4F5C\u8005\u753B\u50CF\u751F\u6210\u672C\u5468 7 \u5929\u5185\u5BB9\u53D1\u5E03\u8BA1\u5212`) }, "\u{1F4C6} \u5468\u8BA1\u5212")
        )
      ),
      h(
        "div",
        { className: "dsw-actions", style: { marginTop: 12, paddingTop: 16, borderTop: "1px solid var(--dsw-alias-border-l1, #e5e5e5)" } },
        detail.status === "writing" && h("button", { className: "dsw-btn dsw-btn-primary", onClick: () => handleStatusChange(detail.id, "reviewing") }, "\u{1F50D} \u9001\u53BB\u4F53\u68C0"),
        detail.status === "reviewing" && h("button", { className: "dsw-btn dsw-btn-primary", onClick: () => handleStatusChange(detail.id, "ready") }, "\u2705 \u6807\u8BB0\u53EF\u53D1\u5E03"),
        detail.status === "ready" && h("button", { className: "dsw-btn dsw-btn-primary", onClick: () => handlePublish(detail.id) }, "\u{1F680} \u4E00\u952E\u53D1\u5E03"),
        detail.status === "ready" && h("button", { className: "dsw-btn dsw-btn-accent", onClick: () => handleWechatPublish(detail.id) }, "\u2712\uFE0F \u53D1\u516C\u4F17\u53F7"),
        detail.status === "ready" && h("button", { className: "dsw-btn", onClick: () => handleStatusChange(detail.id, "published") }, "\u{1F4DD} \u4EC5\u6807\u8BB0\u5DF2\u53D1\u5E03"),
        detail.status === "published" && !detail.publishResults?.length && h("button", { className: "dsw-btn dsw-btn-primary", onClick: () => handlePublish(detail.id) }, "\u{1F680} \u901A\u8FC7 OpenCLI \u53D1\u5E03"),
        detail.status === "published" && h("button", { className: "dsw-btn dsw-btn-accent", onClick: () => handleWechatPublish(detail.id) }, "\u2712\uFE0F \u53D1\u516C\u4F17\u53F7"),
        h("button", { className: "dsw-btn dsw-btn-danger", onClick: () => handleDelete(detail.id) }, "\u{1F5D1} \u5220\u9664")
      )
    );
  }
  const filtered = data && statusFilter !== "all" ? data.filter((d) => d.status === statusFilter) : data;
  return h(
    "div",
    { className: "dsw-page-enter" },
    h(
      "div",
      { className: "dsw-section-header" },
      h("h2", { className: "dsw-section-title" }, "\u270D\uFE0F \u8349\u7A3F\u7BB1")
    ),
    data && data.length > 0 && h(
      "div",
      { className: "dsw-chips" },
      h("button", { className: "dsw-chip", "data-active": String(statusFilter === "all"), onClick: () => setStatusFilter("all") }, `\u5168\u90E8 (${data.length})`),
      ...["writing", "reviewing", "ready", "published"].map((s) => {
        const count = data.filter((d) => d.status === s).length;
        return count > 0 ? h(
          "button",
          { key: s, className: "dsw-chip", "data-active": String(statusFilter === s), onClick: () => setStatusFilter(s) },
          `${DRAFT_STATUS_CONFIG[s].emoji} ${DRAFT_STATUS_LABELS[s]} (${count})`
        ) : null;
      })
    ),
    !filtered || filtered.length === 0 ? h(
      "div",
      { className: "dsw-empty" },
      h("div", { className: "dsw-empty-icon" }, "\u270D\uFE0F"),
      h("div", { className: "dsw-empty-text" }, statusFilter !== "all" ? "\u6CA1\u6709\u5339\u914D\u7684\u8349\u7A3F" : "\u8FD8\u6CA1\u6709\u8349\u7A3F"),
      statusFilter === "all" && h("div", { className: "dsw-empty-hint" }, '\u{1F4A1} \u5728\u5BF9\u8BDD\u4E2D\u8BF4"\u7ED9\u6211\u7684\u7B2C\u4E00\u4E2A\u9009\u9898\u5199\u4E00\u7BC7\u5C0F\u7EA2\u4E66\u7B14\u8BB0"')
    ) : h(
      "table",
      { className: "dsw-table" },
      h(
        "thead",
        null,
        h(
          "tr",
          null,
          h("th", null, "\u6807\u9898"),
          h("th", null, "\u5E73\u53F0"),
          h("th", null, "\u72B6\u6001"),
          h("th", null, "\u4F53\u68C0"),
          h("th", null, "\u66F4\u65B0"),
          h("th", null, "")
        )
      ),
      h(
        "tbody",
        null,
        ...filtered.slice().reverse().map((d) => {
          const avg = d.checks.length > 0 ? Math.round(d.checks.reduce((s, c) => s + c.score, 0) / d.checks.length) : null;
          return h(
            "tr",
            { key: d.id, style: { cursor: "pointer" }, onClick: () => setSelected(d.id) },
            h("td", null, h("strong", null, d.title)),
            h("td", null, h("span", { className: "dsw-badge dsw-badge-blue" }, PLATFORM_LABELS[d.platform] ?? d.platform)),
            h("td", null, draftStatusBadge(d.status)),
            h("td", null, avg !== null ? h("span", { className: `dsw-score ${scoreClass(avg)}` }, `${avg}`) : h("span", { style: { color: "var(--dsw-alias-label-caption, #bbb)" } }, "\u2014")),
            h("td", null, new Date(d.updatedAt).toLocaleDateString("zh-CN")),
            h(
              "td",
              null,
              h("button", {
                className: "dsw-btn dsw-btn-sm dsw-btn-danger",
                onClick: (e) => {
                  e.stopPropagation();
                  handleDelete(d.id);
                }
              }, "\u{1F5D1}")
            )
          );
        })
      )
    )
  );
};
var formatFollowers = (n) => {
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}w`;
  return n.toLocaleString();
};
var RadarPage = () => {
  const { data: accounts, loading: loadingAccounts, reload: reloadAccounts } = useApi("/accounts");
  const { data: hot } = useApi("/hot");
  const { data: scans } = useApi("/scans");
  const handleDeleteAccount = async (id) => {
    const ok = await confirm("\u53D6\u6D88\u76D1\u63A7", "\u786E\u5B9A\u8981\u79FB\u9664\u8FD9\u4E2A\u76D1\u63A7\u8D26\u53F7\u5417\uFF1F");
    if (!ok) return;
    try {
      await api(`/accounts/${id}`, { method: "DELETE" });
      showToast("success", "\u5DF2\u79FB\u9664");
      reloadAccounts();
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "\u5220\u9664\u5931\u8D25");
    }
  };
  if (loadingAccounts) return h(SkeletonCards, { count: 3 });
  return h(
    "div",
    { className: "dsw-page-enter" },
    h(
      "div",
      { className: "dsw-section-header" },
      h("h2", { className: "dsw-section-title" }, "\u{1F4E1} \u793E\u4EA4\u96F7\u8FBE")
    ),
    h(
      "div",
      { className: "dsw-card" },
      h("div", { className: "dsw-card-title" }, "\u{1F440} \u76D1\u63A7\u8D26\u53F7"),
      !accounts || accounts.length === 0 ? h(
        "div",
        { style: { color: "var(--dsw-alias-label-tertiary, #999)", fontSize: 13, padding: "12px 0" } },
        "\u8FD8\u6CA1\u6709\u76D1\u63A7\u8D26\u53F7",
        h("div", { className: "dsw-empty-hint", style: { marginTop: 6 } }, '\u{1F4A1} \u5728\u5BF9\u8BDD\u4E2D\u8BF4"\u626B\u63CF\u8FD9\u4E2A\u5BF9\u6807\u8D26\u53F7\uFF1A[\u6296\u97F3\u4E3B\u9875\u94FE\u63A5]"')
      ) : h(
        "table",
        { className: "dsw-table" },
        h(
          "thead",
          null,
          h(
            "tr",
            null,
            h("th", null, "\u6635\u79F0"),
            h("th", null, "\u5907\u6CE8"),
            h("th", null, "\u7C89\u4E1D"),
            h("th", null, "\u4E0A\u6B21\u626B\u63CF"),
            h("th", null, "")
          )
        ),
        h(
          "tbody",
          null,
          ...accounts.map(
            (a) => h(
              "tr",
              { key: a.id },
              h("td", null, h("strong", null, `@${a.nickname}`)),
              h("td", null, a.note || h("span", { style: { color: "var(--dsw-alias-label-caption, #bbb)" } }, "\u2014")),
              h("td", null, formatFollowers(a.followers)),
              h("td", null, a.lastScanAt ? new Date(a.lastScanAt).toLocaleDateString("zh-CN") : h("span", { className: "dsw-badge dsw-badge-gray" }, "\u672A\u626B\u63CF")),
              h("td", null, h("button", { className: "dsw-btn dsw-btn-sm dsw-btn-danger", onClick: () => handleDeleteAccount(a.id) }, "\u{1F5D1}"))
            )
          )
        )
      )
    ),
    scans && scans.length > 0 && h(
      "div",
      { className: "dsw-card", style: { marginTop: 14 } },
      h("div", { className: "dsw-card-title" }, "\u{1F31F} \u7206\u6B3E\u53D1\u73B0"),
      h(
        "table",
        { className: "dsw-table" },
        h(
          "thead",
          null,
          h(
            "tr",
            null,
            h("th", null, "\u5185\u5BB9"),
            h("th", null, "\u64AD\u653E"),
            h("th", null, "\u4E92\u52A8\u7387"),
            h("th", null, "\u65F6\u95F4")
          )
        ),
        h(
          "tbody",
          null,
          ...scans.flatMap(
            (scan) => scan.videos.filter((v) => scan.outlierIds.includes(v.id)).map(
              (v) => h(
                "tr",
                { key: v.id },
                h("td", null, h("strong", null, v.desc.slice(0, 50)), v.desc.length > 50 ? "\u2026" : ""),
                h("td", null, v.stats.plays.toLocaleString()),
                h(
                  "td",
                  null,
                  h("span", {
                    className: `dsw-score ${v.engagementRate >= 0.05 ? "dsw-score-high" : v.engagementRate >= 0.02 ? "dsw-score-mid" : "dsw-score-low"}`
                  }, `${(v.engagementRate * 100).toFixed(1)}%`)
                ),
                h("td", null, v.createTime ? new Date(v.createTime).toLocaleDateString("zh-CN") : "\u2014")
              )
            )
          ).slice(0, 20)
        )
      )
    ),
    hot && h(
      "div",
      { className: "dsw-card", style: { marginTop: 14 } },
      h(
        "div",
        { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
        h("div", { className: "dsw-card-title", style: { marginBottom: 0 } }, "\u{1F525} \u6296\u97F3\u70ED\u641C"),
        h(
          "span",
          { style: { fontSize: 12, color: "var(--dsw-alias-label-caption, #aaa)" } },
          new Date(hot.fetchedAt).toLocaleString("zh-CN")
        )
      ),
      h(
        "table",
        { className: "dsw-table" },
        h(
          "thead",
          null,
          h(
            "tr",
            null,
            h("th", { style: { width: 40 } }, "#"),
            h("th", null, "\u8BDD\u9898"),
            h("th", null, "\u6807\u7B7E"),
            h("th", null, "\u70ED\u5EA6")
          )
        ),
        h(
          "tbody",
          null,
          ...hot.items.slice(0, 30).map(
            (item, i) => h(
              "tr",
              { key: i },
              h("td", null, h("strong", { style: { color: i < 3 ? "var(--dsw-alias-state-business-primary, #0070f3)" : void 0 } }, item.rank)),
              h("td", null, h("strong", null, item.word)),
              h("td", null, item.label ? h("span", { className: "dsw-badge dsw-badge-red" }, item.label) : ""),
              h("td", null, item.hot.toLocaleString())
            )
          )
        )
      )
    )
  );
};
var DOW_LABELS = ["\u65E5", "\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D"];
var STATUS_COLORS = {
  writing: "rgba(59,130,246,.12)",
  reviewing: "rgba(245,158,11,.12)",
  ready: "rgba(16,185,129,.12)",
  published: "rgba(139,92,246,.12)"
};
function calendarDays(year, month) {
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const result = [];
  for (let i = startDow - 1; i >= 0; i--) result.push({ date: new Date(year, month, -i), other: true });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) result.push({ date: new Date(year, month, d), other: false });
  const remaining = 7 - result.length % 7;
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) result.push({ date: new Date(year, month + 1, d), other: true });
  }
  return result;
}
function dateKey(d) {
  return d.toISOString().slice(0, 10);
}
var CalendarPage = () => {
  const { data: drafts } = useApi("/drafts");
  const now = /* @__PURE__ */ new Date();
  const [year, setYear] = (0, import_react.useState)(now.getFullYear());
  const [month, setMonth] = (0, import_react.useState)(now.getMonth());
  const todayStr = dateKey(now);
  const days = calendarDays(year, month);
  const draftsByDate = /* @__PURE__ */ new Map();
  if (drafts) {
    for (const d of drafts) {
      const key = d.scheduledAt ? d.scheduledAt.slice(0, 10) : d.status === "published" ? d.updatedAt.slice(0, 10) : d.createdAt.slice(0, 10);
      const arr = draftsByDate.get(key);
      if (arr) arr.push(d);
      else draftsByDate.set(key, [d]);
    }
  }
  const prev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const next = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };
  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };
  const monthLabel = `${year}\u5E74${month + 1}\u6708`;
  const publishedThisMonth = drafts?.filter((d) => {
    if (d.status !== "published") return false;
    const key = d.updatedAt.slice(0, 7);
    return key === `${year}-${String(month + 1).padStart(2, "0")}`;
  }).length ?? 0;
  const scheduledThisMonth = drafts?.filter((d) => {
    if (!d.scheduledAt || d.status === "published") return false;
    return d.scheduledAt.slice(0, 7) === `${year}-${String(month + 1).padStart(2, "0")}`;
  }).length ?? 0;
  return h(
    "div",
    { className: "dsw-page-enter" },
    h(
      "div",
      { className: "dsw-section-header" },
      h("h2", { className: "dsw-section-title" }, "\u{1F4C5} \u5185\u5BB9\u65E5\u5386")
    ),
    h(
      "div",
      { style: { display: "flex", gap: 12, marginBottom: 16 } },
      h("div", { className: "dsw-badge dsw-badge-purple" }, `${monthLabel} \u5DF2\u53D1\u5E03 ${publishedThisMonth} \u7BC7`),
      scheduledThisMonth > 0 && h("div", { className: "dsw-badge dsw-badge-blue" }, `\u5F85\u53D1\u5E03 ${scheduledThisMonth} \u7BC7`)
    ),
    h(
      "div",
      { className: "dsw-cal-header" },
      h(
        "div",
        { className: "dsw-cal-nav" },
        h("button", { className: "dsw-cal-nav-btn", onClick: prev }, "\u2039"),
        h("div", { className: "dsw-cal-month" }, monthLabel),
        h("button", { className: "dsw-cal-nav-btn", onClick: next }, "\u203A")
      ),
      h("button", { className: "dsw-btn dsw-btn-sm", onClick: goToday }, "\u4ECA\u5929")
    ),
    h(
      "div",
      { className: "dsw-cal-grid" },
      ...DOW_LABELS.map((d) => h("div", { key: d, className: "dsw-cal-dow" }, d)),
      ...days.map(({ date, other }) => {
        const key = dateKey(date);
        const isToday = key === todayStr;
        const events = draftsByDate.get(key) ?? [];
        return h(
          "div",
          {
            key,
            className: "dsw-cal-cell",
            "data-today": String(isToday),
            "data-other": String(other)
          },
          h("div", { className: "dsw-cal-day" }, date.getDate()),
          ...events.slice(0, 3).map(
            (d) => h("div", {
              key: d.id,
              className: "dsw-cal-event",
              "data-status": d.status,
              title: `${DRAFT_STATUS_LABELS[d.status]} | ${PLATFORM_LABELS[d.platform]} | ${d.title}`
            }, `${PLATFORM_LABELS[d.platform]?.charAt(0) ?? "\u{1F4C4}"} ${d.title}`)
          ),
          events.length > 3 && h("div", { style: { fontSize: 10, color: "var(--dsw-alias-label-tertiary, #999)", textAlign: "center" } }, `+${events.length - 3} \u66F4\u591A`)
        );
      })
    ),
    h(
      "div",
      { className: "dsw-cal-legend" },
      ...["writing", "reviewing", "ready", "published"].map(
        (s) => h(
          "div",
          { key: s, className: "dsw-cal-legend-item" },
          h("div", { className: "dsw-cal-legend-dot", style: { background: STATUS_COLORS[s] } }),
          DRAFT_STATUS_LABELS[s]
        )
      )
    )
  );
};
var PROFILE_FIELDS = [
  { key: "name", label: "\u540D\u79F0/IP", icon: "\u{1F464}", placeholder: "\u4F60\u7684\u54C1\u724C\u540D\u6216 IP \u540D" },
  { key: "niche", label: "\u8D5B\u9053/\u9886\u57DF", icon: "\u{1F3AF}", placeholder: "\u5982\uFF1A\u4E2A\u4EBA\u6210\u957F\u3001AI \u79D1\u6280\u3001\u7F8E\u5986" },
  { key: "audience", label: "\u76EE\u6807\u53D7\u4F17", icon: "\u{1F465}", placeholder: "\u5982\uFF1A25-35 \u5C81\u804C\u573A\u5973\u6027" },
  { key: "offer", label: "\u53D8\u73B0\u65B9\u5411", icon: "\u{1F4B0}", placeholder: "\u5982\uFF1A\u8BFE\u7A0B\u3001\u54A8\u8BE2\u3001\u5E26\u8D27" }
];
var SettingsPage = () => {
  const { data, loading, reload } = useApi("/settings");
  const [profile, setProfile] = (0, import_react.useState)(null);
  const [tikKey, setTikKey] = (0, import_react.useState)("");
  const [saving, setSaving] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    if (data) setProfile(data.profile);
  }, [data]);
  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await api("/settings/profile", { method: "PUT", body: JSON.stringify(profile) });
      showToast("success", "\u521B\u4F5C\u8005\u753B\u50CF\u5DF2\u4FDD\u5B58");
      reload();
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "\u4FDD\u5B58\u5931\u8D25");
    } finally {
      setSaving(false);
    }
  };
  const handleSaveTikKey = async () => {
    setSaving(true);
    try {
      await api("/settings/tikhub-key", { method: "PUT", body: JSON.stringify({ key: tikKey }) });
      setTikKey("");
      showToast("success", "TikHub API Key \u5DF2\u66F4\u65B0");
      reload();
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "\u66F4\u65B0\u5931\u8D25");
    } finally {
      setSaving(false);
    }
  };
  const [picking, setPicking] = (0, import_react.useState)(false);
  const handlePickDir = async () => {
    setPicking(true);
    try {
      const result = await api("/workspace/pick", { method: "POST", body: JSON.stringify({}) });
      if (result.picked) {
        showToast("success", `\u5DE5\u4F5C\u7A7A\u95F4\u5DF2\u5207\u6362\u5230\uFF1A${result.dataDir}`);
        reload();
      } else {
        showToast("info", "\u5DF2\u53D6\u6D88\u9009\u62E9");
      }
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "\u9009\u62E9\u76EE\u5F55\u5931\u8D25");
    } finally {
      setPicking(false);
    }
  };
  if (loading || !data || !profile) return h(SkeletonCards, { count: 3 });
  return h(
    "div",
    { className: "dsw-page-enter" },
    h(
      "div",
      { className: "dsw-section-header" },
      h("h2", { className: "dsw-section-title" }, "\u2699\uFE0F \u8BBE\u7F6E")
    ),
    h(
      "div",
      { className: "dsw-card" },
      h(
        "div",
        { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
        h("div", { className: "dsw-card-title", style: { marginBottom: 0 } }, "\u{1F4C2} \u5DE5\u4F5C\u7A7A\u95F4\u76EE\u5F55"),
        h(
          "button",
          { className: "dsw-btn dsw-btn-primary", onClick: handlePickDir, disabled: picking, style: { flexShrink: 0 } },
          picking ? "\u23F3 \u9009\u62E9\u4E2D\u2026" : "\u{1F4C1} \u66F4\u6362\u76EE\u5F55"
        )
      ),
      h("div", { className: "dsw-card-subtitle" }, "\u6240\u6709\u7D20\u6750\u3001\u9009\u9898\u3001\u8349\u7A3F\u6570\u636E\u5B58\u50A8\u5728\u6B64\u76EE\u5F55"),
      h("div", {
        style: {
          padding: "10px 14px",
          borderRadius: 8,
          background: "var(--dsw-alias-bg-l1, #f7f7f7)",
          fontFamily: "monospace",
          fontSize: 13,
          wordBreak: "break-all",
          color: "var(--dsw-alias-label-primary, #333)"
        }
      }, data.dataDir)
    ),
    h(
      "div",
      { className: "dsw-card", style: { marginTop: 16 } },
      h("div", { className: "dsw-card-title" }, "\u{1F464} \u521B\u4F5C\u8005\u753B\u50CF"),
      h("div", { className: "dsw-card-subtitle" }, "\u8BBE\u5B9A\u4F60\u7684\u521B\u4F5C\u65B9\u5411\uFF0CAI \u4F1A\u636E\u6B64\u751F\u6210\u66F4\u8D34\u5408\u4F60\u7684\u5185\u5BB9"),
      h(
        "div",
        { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } },
        ...PROFILE_FIELDS.map(
          (f) => h(
            "div",
            { key: f.key, className: "dsw-form-row" },
            h("label", { className: "dsw-form-label" }, `${f.icon} ${f.label}`),
            h("input", {
              className: "dsw-input",
              value: profile[f.key],
              placeholder: f.placeholder,
              onChange: (e) => setProfile({ ...profile, [f.key]: e.target.value })
            })
          )
        )
      ),
      h(
        "div",
        { className: "dsw-form-row" },
        h("label", { className: "dsw-form-label" }, "\u{1F58A}\uFE0F \u6587\u98CE\u6307\u5357"),
        h("textarea", {
          className: "dsw-textarea",
          value: profile.voiceGuide,
          rows: 3,
          onChange: (e) => setProfile({ ...profile, voiceGuide: e.target.value }),
          placeholder: '\u63CF\u8FF0\u4F60\u7684\u5199\u4F5C\u98CE\u683C\uFF0C\u4F8B\u5982"\u8F7B\u677E\u5E7D\u9ED8\u3001\u591A\u7528\u53E3\u8BED\u5316\u8868\u8FBE\u3001\u7231\u7528\u95EE\u53E5\u548C\u611F\u53F9\u53F7"'
        })
      ),
      h(
        "div",
        { className: "dsw-form-row" },
        h("label", { className: "dsw-form-label" }, "\u{1F6AB} \u7981\u5FCC\u5185\u5BB9"),
        h("textarea", {
          className: "dsw-textarea",
          value: profile.forbidden,
          rows: 2,
          onChange: (e) => setProfile({ ...profile, forbidden: e.target.value }),
          placeholder: "\u4E0D\u8981\u51FA\u73B0\u7684\u5185\u5BB9\u6216\u8BCD\u6C47"
        })
      ),
      h(
        "div",
        { style: { display: "flex", justifyContent: "flex-end" } },
        h("button", { className: "dsw-btn dsw-btn-primary", onClick: handleSaveProfile, disabled: saving }, saving ? "\u23F3 \u4FDD\u5B58\u4E2D\u2026" : "\u{1F4BE} \u4FDD\u5B58\u753B\u50CF")
      )
    ),
    h(
      "div",
      { className: "dsw-card", style: { marginTop: 16 } },
      h(
        "div",
        { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
        h("div", { className: "dsw-card-title", style: { marginBottom: 0 } }, "\u{1F511} TikHub API Key"),
        data.tikhubConfigured ? h("span", { className: "dsw-badge dsw-badge-green" }, "\u2705 \u5DF2\u914D\u7F6E") : h("span", { className: "dsw-badge dsw-badge-red" }, "\u26A0\uFE0F \u672A\u914D\u7F6E")
      ),
      h("div", { className: "dsw-card-subtitle" }, "\u7528\u4E8E\u793E\u4EA4\u96F7\u8FBE\u529F\u80FD\uFF08\u89C6\u9891\u5206\u6790\u3001\u8D26\u53F7\u626B\u63CF\u3001\u70ED\u641C\uFF09"),
      h(
        "div",
        { style: { display: "flex", gap: 8 } },
        h("input", {
          className: "dsw-input",
          type: "password",
          value: tikKey,
          style: { flex: 1 },
          onChange: (e) => setTikKey(e.target.value),
          placeholder: "\u8F93\u5165 TikHub API Key\u2026"
        }),
        h("button", { className: "dsw-btn dsw-btn-primary", onClick: handleSaveTikKey, disabled: saving || !tikKey, style: { flexShrink: 0 } }, "\u66F4\u65B0")
      )
    ),
    h(
      "div",
      { className: "dsw-card", style: { marginTop: 16 } },
      h(
        "div",
        { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
        h("div", { className: "dsw-card-title", style: { marginBottom: 0 } }, "\u{1F916} OpenCLI \u81EA\u52A8\u53D1\u5E03"),
        data.opencliReady ? h("span", { className: "dsw-badge dsw-badge-green" }, "\u2705 \u5DF2\u5C31\u7EEA") : h("span", { className: "dsw-badge dsw-badge-red" }, "\u26A0\uFE0F \u672A\u5B89\u88C5")
      ),
      h("div", { className: "dsw-card-subtitle" }, "\u901A\u8FC7 OpenCLI \u81EA\u52A8\u5316\u53D1\u5E03\u5185\u5BB9\u5230\u5C0F\u7EA2\u4E66\u3001X/Twitter \u7B49\u5E73\u53F0"),
      !data.opencliReady && h(
        "div",
        { style: { padding: "10px 14px", borderRadius: 8, background: "var(--dsw-alias-bg-warning, rgba(255,152,0,0.08))", fontSize: 13, lineHeight: 1.7 } },
        h("div", null, "\u{1F4A1} \u5B89\u88C5\u6B65\u9AA4\uFF1A"),
        h("div", { style: { fontFamily: "monospace", marginTop: 4 } }, "npm install -g @jackwener/opencli"),
        h("div", { style: { marginTop: 4, color: "var(--dsw-alias-label-tertiary, #888)" } }, "\u5B89\u88C5\u540E\u9700\u901A\u8FC7 Chrome \u6269\u5C55\u767B\u5F55\u5BF9\u5E94\u5E73\u53F0")
      )
    ),
    h(
      "div",
      { className: "dsw-card", style: { marginTop: 16 } },
      h(
        "div",
        { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
        h("div", { className: "dsw-card-title", style: { marginBottom: 0 } }, "\u2712\uFE0F \u6587\u989C\uFF08\u516C\u4F17\u53F7\u6392\u7248 & \u53D1\u5E03\uFF09"),
        data.wenyanReady ? h("span", { className: "dsw-badge dsw-badge-green" }, "\u2705 \u5DF2\u5B89\u88C5") : h("span", { className: "dsw-badge dsw-badge-red" }, "\u26A0\uFE0F \u672A\u5B89\u88C5")
      ),
      h("div", { className: "dsw-card-subtitle" }, "Markdown \u4E00\u952E\u6392\u7248\u5E76\u63A8\u9001\u5230\u516C\u4F17\u53F7\u8349\u7A3F\u7BB1"),
      !data.wenyanReady && h(
        "div",
        { style: { padding: "10px 14px", borderRadius: 8, background: "var(--dsw-alias-bg-warning, rgba(255,152,0,0.08))", fontSize: 13, lineHeight: 1.7 } },
        h("div", null, "\u{1F4A1} \u5B89\u88C5\u6B65\u9AA4\uFF1A"),
        h("div", { style: { fontFamily: "monospace", marginTop: 4 } }, "npm install -g @wenyan-md/cli")
      ),
      data.wenyanReady && h(
        "div",
        { style: { marginTop: 8 } },
        h(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 8 } },
          h("span", null, "\u516C\u4F17\u53F7\u51ED\u636E\uFF1A"),
          data.wechatConfigured ? h("span", { className: "dsw-badge dsw-badge-green" }, "\u2705 WECHAT_APP_ID \u5DF2\u914D\u7F6E") : h("span", { className: "dsw-badge dsw-badge-red" }, "\u26A0\uFE0F \u9700\u914D\u7F6E WECHAT_APP_ID \u548C WECHAT_APP_SECRET")
        ),
        !data.wechatConfigured && h(
          "div",
          { style: { padding: "8px 14px", borderRadius: 8, background: "var(--dsw-alias-bg-warning, rgba(255,152,0,0.08))", fontSize: 12, lineHeight: 1.7, marginTop: 6 } },
          h("div", null, "\u5728 .env \u6216\u7CFB\u7EDF\u73AF\u5883\u53D8\u91CF\u4E2D\u8BBE\u7F6E\uFF1A"),
          h("div", { style: { fontFamily: "monospace" } }, "WECHAT_APP_ID=\u4F60\u7684AppID"),
          h("div", { style: { fontFamily: "monospace" } }, "WECHAT_APP_SECRET=\u4F60\u7684AppSecret")
        )
      )
    ),
    h(
      "div",
      { className: "dsw-card", style: { marginTop: 16 } },
      h("div", { className: "dsw-card-title" }, "\u{1F9E0} \u5199\u4F5C\u6A21\u578B"),
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 8 } },
        h(
          "span",
          { className: "dsw-badge dsw-badge-blue" },
          data.model ? `${data.model.provider}` : "default"
        ),
        h(
          "span",
          { style: { fontSize: 14, color: "var(--dsw-alias-label-secondary, #666)" } },
          data.model ? data.model.model : "\u4F7F\u7528 Agent \u9ED8\u8BA4\u6A21\u578B"
        )
      ),
      h(
        "div",
        { className: "dsw-card-subtitle", style: { marginTop: 8, marginBottom: 0 } },
        "\u6A21\u578B\u7531 DSH Agent \u8BBE\u7F6E\u9875\u9762\u7EDF\u4E00\u7BA1\u7406"
      )
    )
  );
};
var NAV_ITEMS = [
  { id: "dashboard", icon: "\u{1F4CA}", label: "\u6982\u89C8" },
  { id: "materials", icon: "\u{1F4DD}", label: "\u7D20\u6750" },
  { id: "topics", icon: "\u{1F4A1}", label: "\u9009\u9898" },
  { id: "drafts", icon: "\u270D\uFE0F", label: "\u8349\u7A3F" },
  { id: "calendar", icon: "\u{1F4C5}", label: "\u65E5\u5386" },
  { id: "radar", icon: "\u{1F4E1}", label: "\u96F7\u8FBE" },
  { id: "settings", icon: "\u2699\uFE0F", label: "\u8BBE\u7F6E" }
];
var TAB_COMPONENTS = {
  dashboard: DashboardPage,
  materials: MaterialsPage,
  topics: TopicsPage,
  drafts: DraftsPage,
  calendar: CalendarPage,
  radar: RadarPage,
  settings: SettingsPage
};
var Workbench = ({ onClose }) => {
  const [tab, setTab] = (0, import_react.useState)("dashboard");
  const [pageKey, setPageKey] = (0, import_react.useState)(0);
  const Page = TAB_COMPONENTS[tab];
  const switchTab = (0, import_react.useCallback)((id) => {
    if (id in TAB_COMPONENTS) {
      setTab(id);
      setPageKey((k) => k + 1);
    }
  }, []);
  (0, import_react.useEffect)(() => {
    _switchTab = switchTab;
    return () => {
      if (_switchTab === switchTab) _switchTab = null;
    };
  }, [switchTab]);
  (0, import_react.useEffect)(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  return h(
    "div",
    { className: "dsh-social-overlay" },
    h(ToastContainer, null),
    h(ConfirmDialog, null),
    h(
      "div",
      { className: "dsw-topbar" },
      h("span", { className: "dsw-topbar-title" }, "\u{1F4F1} \u81EA\u5A92\u4F53\u5DE5\u4F5C\u53F0")
    ),
    h(
      "div",
      { className: "dsw-body" },
      h(
        "nav",
        { className: "dsw-nav" },
        ...NAV_ITEMS.map(
          (item) => h(
            "button",
            {
              key: item.id,
              className: "dsw-nav-item",
              "data-active": String(tab === item.id),
              onClick: () => switchTab(item.id)
            },
            h("span", { className: "dsw-nav-icon" }, item.icon),
            h("span", null, item.label)
          )
        ),
        h("div", { style: { flex: 1 } }),
        h(
          "button",
          {
            className: "dsw-nav-item",
            style: { color: "var(--dsw-alias-label-tertiary, #999)", marginTop: 8 },
            onClick: onClose,
            title: "\u5173\u95ED\u5DE5\u4F5C\u53F0 (Esc)"
          },
          h("span", { className: "dsw-nav-icon" }, "\u2715"),
          h("span", null, "\u5173\u95ED")
        )
      ),
      h(
        "main",
        { className: "dsw-content", key: pageKey },
        h(Page, null)
      )
    )
  );
};
var SidebarButton = ({ wide }) => {
  const [open, setOpen] = (0, import_react.useState)(false);
  const close = (0, import_react.useCallback)(() => setOpen(false), []);
  (0, import_react.useEffect)(() => {
    _closeOverlay = close;
    return () => {
      if (_closeOverlay === close) _closeOverlay = null;
    };
  }, [close]);
  return h(
    "div",
    { style: { display: "contents" } },
    h(
      "button",
      {
        className: "dsw-sidebar-btn",
        onClick: (e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        },
        title: "\u81EA\u5A92\u4F53\u5DE5\u4F5C\u53F0"
      },
      h("span", { className: "dsw-sidebar-btn-icon" }, "\u{1F4F1}"),
      wide && h("span", null, "\u81EA\u5A92\u4F53\u5DE5\u4F5C\u53F0")
    ),
    open && h(Workbench, { onClose: close })
  );
};
function apply(ctx) {
  injectStyles();
  const slots = ctx.slots;
  slots.inject("sidebar.footer.action", () => {
    return slots.register(
      { name: "sidebar.footer.action", id: "dsh-social" },
      SidebarButton
    );
  });
}
    return module.exports;
  }
});
//# sourceMappingURL=client.js.map
