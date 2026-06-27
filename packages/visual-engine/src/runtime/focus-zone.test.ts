import { expect, test } from "bun:test";
import {
	FOCUS_ZONE_ACTIVATE_DELAY_MS,
	FOCUS_ZONE_EXIT_DELAY_MS,
	FOCUS_ZONE_QUEUE_EXIT_DELAY_MS,
	focusTargetForZone,
} from "./focus-zone";

test("focusTargetForZone matches baseline non-portrait shelf-side/detail/stage/queue camera targets", () => {
	expect(focusTargetForZone("shelf-side", { portrait: false })).toEqual({
		theta: 0.42,
		phi: -0.12,
		radius: 4.20,
		lookAt: { x: 2.32, y: -0.10, z: 0.72 },
		camPunch: 0.82,
	});
	expect(focusTargetForZone("shelf-detail", { portrait: false })).toEqual({
		theta: 0.34,
		phi: -0.06,
		radius: 4.86,
		lookAt: { x: 1.74, y: 0.02, z: 0.82 },
		camPunch: 0.38,
	});
	expect(focusTargetForZone("shelf-stage", { portrait: false })).toEqual({
		theta: 0,
		phi: -0.32,
		radius: 3.8,
		lookAt: { x: 0, y: -1.7, z: 0.8 },
		camPunch: 0,
	});
	expect(focusTargetForZone("queue", { portrait: false })).toEqual({
		theta: 0.40,
		phi: 0.05,
		radius: 5.8,
		lookAt: { x: -1.2, y: 0, z: 0 },
		camPunch: 0,
	});
});

test("focusTargetForZone matches baseline portrait shelf variants", () => {
	expect(focusTargetForZone("shelf-side", { portrait: true })).toEqual({
		theta: 0.24,
		phi: -0.06,
		radius: 5.28,
		lookAt: { x: 1.08, y: -0.18, z: 0.72 },
		camPunch: 0.82,
	});
	expect(focusTargetForZone("shelf-detail", { portrait: true })).toEqual({
		theta: 0.16,
		phi: -0.03,
		radius: 5.90,
		lookAt: { x: 0.62, y: -0.08, z: 0.82 },
		camPunch: 0.38,
	});
	expect(focusTargetForZone("shelf-stage", { portrait: true })).toEqual({
		theta: 0,
		phi: -0.24,
		radius: 4.8,
		lookAt: { x: 0, y: -1.86, z: 0.8 },
		camPunch: 0,
	});
});

test("focusTargetForZone keeps baseline wallpaper-safe shelf camera overrides", () => {
	expect(focusTargetForZone("shelf-side", { portrait: false, wallpaperSafe: true })).toEqual({
		theta: 0.24,
		phi: 0.02,
		radius: 5.32,
		lookAt: { x: 2.24, y: -0.08, z: 0.78 },
		camPunch: 0.28,
	});
	expect(focusTargetForZone("shelf-detail", { portrait: true, wallpaperSafe: true })).toEqual({
		theta: 0.16,
		phi: -0.02,
		radius: 5.88,
		lookAt: { x: 0.72, y: -0.36, z: 0.84 },
		camPunch: 0.30,
	});
});

test("focus-zone timing constants match baseline setFocusZone delay and exit timers", () => {
	expect(FOCUS_ZONE_ACTIVATE_DELAY_MS).toBe(260);
	expect(FOCUS_ZONE_EXIT_DELAY_MS).toBe(120);
	expect(FOCUS_ZONE_QUEUE_EXIT_DELAY_MS).toBe(170);
});
