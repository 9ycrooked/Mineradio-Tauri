import { describe, expect, test } from "bun:test";

import {
  evaluateUpdaterPolicy,
  extractUpdaterPolicy
} from "./check-updater-policy.mjs";

describe("updater policy check", () => {
  test("extracts updater config and implementation text needed for the detection-only gate", () => {
    const policy = extractUpdaterPolicy({
      tauriConfig: {
        plugins: {
          updater: {
            endpoints: ["https://github.com/zzstar101/Mineradio/releases/latest/download/latest.json"],
            pubkey: ""
          }
        }
      },
      rustUpdater: "signature-key-missing ready-to-download has_updater_public_key",
      rustCommands: "check_for_update get_updater_status",
      webUpdater: "signature-key-missing checkForUpdate getUpdaterStatus",
      updateHost: "暂不可安装 签名密钥未配置 当前构建不会下载或安装更新",
      updateStore: "signatureGate installState",
      licenseGate: "updater signature/release artifact relation detection-only"
    });

    expect(policy.pubkey).toBe("");
    expect(policy.endpoints).toEqual(["https://github.com/zzstar101/Mineradio/releases/latest/download/latest.json"]);
    expect(policy.rustCommands).toContain("check_for_update");
  });

  test("passes when a signed updater build exposes install through Rust and web", () => {
    const result = evaluateUpdaterPolicy({
      pubkey: "public-key",
      createUpdaterArtifacts: true,
      endpoints: ["https://github.com/zzstar101/Mineradio/releases/latest/download/latest.json"],
      rustUpdater: "ready-to-download download_and_install",
      rustCommands: "check_for_update get_updater_status install_update",
      webUpdater: "checkForUpdate getUpdaterStatus installUpdate",
      updateHost: "下载并安装",
      updateStore: "signatureGate installState",
      licenseGate: "updater signature/release artifact relation signed-install"
    });

    expect(result).toEqual({ ok: true, errors: [] });
  });

  test("fails signed updater policy when install artifacts or commands are missing", () => {
    const result = evaluateUpdaterPolicy({
      pubkey: "public-key",
      createUpdaterArtifacts: false,
      endpoints: ["https://github.com/zzstar101/Mineradio/releases/latest/download/latest.json"],
      rustUpdater: "ready-to-download",
      rustCommands: "check_for_update get_updater_status",
      webUpdater: "checkForUpdate getUpdaterStatus",
      updateHost: "检查更新",
      updateStore: "signatureGate installState",
      licenseGate: "release artifact relation"
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("signed updater policy requires bundle.createUpdaterArtifacts=true");
    expect(result.errors).toContain("signed updater policy requires Rust install_update command");
    expect(result.errors).toContain("signed updater policy requires Rust updater download_and_install path");
    expect(result.errors).toContain("signed updater policy requires web installUpdate helper");
    expect(result.errors).toContain("signed updater policy requires UpdateHost install copy");
    expect(result.errors).toContain("LICENSE_GATE.md must record signed-install updater policy");
  });

  test("fails if unsigned updater builds can expose install/download behavior", () => {
    const result = evaluateUpdaterPolicy({
      pubkey: "",
      endpoints: ["https://github.com/zzstar101/Mineradio/releases/latest/download/latest.json"],
      rustUpdater: "ready-to-download",
      rustCommands: "check_for_update download_update install_update",
      webUpdater: "downloadUpdate installUpdate",
      updateHost: "下载并安装",
      updateStore: "signatureGate",
      licenseGate: ""
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("unsigned updater policy must keep tauri updater pubkey empty only in detection-only mode");
    expect(result.errors).toContain("Rust commands must not expose updater download/install commands while pubkey is empty");
    expect(result.errors).toContain("web updater bridge must not expose download/install helpers while pubkey is empty");
    expect(result.errors).toContain("UpdateHost must show the signature-key-missing non-installable copy");
  });
});
