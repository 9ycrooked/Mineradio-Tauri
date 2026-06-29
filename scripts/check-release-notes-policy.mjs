import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const FILES = {
  releaseNotesTemplate: "docs/migration/release-notes-template.md",
  licenseGate: "docs/migration/LICENSE_GATE.md"
};

export function extractReleaseNotesPolicy(input) {
  return {
    releaseNotesTemplate: input?.releaseNotesTemplate ?? "",
    licenseGate: input?.licenseGate ?? ""
  };
}

export function evaluateReleaseNotesPolicy(policy) {
  const errors = [];
  const releaseNotes = String(policy?.releaseNotesTemplate ?? "");
  const licenseGate = String(policy?.licenseGate ?? "");

  if (!releaseNotes.includes("Mineradio Tauri Rewrite")) {
    errors.push("release notes must name Mineradio Tauri Rewrite");
  }
  if (!releaseNotes.includes("GPL-3.0") || !/(fork|rewrite|二开|重写)/i.test(releaseNotes)) {
    errors.push("release notes must state GPL-3.0 fork/rewrite identity");
  }
  if (!/not\s+(?:an\s+)?official[^.\n]*Netease Cloud Music/i.test(releaseNotes) && !/非官方[^。\n]*网易云音乐/.test(releaseNotes)) {
    errors.push("release notes must state this is not an official Netease Cloud Music release");
  }
  if (!/not\s+(?:an\s+)?official[^.\n]*QQ Music/i.test(releaseNotes) && !/非官方[^。\n]*QQ\s*音乐/.test(releaseNotes)) {
    errors.push("release notes must state this is not an official QQ Music release");
  }
  if (!/not\s+(?:an\s+)?official[^.\n]*original Mineradio/i.test(releaseNotes) && !/非官方[^。\n]*原\s*Mineradio/.test(releaseNotes)) {
    errors.push("release notes must state this is not an official original Mineradio release");
  }
  if (!releaseNotes.includes("zzstar101/Mineradio")) {
    errors.push("release notes must mention zzstar101/Mineradio release channel");
  }
  if (!/(does not|will not|不会|不).*old Electron patch JSON|旧\s*Electron[^。\n]*patch JSON/i.test(releaseNotes)) {
    errors.push("release notes must state old Electron patch JSON updater is not migrated");
  }
  const hasDetectionOnlyUpdater =
    /detection-only/i.test(releaseNotes) &&
    /(will not|does not|不会|不)[^.\n。]*(download|install|下载|安装)/i.test(releaseNotes);
  const hasSignedUpdater =
    /(signed|签名)[^.\n。]*(updater|更新)/i.test(releaseNotes) &&
    /(download|install|下载|安装)/i.test(releaseNotes);
  if (!hasDetectionOnlyUpdater && !hasSignedUpdater) {
    errors.push("release notes must state either signed updater install is enabled or unsigned builds are detection-only");
  }
  if (!licenseGate.includes("release-notes-policy:check")) {
    errors.push("LICENSE_GATE.md must mention release-notes-policy:check");
  }

  return { ok: errors.length === 0, errors };
}

export function checkReleaseNotesPolicy(rootDir = process.cwd()) {
  return evaluateReleaseNotesPolicy(extractReleaseNotesPolicy({
    releaseNotesTemplate: readRequired(rootDir, FILES.releaseNotesTemplate),
    licenseGate: readRequired(rootDir, FILES.licenseGate)
  }));
}

function readRequired(rootDir, relativePath) {
  const path = resolve(rootDir, relativePath);
  if (!existsSync(path)) throw new Error(`${relativePath} is missing`);
  return readFileSync(path, "utf8");
}

if (import.meta.main) {
  const result = checkReleaseNotesPolicy(process.cwd());
  if (!result.ok) {
    console.error("Release notes policy check failed:");
    for (const error of result.errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log("Release notes policy check passed.");
}
