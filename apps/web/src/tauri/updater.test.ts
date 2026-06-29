import { expect, test } from "bun:test";
import { checkForUpdate, installUpdate } from "./updater";

test("checkForUpdate returns a gated placeholder outside Tauri", async () => {
	const result = await checkForUpdate();

	expect(result).toEqual({
		available: false,
		version: null,
		currentVersion: "0.0.0-dev",
		body: null,
		message: null,
		date: null,
		error: null,
		requiresSignature: true,
		signatureGate: true,
		installState: "signature-key-missing",
	});
});

test("installUpdate returns a gated placeholder outside Tauri", async () => {
	const result = await installUpdate();

	expect(result.installState).toBe("signature-key-missing");
	expect(result.signatureGate).toBe(true);
});
