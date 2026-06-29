# Mineradio Tauri Rewrite Release Notes

## Identity

Mineradio Tauri Rewrite is a GPL-3.0 fork/rewrite published from `zzstar101/Mineradio`.

This release is not an official Netease Cloud Music, QQ Music, or original Mineradio release. Netease Cloud Music and QQ Music remain third-party service providers accessed through user-provided credentials and provider APIs.

## Update Channel

This Tauri line uses the new GitHub Releases channel under `zzstar101/Mineradio`.

It does not migrate or reuse the old Electron patch JSON updater path, old Electron release channel, or old Electron installer flow.

Signed Tauri updater installation is enabled for this line. The app can download and install signed update artifacts from `zzstar101/Mineradio` when the release manifest provides matching signatures.

## Release Notes Body

- Summarize user-visible fixes and parity work for this release.
- List known limitations that are still blocked by release assets, provider credentials, or manual Windows validation.
- If AI depth is enabled in the build, disclose that it downloads `@xenova/transformers@2.17.2` from jsDelivr and `Xenova/depth-anything-small-hf` from HuggingFace; inference runs locally in WebView2 and cover images are not uploaded to the model provider.
- Do not describe this project as an official Netease Cloud Music, QQ Music, or original Mineradio distribution.
