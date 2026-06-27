export type FocusZoneType = "shelf-side" | "shelf-detail" | "shelf-stage" | "queue";

export interface FocusZoneOptions {
	portrait?: boolean;
	wallpaperSafe?: boolean;
}

export interface FocusZoneTarget {
	theta: number;
	phi: number;
	radius: number;
	lookAt: { x: number; y: number; z: number };
	camPunch: number;
}

export const FOCUS_ZONE_ACTIVATE_DELAY_MS = 260;
export const FOCUS_ZONE_EXIT_DELAY_MS = 120;
export const FOCUS_ZONE_QUEUE_EXIT_DELAY_MS = 170;

export function focusTargetForZone(
	type: FocusZoneType,
	opts: FocusZoneOptions = {},
): FocusZoneTarget {
	const portrait = !!opts.portrait;
	const wallpaperSafe = !!opts.wallpaperSafe;
	if (type === "shelf-side") {
		if (wallpaperSafe) {
			return {
				theta: portrait ? 0.18 : 0.24,
				phi: portrait ? 0.00 : 0.02,
				radius: portrait ? 5.74 : 5.32,
				lookAt: { x: portrait ? 1.04 : 2.24, y: -0.08, z: 0.78 },
				camPunch: 0.28,
			};
		}
		return {
			theta: portrait ? 0.24 : 0.42,
			phi: portrait ? -0.06 : -0.12,
			radius: portrait ? 5.28 : 4.20,
			lookAt: { x: portrait ? 1.08 : 2.32, y: portrait ? -0.18 : -0.10, z: 0.72 },
			camPunch: 0.82,
		};
	}
	if (type === "shelf-detail") {
		if (wallpaperSafe) {
			return {
				theta: portrait ? 0.16 : 0.26,
				phi: portrait ? -0.02 : 0.02,
				radius: portrait ? 5.88 : 5.18,
				lookAt: { x: portrait ? 0.72 : 2.28, y: portrait ? -0.36 : -0.32, z: 0.84 },
				camPunch: 0.30,
			};
		}
		return {
			theta: portrait ? 0.16 : 0.34,
			phi: portrait ? -0.03 : -0.06,
			radius: portrait ? 5.90 : 4.86,
			lookAt: { x: portrait ? 0.62 : 1.74, y: portrait ? -0.08 : 0.02, z: 0.82 },
			camPunch: 0.38,
		};
	}
	if (type === "shelf-stage") {
		return {
			theta: 0,
			phi: portrait ? -0.24 : -0.32,
			radius: portrait ? 4.8 : 3.8,
			lookAt: { x: 0, y: portrait ? -1.86 : -1.7, z: 0.8 },
			camPunch: 0,
		};
	}
	return {
		theta: 0.40,
		phi: 0.05,
		radius: 5.8,
		lookAt: { x: -1.2, y: 0, z: 0 },
		camPunch: 0,
	};
}
