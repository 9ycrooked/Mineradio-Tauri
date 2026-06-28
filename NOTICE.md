# NOTICE

Mineradio Tauri Rewrite 是基于原 Mineradio 的 GPL-3.0 二开迁移项目。本 notice 用于说明 fork 身份、原项目归属、第三方服务边界，以及旧 Electron 发布线和新 Tauri 主线的区别。

## Fork And Original Project

原 Mineradio 由 XxHuberrr 主要设计与打造。原项目的名称、MR Logo、界面视觉设计、启动动画方向、粒子视觉体验、电影镜头系统和其他原创表达归原作者所有。

本仓库的新 Tauri 主线是修改后的 fork/rewrite，不是原作者官方发布的旧 Electron 版本。二开主线继续采用 GPL-3.0 授权，并保留原作者、原项目和修改来源说明。

## Electron Baseline And Tauri Mainline

旧 Electron/Node/单体 HTML 代码仍保留为视觉和行为 baseline，用于迁移对照。新 Tauri 主线目标栈为 `Tauri 2 + Rust + WebView2`、Bun workspace、`Vite + TypeScript + React + Zustand`、Bun sidecar runtime、shared types + zod 和 Tauri updater。

新 Tauri 主线使用新的 app id、数据目录、仓库和 updater channel，不承诺读取或自动迁移旧 Electron 安装用户数据。旧 Electron updater、轻量 patch JSON 和 NSIS 发布流程不会迁入新 Tauri 主线。

## Third-party Services

Mineradio Tauri Rewrite 可能与网易云音乐、QQ 音乐等第三方音乐服务进行用户自有账号相关的本地客户端交互。

本项目不是网易云音乐、QQ 音乐或腾讯音乐娱乐集团的官方客户端，也不隶属于任何音乐平台。用户应自行遵守对应平台的服务协议、版权规则和会员权益规则。本项目不会提供绕过付费、绕过会员、破解音质或重新分发音乐内容的能力。

## Third-party Notices

当前 Tauri 迁移主线的直接依赖、关键技术、用途和 license gate 状态记录在 `THIRD_PARTY_NOTICES.md` 与 `docs/migration/LICENSE_GATE.md`。公开分发前必须完成所有待审核项，并确保安装包包含必要 license/notice 文件。

## Acknowledgements

emily 作为 Mineradio 早期视觉底层想法与 `emily` 视觉预设改进方向的共创者和灵感来源之一，特此致谢。

感谢小天才e宝、应春日、锋将军、軌跡、林中、骊、风痕、花椰菜在早期体验、测试反馈和发布准备中的帮助。
