# Mineradio Tauri Rewrite 贡献指南

感谢参与贡献。本项目是迁移中的桌面应用，范围清晰、证据明确的小 PR 会比大范围重写更容易 review 和合并。

## 开始之前

1. 先读本文件。
2. 通过 `README.md` 了解项目状态和整体架构。
3. 修改子模块前，阅读对应目录的 `AGENTS.md`：
   - `apps/web/AGENTS.md`
   - `apps/desktop/src-tauri/AGENTS.md`
   - `sidecars/api/AGENTS.md`
   - `packages/visual-engine/AGENTS.md`
4. 涉及迁移或发布行为时，阅读 `docs/migration/DECISIONS.md` 和 `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`。
5. 涉及依赖或 provider 时，阅读 `docs/migration/LICENSE_GATE.md`。

不要从 `public/index.html`、`desktop/` 或 `server.js` 的旧实现直接推断新架构。这些文件保留为 Electron baseline 参考，不是新的 Tauri 运行时结构。

## 适合贡献的内容

推荐贡献：

- shared zod schema、typed API contract 和回归测试。
- sidecar provider adapter 修复，并配套 fake-network 测试。
- 范围明确、可截图或可测试验证的 React UI parity 任务。
- 保持 baseline 动效、手感和渲染质量的 visual-engine 迁移。
- 带 Rust 测试和运行说明的 Tauri command、窗口、updater 改动。
- 澄清当前迁移状态的文档，不把未验收能力写成已发布。
- 防止 app identity、updater、license、privacy 或 packaging 回退的 policy check。

不要在一个 PR 里混做：

- 大块重写 `public/index.html`。
- 同时修改 provider、视觉、installer 和 updater。
- 未经迁移计划要求移动 legacy baseline 文件。
- 未完成 license review 就新增依赖。
- 没有证据就声明 parity 或 release gate 已完成。

## 开发环境

在仓库根目录安装依赖：

```bash
bun install
```

启动应用：

```bash
bun run tauri:dev
```

构建前端：

```bash
bun run web:build
```

启动 sidecar API：

```bash
bun run sidecar:dev
```

构建桌面应用：

```bash
bun run tauri:build
```

新主线使用 Bun workspace 脚本。不要用旧 Electron 的 `npm start`、`npm run build:win` 或 electron-builder 流程验收 Tauri 工作。

## 代码分区

| 区域 | 路径 | 说明 |
| --- | --- | --- |
| 桌面壳 | `apps/desktop/` | Tauri/Rust 窗口、命令、sidecar 生命周期和 updater |
| 前端界面 | `apps/web/` | React/Zustand app shell 和用户控件 |
| 共享契约 | `packages/shared/` | zod schema 和跨层类型 |
| 视觉引擎 | `packages/visual-engine/` | Canvas/WebGL/GSAP lifecycle 和 parity 逻辑 |
| 本地服务 | `sidecars/api/` | provider adapter、音频代理、诊断和本地 API |
| 迁移文档 | `docs/migration/` | 决策、发布门禁、parity checklist 和计划 |
| Electron baseline | `public/`、`desktop/`、`server.js` | 仅作参考，除非任务明确要求修改 legacy 行为 |

## 验证命令

按你修改的区域运行对应检查。

共享契约：

```bash
bun test packages/shared
bun run --filter ./packages/shared typecheck
```

Sidecar API：

```bash
bun test sidecars/api
bun run --filter ./sidecars/api typecheck
```

视觉引擎：

```bash
bun test packages/visual-engine
bun run --filter ./packages/visual-engine typecheck
```

前端界面：

```bash
bun test apps/web
bun run --filter ./apps/web typecheck
bun run web:build
```

桌面壳：

```bash
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
bun run tauri:build
```

仓库基础检查：

```bash
git diff --check
```

如果改动涉及 legacy Electron 参考文件，还需要运行：

```bash
node --check server.js
```

## 策略门禁

改到相关区域时运行对应 policy check：

```bash
bun run tauri-stack-policy:check
bun run app-data-policy:check
bun run sidecar-runtime-policy:check
bun run main-flow-policy:check
bun run release-identity:check
bun run release-csp:check
bun run installer-policy:check
bun run updater-policy:check
bun run release-notes-policy:check
bun run license:check
bun run license-transitive:check
bun run packaged-notices:check
```

如果 policy check 失败，要修复回退点；只有规则本身确实过时，才应在 PR 中解释并更新规则。

## 视觉对齐规则

视觉改动必须保持 Electron baseline，除非迁移决策明确要求改变。

- 不要为了性能牺牲玻璃、粒子、歌词、歌单架或控制台质感。
- 不要为了小 UI 改动重写大块视觉系统。
- 不要在没有对比证据时替换 baseline timing 或交互手感。
- 能写测试的 visual-engine lifecycle 逻辑要补 focused test。
- 用户可见的视觉改动需要在 PR 中附截图或录屏说明。

代码完成不等于 release gate 完成。`docs/migration/CAPABILITY_PARITY_CHECKLIST.md` 中的视觉 parity 行仍需要 WebView2 截图、录屏或手动证据。

## Provider 和数据规则

- 不要提交 cookies、tokens、二维码登录载荷、用户账号数据、下载媒体或生成的 app data。
- diagnostics 不得暴露 `MUSIC_U`、`qm_keyst`、`qqmusic_key`、`wxskey` 等 cookie-like 字段。
- provider 响应应通过 shared zod schema 验证。
- 跨 provider fallback 属于 sidecar service 逻辑，不要塞进 React UI 分支。
- 新 provider 依赖必须先完成 license review。
- 不要加入绕过付费、会员、DRM、版权限制或平台条款的能力。

## 依赖规则

新增依赖前：

1. 确认确实需要它。
2. 检查 license 和 transitive risk。
3. 如果进入发布面，更新 `docs/migration/LICENSE_GATE.md`。
4. 运行相关 license check。

不要添加闭源、license 不清晰、无 license 或 GPL-3.0 不兼容的依赖。

## 文档规则

- `README.md` 是项目介绍，不是完整贡献手册。
- 本文件只写贡献流程、验证和协作规则。
- 任务改变 gate 状态或证据时，更新 `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`。
- 能力被隐藏、延期或按决策移除时，更新 `docs/migration/DEFERRED_CAPABILITIES.md`。
- 依赖、provider、packaging 或 notices 变化时，更新 `docs/migration/LICENSE_GATE.md`。
- 没有真实证据时，不要把 unchecked release gate 写成完成。

## PR 检查清单

发 PR 前确认：

- PR 只有一个清晰目标。
- 描述了修改区域和风险。
- 列出了已运行的 focused tests 或 checks。
- 涉及视觉、播放、登录、updater、installer 或 Windows runtime 行为时，附上手动证据。
- 没有提交凭证、cookies、本地 app data 或包含隐私信息的生成日志。
- 新依赖已记录并通过 license review。
- release/parity checklist 只在证据充分时更新。

## 发布相关贡献

普通功能 PR 不应直接发布 release。

发布工作必须遵守当前迁移门禁：

- `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`
- `docs/migration/LICENSE_GATE.md`
- `docs/migration/release-notes-template.md`

公开分发需要 Windows 安装/启动/卸载证据、updater manifest/signature 证据、packaged notices 验证和最终 license review。
