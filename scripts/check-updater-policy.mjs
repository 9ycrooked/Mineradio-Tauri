import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const FILES = {
  tauriConfig: "apps/desktop/src-tauri/tauri.conf.json",
  rustUpdater: "apps/desktop/src-tauri/src/updater.rs",
  rustCommands: "apps/desktop/src-tauri/src/commands.rs",
  webUpdater: "apps/web/src/tauri/updater.ts",
  updateHost: "apps/web/src/components/shell/UpdateHost.tsx",
  updateStore: "apps/web/src/stores/update-store.ts",
  licenseGate: "docs/migration/LICENSE_GATE.md"
};

const INSTALL_COMMAND_PATTERN = /\b(download|install|restart)_?(update|updater)\b|\bupdate_(download|install|restart)\b/i;
const WEB_INSTALL_HELPER_PATTERN = /\b(download|install|restart)(Update|Updater)\b|\b(updateDownload|updateInstall|updateRestart)\b/;

export function extractUpdaterPolicy(input) {
  return {
    endpoints: input?.tauriConfig?.plugins?.updater?.endpoints,
    pubkey: input?.tauriConfig?.plugins?.updater?.pubkey,
    createUpdaterArtifacts: input?.tauriConfig?.bundle?.createUpdaterArtifacts,
    rustUpdater: input?.rustUpdater ?? "",
    rustCommands: input?.rustCommands ?? "",
    webUpdater: input?.webUpdater ?? "",
    updateHost: input?.updateHost ?? "",
    updateStore: input?.updateStore ?? "",
    licenseGate: input?.licenseGate ?? ""
  };
}

export function evaluateUpdaterPolicy(policy) {
  const errors = [];
  const endpoints = Array.isArray(policy?.endpoints) ? policy.endpoints : [];
  const pubkey = String(policy?.pubkey ?? "");
  const unsigned = pubkey.trim() === "";

  if (!endpoints.some((endpoint) => String(endpoint).includes("zzstar101/Mineradio"))) {
    errors.push("updater endpoint must stay on zzstar101/Mineradio release channel");
  }

  if (unsigned) {
    const detectionOnlyMarkers = [
      policy.rustUpdater,
      policy.webUpdater,
      policy.updateHost,
      policy.updateStore,
      policy.licenseGate
    ].join("\n");
    if (
      !detectionOnlyMarkers.includes("signature-key-missing") ||
      !detectionOnlyMarkers.includes("signatureGate") ||
      !detectionOnlyMarkers.includes("detection-only")
    ) {
      errors.push("unsigned updater policy must keep tauri updater pubkey empty only in detection-only mode");
    }
    if (INSTALL_COMMAND_PATTERN.test(policy.rustCommands)) {
      errors.push("Rust commands must not expose updater download/install commands while pubkey is empty");
    }
    if (WEB_INSTALL_HELPER_PATTERN.test(policy.webUpdater)) {
      errors.push("web updater bridge must not expose download/install helpers while pubkey is empty");
    }
    if (
      !policy.updateHost.includes("暂不可安装") ||
      !policy.updateHost.includes("签名密钥未配置") ||
      !policy.updateHost.includes("不会下载或安装更新")
    ) {
      errors.push("UpdateHost must show the signature-key-missing non-installable copy");
    }
    if (!policy.rustUpdater.includes("UPDATER_INSTALL_STATE_SIGNATURE_KEY_MISSING")) {
      errors.push("Rust updater status must expose signature-key-missing install state");
    }
  } else {
    const rustText = `${policy.rustUpdater}\n${policy.rustCommands}`;
    if (policy.createUpdaterArtifacts !== true) {
      errors.push("signed updater policy requires bundle.createUpdaterArtifacts=true");
    }
    if (!policy.rustCommands.includes("install_update")) {
      errors.push("signed updater policy requires Rust install_update command");
    }
    if (!rustText.includes("download_and_install")) {
      errors.push("signed updater policy requires Rust updater download_and_install path");
    }
    if (!policy.webUpdater.includes("installUpdate")) {
      errors.push("signed updater policy requires web installUpdate helper");
    }
    if (!policy.updateHost.includes("下载并安装")) {
      errors.push("signed updater policy requires UpdateHost install copy");
    }
    if (!policy.licenseGate.includes("signed-install")) {
      errors.push("LICENSE_GATE.md must record signed-install updater policy");
    }
  }

  return { ok: errors.length === 0, errors };
}

export function checkUpdaterPolicy(rootDir = process.cwd()) {
  const tauriConfig = JSON.parse(readRequired(rootDir, FILES.tauriConfig));
  return evaluateUpdaterPolicy(extractUpdaterPolicy({
    tauriConfig,
    rustUpdater: readRequired(rootDir, FILES.rustUpdater),
    rustCommands: readRequired(rootDir, FILES.rustCommands),
    webUpdater: readRequired(rootDir, FILES.webUpdater),
    updateHost: readRequired(rootDir, FILES.updateHost),
    updateStore: readRequired(rootDir, FILES.updateStore),
    licenseGate: readRequired(rootDir, FILES.licenseGate)
  }));
}

function readRequired(rootDir, relativePath) {
  const path = resolve(rootDir, relativePath);
  if (!existsSync(path)) throw new Error(`${relativePath} is missing`);
  return readFileSync(path, "utf8");
}

if (import.meta.main) {
  const result = checkUpdaterPolicy(process.cwd());
  if (!result.ok) {
    console.error("Updater policy check failed:");
    for (const error of result.errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log("Updater policy check passed.");
}
