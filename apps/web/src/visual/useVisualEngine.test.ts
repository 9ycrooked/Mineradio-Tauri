import { expect, test } from "bun:test";
import { isRuntimeShelfPreviewActive, setRuntimeShelfMode } from "./useVisualEngine";

test("isRuntimeShelfPreviewActive follows side-auto shelf visibility readiness", () => {
	expect(isRuntimeShelfPreviewActive("auto", 0.17)).toBe(true);
	expect(isRuntimeShelfPreviewActive("auto", 0.16)).toBe(false);
	expect(isRuntimeShelfPreviewActive("auto", 0)).toBe(false);
	expect(isRuntimeShelfPreviewActive("always", 0.9)).toBe(false);
	expect(isRuntimeShelfPreviewActive(undefined, 0.9)).toBe(false);
});

test("setRuntimeShelfMode mutates the render-loop source shelf mode ref", () => {
	const ref = { current: "off" };
	setRuntimeShelfMode(ref, "side");
	expect(ref.current).toBe("side");
});

test("setRuntimeShelfMode notifies the persistent shelf mode source", () => {
	const ref = { current: "off" };
	const calls: string[] = [];
	setRuntimeShelfMode(ref, "side", (mode) => calls.push(mode));
	expect(calls).toEqual(["side"]);
});
