# Mineradio Tauri Rewrite

Mineradio Tauri Rewrite 是 Mineradio 的 GPL-3.0 二开迁移主线，目标是把原 Electron/Node/单体 HTML 桌面音乐播放器迁移到 `Tauri 2 + Rust + WebView2`、Bun workspace、`Vite + TypeScript + React + Zustand`、Bun sidecar runtime、shared types + zod 和 Tauri updater。

本仓库使用新的 fork/release identity：公开仓库与 updater channel 指向 `zzstar101/Mineradio`。旧 Electron 代码仍作为视觉、交互和能力参考基线保留，但不是 Tauri 主线的运行时兼容对象。

## 项目状态

当前 Tauri 主线仍在迁移中，尚未达到公开发布条件。

- Electron baseline 只作为对照参考，不作为新主线入口。
- Tauri 主线使用新的 app id、数据目录、仓库和 updater channel。
- 旧 Electron 安装用户数据不会被自动读取或迁移。
- 公开发布前必须完成 capability parity、Windows 安装/更新/卸载、视觉对齐和 license gate。
- 旧 Electron updater、轻量 patch JSON 和 NSIS 发布流程不会迁入 Tauri 主线。

迁移状态以 `docs/migration/CAPABILITY_PARITY_CHECKLIST.md` 为准。

## 功能方向

- 多平台音乐搜索、播放、歌词和歌单能力迁移。
- Netease 与 QQ provider adapter，统一 typed API 和错误 envelope。
- 本地 Bun sidecar，负责 provider、音乐 API、音频代理、天气、缓存和诊断。
- Tauri/Rust 桌面壳，负责窗口、系统能力、登录 webview、sidecar 生命周期和 updater。
- React + Zustand 前端壳，承接搜索、队列、播放控制、登录、更新弹窗和视觉控制台。
- Canvas/WebGL/GSAP visual engine，迁移原 Mineradio 的玻璃控制台、粒子舞台、歌词舞台和 3D 歌单架体验。
- Tauri updater 发布通道，替代旧 Electron patch JSON 更新链路。

## 架构概览

```text
apps/
  desktop/          Tauri 2 Rust app
  web/              Vite + React + TypeScript UI
packages/
  shared/           zod schemas and shared types
  visual-engine/    Canvas/WebGL/GSAP imperative visual engine
sidecars/
  api/              Bun local provider and media API
public/, desktop/,
server.js           Electron baseline reference only
docs/migration/     migration plan, gates, decisions and parity records
```

核心设计文档：

- `docs/migration/PRD_TAURI_REWRITE.md`
- `docs/migration/MIGRATION_TAURI_PLAN.md`
- `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`
- `docs/migration/DEFERRED_CAPABILITIES.md`
- `docs/migration/LICENSE_GATE.md`
- `docs/migration/DECISIONS.md`

## 快速开始

需要先准备：

- Bun
- Rust stable toolchain
- 当前系统对应的 Tauri 2 构建环境
- Windows 10/11 + WebView2，用于接近发布质量的运行验证

安装依赖：

```bash
bun install
```

启动 Tauri 开发环境：

```bash
bun run tauri:dev
```

构建前端：

```bash
bun run web:build
```

单独启动 sidecar API：

```bash
bun run sidecar:dev
```

构建桌面应用：

```bash
bun run tauri:build
```

不要用旧 Electron 命令验收 Tauri 主线。`npm start`、`npm run build:win` 和 electron-builder 配置属于 legacy baseline 流程，不是新 Tauri 主线发布验收。

## 开发检查

日常开发常用检查：

```bash
bun test packages/shared
bun test sidecars/api
bun test packages/visual-engine
bun test apps/web
bun run --filter ./apps/web typecheck
bun run web:build
git diff --check
```

策略和发布门禁检查：

```bash
bun run tauri-stack-policy:check
bun run app-data-policy:check
bun run installer-policy:check
bun run release-identity:check
bun run license:check
bun run license-transitive:check
bun run packaged-notices:check
bun run release-csp:check
bun run updater-policy:check
```

如果改动涉及 legacy Electron 参考文件，还需要运行：

```bash
node --check server.js
```

## 参与贡献

当前项目仍处于迁移期，欢迎贡献小范围、可验证的改动。提交 PR 前请阅读 `CONTRIBUTING.md`，其中包含仓库边界、验证命令、provider 规则、视觉对齐要求和发布门禁说明。

适合优先处理的任务通常包括 shared schema、sidecar 测试、策略检查、文档修正，或范围清晰的 UI parity 小任务。大型视觉、provider、updater 或 installer 改动建议先从 issue 或迁移计划条目开始。

## 第三方平台说明

Mineradio Tauri Rewrite 不是网易云音乐、QQ 音乐、腾讯音乐娱乐集团或任何第三方音乐平台的官方客户端。

项目中的第三方平台接入仅用于个人学习、本地桌面客户端体验，以及在平台规则允许范围内辅助用户使用自有账号播放内容。不要使用本项目绕过付费、会员、版权、DRM、音质限制或平台条款。

## 隐私

登录 Cookie、搜索历史、自定义封面、自定义歌词、节奏分析缓存和诊断数据应保留在用户本机。不要提交 cookies、tokens、个人账号数据、本地 app data 目录，或包含隐私信息的生成日志。

当前隐私说明见 `PRIVACY.md`。

## 许可

Mineradio Tauri Rewrite 使用 GPL-3.0 发布。详见 `LICENSE`、`NOTICE.md` 和 `THIRD_PARTY_NOTICES.md`。

原 Mineradio 由 XxHuberrr 主要设计与打造。Mineradio 名称、MR Logo、界面设计和原创视觉表达继续归属并署名原作者。本 fork/rewrite 通过 `Mineradio Tauri Rewrite` 产品名、`com.mineradio.fork.tauri` app id 和 `zzstar101/Mineradio` 发布通道保持清晰的修改版身份。
