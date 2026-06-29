import { describe, expect, test } from "bun:test";

import {
  evaluateReleaseNotesPolicy,
  extractReleaseNotesPolicy
} from "./check-release-notes-policy.mjs";

const COMPLIANT_TEMPLATE = `
# Mineradio Tauri Rewrite Release Notes

Mineradio Tauri Rewrite is a GPL-3.0 fork/rewrite distributed from zzstar101/Mineradio.
This release is not an official Netease Cloud Music, QQ Music, or original Mineradio release.
It does not migrate or reuse the old Electron patch JSON updater path.
Because the Tauri updater public key/signature is not configured, this build is detection-only and will not download or install updates.
`;

describe("release notes policy check", () => {
  test("extracts release note template and gate text needed for public-release wording", () => {
    const policy = extractReleaseNotesPolicy({
      releaseNotesTemplate: COMPLIANT_TEMPLATE,
      licenseGate: "release notes wording release-notes-policy:check code-side guard"
    });

    expect(policy.releaseNotesTemplate).toContain("Mineradio Tauri Rewrite");
    expect(policy.licenseGate).toContain("release-notes-policy:check");
  });

  test("passes when release notes clearly state fork identity, non-affiliation, GPL, repo, and detection-only updater limits", () => {
    const result = evaluateReleaseNotesPolicy({
      releaseNotesTemplate: COMPLIANT_TEMPLATE,
      licenseGate: "release notes wording release-notes-policy:check code-side guard"
    });

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("fails when release notes omit non-affiliation and fork/license wording", () => {
    const result = evaluateReleaseNotesPolicy({
      releaseNotesTemplate: `
# Mineradio Release

Official Mineradio build with music service integration.
`,
      licenseGate: "release notes wording"
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("release notes must name Mineradio Tauri Rewrite");
    expect(result.errors).toContain("release notes must state GPL-3.0 fork/rewrite identity");
    expect(result.errors).toContain("release notes must state this is not an official Netease Cloud Music release");
    expect(result.errors).toContain("release notes must state this is not an official QQ Music release");
    expect(result.errors).toContain("release notes must state this is not an official original Mineradio release");
    expect(result.errors).toContain("release notes must mention zzstar101/Mineradio release channel");
    expect(result.errors).toContain("LICENSE_GATE.md must mention release-notes-policy:check");
  });
});
