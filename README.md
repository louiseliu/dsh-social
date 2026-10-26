# 📱 DSH Social — 自媒体工作台

> **DSH (DeepSeek Harness)** 插件 — AI 驱动的自媒体内容创作、管理、发布全流程工具

[![dsh-plugin](https://img.shields.io/badge/DSH-Plugin-blue)](https://github.com/deepseek-ai/dsh)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## ✨ 功能概览

### 📊 工作台仪表盘
- 内容流水线漏斗：素材 → 选题 → 写作 → 审核 → 发布
- 8 个可点击快捷操作卡片
- 爆款提醒、即将发布提醒

### 📝 素材库
- 收集、整理、分类创作素材
- 点击展开预览完整内容
- 🤖 AI 分析 → 一键发送到 DSH 对话

### 💡 选题管理
- 四状态管理：新 → 计划中 → 已起稿 → 已放弃
- 切入角度、钩子、目标受众
- ✍️ AI 起草 → 一键发送到 DSH 对话

### ✍️ 草稿箱
- 多平台版本（小红书 / 抖音 / 公众号 / B站 / 视频号 / X）
- 发布前 6 维度 AI 体检（共鸣 / AI味 / 违规 / 口播 / 标题封面 / 传播）
- 多平台内容预览（公众号 / 小红书 / 抖音 / X 模拟视图）
- 🤖 AI 工具箱：润色 / 重写 / 扩写 / 精简 / 爆款标题 / 内容评分 / 全平台改写

### 📅 内容日历
- 月度日历视图
- 按日期展示各状态草稿（颜色编码）
- 发布/待发布月度统计

### 📡 社交雷达
- 多平台热搜聚合（抖音 / B站 / 知乎）
- 视频数据分析
- 对标账号扫描与爆款检测
- TikHub API / OpenCLI 双引擎（TikHub 未配置时自动降级到 OpenCLI）

### 🚀 自动发布
- **OpenCLI** — 小红书、X/Twitter 自动发布（智能节流 20-35s 随机间隔）
- **文颜 (wenyan)** — 公众号 Markdown 排版 + 一键推送草稿箱

### ⚙️ 设置
- 创作者画像（赛道、受众、文风、禁忌）
- 工作空间目录选择（原生 OS 文件夹选择器）
- TikHub / OpenCLI / 文颜 状态监控
- 写作模型配置

---

## 🤖 AI 工具（DSH Agent 可调用）

| 工具 | 描述 |
|------|------|
| `social_topic_extract` | 从素材中提炼选题 |
| `social_draft_write` | AI 起稿（指定平台） |
| `social_draft_check` | 发布前 6 维体检 |
| `social_draft_adapt` | 多平台改写 |
| `social_title_gen` | 🔥 爆款标题生成器（7大公式，10个候选） |
| `social_content_score` | 📊 内容综合评分（6维度，0-100分） |
| `social_weekly_plan` | 📆 7天内容发布策略 |
| `social_adapt_all` | 🌐 一键全平台改写 |
| `social_publish` | 🚀 通过 OpenCLI 发布到平台 |
| `social_trending` | 📈 多平台热搜聚合 |
| `social_xhs_search` | 🔍 小红书搜索 |
| `social_wechat_render` | ✒️ Markdown → 公众号 HTML |
| `social_wechat_publish` | 📮 推送到公众号草稿箱 |
| `social_radar_hot` | 🔥 平台热搜 |
| `social_radar_video` | 📊 视频数据分析 |
| `social_radar_scan` | 👀 账号扫描 |

---

## 🔧 安装

### 前置要求

- [DSH Desktop](https://github.com/deepseek-ai/dsh) >= v0.2.1
- Node.js >= 18

### 安装插件

```bash
# 在 DSH Desktop 设置 → 插件 中搜索 dsh-social
# 或手动安装：
cd ~/.dsh/plugins
git clone https://github.com/louiseliu/dsh-social.git
cd dsh-social
npm install && npm run build
```

### 可选工具

```bash
# OpenCLI — 自动化发布
npm install -g @jackwener/opencli

# 文颜 — 公众号排版
npm install -g @wenyan-md/cli
```

### 环境变量（可选）

```bash
# TikHub API（社交雷达增强）
export TIKHUB_API_KEY=your_key

# 微信公众号（文颜发布）
export WECHAT_APP_ID=your_app_id
export WECHAT_APP_SECRET=your_app_secret
```

---

## 🏗️ 架构

```
src/
├── index.ts          # Host 插件入口（AI 工具 + HTTP API）
├── client.ts         # 浏览器工作台 UI（React + createElement）
├── config.ts         # 插件配置 Schema
├── store.ts          # JSON 文件存储
├── opencli.ts        # OpenCLI Bridge（自动发布 + 数据采集）
├── wenyan.ts         # 文颜 CLI Bridge（公众号排版 + 发布）
├── tikhub.ts         # TikHub API 客户端
└── shared/
    └── types.ts      # 共享类型定义
```

### 技术栈

- **框架**: [Cordis](https://github.com/cordiverse/cordis) 插件系统
- **UI**: React `createElement`（无 JSX，纯 TS）
- **构建**: esbuild
- **存储**: 单文件 JSON（原子写入）
- **AI**: DSH LLM API（DeepSeek / 兼容模型）

---

## 📝 灵感来源

本项目借鉴了以下优秀开源项目的思路：

- [Easel](https://github.com/ZJU-REAL/Easel) — 5 层内容工作流 + quality-gate
- [AIWriteX](https://github.com/iniwap/AIWriteX) — 全网热点雷达 + AI 多智能体写作
- [Beav](https://github.com/Jamailar/Beav) — 小红书 AI 运营工作台
- [墨痕 (mohen)](https://github.com/cxzxx783/mohen) — 去 AI 味写作全流程
- [SocialSpark AI](https://github.com/bikram73/SocialSpark_AI) — 7 天内容策略
- [Wechatsync](https://github.com/wechatsync/Wechatsync) — 多平台一键同步
- [MediaCrawler](https://github.com/NanmiCoder/MediaCrawler) — 多平台数据采集

---

## 📄 License

MIT
