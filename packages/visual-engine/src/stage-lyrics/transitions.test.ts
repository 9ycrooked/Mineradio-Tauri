import { expect, test } from "bun:test";
import type { GsapLike, GsapTimelineLike, GsapTweenLike } from "../control/control-console-motion";
import {
	createTransitionEasings,
	defaultTransitionEasings,
	LYRIC_TRANSITION_DURATIONS,
	LYR_IN_EASE_FALLBACK,
	LYR_OUT_EASE_FALLBACK,
	LYR_BOB_EASE,
	playStageLineInTimeline,
	playStageLineBobTimeline,
	playStageLineOutTimeline,
} from "./transitions";

type RecordedCall = { method: string; args: unknown[] };

function makeFakeTimeline(recorder: RecordedCall[]): GsapTimelineLike {
	const node: GsapTimelineLike = {
		to(target, vars, position) {
			recorder.push({ method: "tl.to", args: [target, vars, position] });
			return node;
		},
		fromTo(target, from, to, position) {
			recorder.push({ method: "tl.fromTo", args: [target, from, to, position] });
			return node;
		},
		kill() {
			recorder.push({ method: "tl.kill", args: [] });
			return node;
		},
	};
	return node;
}

function makeFakeGsap(recorder: RecordedCall[]): GsapLike {
	return {
		to(target, vars) {
			recorder.push({ method: "to", args: [target, vars] });
			return { kill: () => recorder.push({ method: "tween.kill", args: [target] }) } as GsapTweenLike;
		},
		fromTo(target, from, to) {
			recorder.push({ method: "fromTo", args: [target, from, to] });
			return { kill: () => recorder.push({ method: "tween.kill", args: [target] }) } as GsapTweenLike;
		},
		set(target, vars) {
			recorder.push({ method: "set", args: [target, vars] });
		},
		killTweensOf(target, _props) {
			recorder.push({ method: "killTweensOf", args: [target] });
		},
		timeline(vars) {
			recorder.push({ method: "timeline", args: [vars] });
			return makeFakeTimeline(recorder);
		},
	};
}

function makeFakeGroup(): { group: object; position: object; rotation: object; scale: object; uniforms: object } {
	const uOpacity = { value: 0 };
	const textMat = { uniforms: { uOpacity } };
	const group = {
		position: { x: 0.1, y: 0.2, z: 1.46 },
		rotation: { x: 0, y: 0, z: 0 },
		scale: { x: 0.96, y: 0.96, z: 0.96 },
		userData: { lyric: { textMat } },
	};
	return { group, position: group.position, rotation: group.rotation, scale: group.scale, uniforms: uOpacity as object } as never;
}

test("transition duration constants match baseline (900/5600/700ms; bob starts at 0.9s)", () => {
	expect(LYRIC_TRANSITION_DURATIONS.LYR_IN_MS).toBe(900);
	expect(LYRIC_TRANSITION_DURATIONS.LYR_BOB_MS).toBe(5600);
	expect(LYRIC_TRANSITION_DURATIONS.LYR_OUT_MS).toBe(700);
	expect(LYRIC_TRANSITION_DURATIONS.LYR_BOB_START_OFFSET_MS).toBe(900);
	expect(LYRIC_TRANSITION_DURATIONS.LYR_IN_OPACITY_REACH_FRACTION).toBeCloseTo(0.55, 6);
});

test("defaultTransitionEasings uses documented approximations (back.out(1.4) / power2.in / sine.inOut)", () => {
	const e = defaultTransitionEasings();
	expect(e.inEase).toBe(LYR_IN_EASE_FALLBACK);
	expect(e.outEase).toBe(LYR_OUT_EASE_FALLBACK);
	expect(e.bobEase).toBe(LYR_BOB_EASE);
});

test("createTransitionEasings uses customEase creator output when provided", () => {
	const e = createTransitionEasings((id, _path) => id);
	expect(e.inEase).toBe("lyr-in-ease");
	expect(e.outEase).toBe("lyr-out-ease");
	expect(e.bobEase).toBe(LYR_BOB_EASE);
});

test("createTransitionEasings falls back when customEase throws", () => {
	const e = createTransitionEasings(() => {
		throw new Error("no");
	});
	expect(e.inEase).toBe(LYR_IN_EASE_FALLBACK);
	expect(e.outEase).toBe(LYR_OUT_EASE_FALLBACK);
});

test("playStageLineInTimeline uses 900ms duration + target transforms from rest toward final", () => {
	const rec: RecordedCall[] = [];
	const gsap = makeFakeGsap(rec);
	const { group, position, rotation, scale, uniforms } = makeFakeGroup();
	playStageLineInTimeline(gsap, group as never, {});
	const fromTos = rec.filter((c) => c.method === "tl.fromTo");
	const posFromTo = fromTos.find((c) => c.args[0] === position);
	const rotFromTo = fromTos.find((c) => c.args[0] === rotation);
	const scaleFromTo = fromTos.find((c) => c.args[0] === scale);
	expect(posFromTo).not.toBeUndefined();
	expect(((posFromTo!.args[2] as Record<string, unknown>).duration as number) * 1000).toBe(900);
	expect((posFromTo!.args[2] as Record<string, unknown>).x).toBeCloseTo(0.1, 6);
	expect((posFromTo!.args[2] as Record<string, unknown>).z).toBeCloseTo(1.46, 6);
	expect(rotFromTo).not.toBeUndefined();
	expect(((rotFromTo!.args[2] as Record<string, unknown>).duration as number) * 1000).toBe(900);
	expect((rotFromTo!.args[2] as Record<string, unknown>).y).toBe(0);
	expect(scaleFromTo).not.toBeUndefined();
	expect((scaleFromTo!.args[2] as Record<string, unknown>).x).toBe(1);
	const opacityFromTo = fromTos.find((c) => c.args[0] === uniforms);
	expect(opacityFromTo).not.toBeUndefined();
	const toVars = opacityFromTo!.args[2] as Record<string, unknown>;
	expect((toVars.duration as number) * 1000).toBeCloseTo(900 * 0.55, 4);
	expect(toVars.value).toBe(1);
});

test("playStageLineInTimeline initial-from transforms encode (-60/+40/-160)=(28deg,-22deg) scale 0.7", () => {
	const rec: RecordedCall[] = [];
	const gsap = makeFakeGsap(rec);
	const { group, position, rotation, scale } = makeFakeGroup();
	playStageLineInTimeline(gsap, group as never, {});
	const fromTos = rec.filter((c) => c.method === "tl.fromTo");
	const posFromTo = fromTos.find((c) => c.args[0] === position)!.args[1] as Record<string, unknown>;
	expect(posFromTo.x).toBeCloseTo(0.1 - 60, 4);
	expect(posFromTo.y).toBeCloseTo(0.2 + 40, 4);
	expect(posFromTo.z).toBeCloseTo(1.46 - 160, 3);
	const rotFromTo = fromTos.find((c) => c.args[0] === rotation)!.args[1] as Record<string, unknown>;
	expect(rotFromTo.x).toBeCloseTo((28 * Math.PI) / 180, 4);
	expect(rotFromTo.y).toBeCloseTo((-22 * Math.PI) / 180, 4);
	const scaleFromTo = fromTos.find((c) => c.args[0] === scale)!.args[1] as Record<string, unknown>;
	expect(scaleFromTo.x).toBeCloseTo(0.7, 4);
});

test("playStageLineBobTimeline uses 5600ms / 4 phase durations of 1.4s each + 0.9s start offset", () => {
	const rec: RecordedCall[] = [];
	const gsap = makeFakeGsap(rec);
	const { group, position } = makeFakeGroup();
	playStageLineBobTimeline(gsap, group as never, {});
	const tos = rec.filter((c) => c.method === "tl.to" && c.args[0] === position);
	expect(todos_longer_than(tos, 4)).toBe(true);
	const phaseDur = ((tos[0].args[1] as Record<string, unknown>).duration as number) * 1000;
	expect(phaseDur).toBeCloseTo(1400, 4);
	expect(tos[0].args[2]).toBeCloseTo(0.9, 4);
	expect(tos[2].args[2]).toBeCloseTo(0.9 + 2.8 + 0.0001, 2);
});

function todos_longer_than(tos: RecordedCall[], n: number): boolean {
	return tos.length === n;
}

test("playStageLineOutTimeline uses 700ms duration + target transforms (60/-40/-120, -22deg/18deg, 0.78)", () => {
	const rec: RecordedCall[] = [];
	const gsap = makeFakeGsap(rec);
	const { group, position, rotation, scale } = makeFakeGroup();
	playStageLineOutTimeline(gsap, group as never, {});
	const tos = rec.filter((c) => c.method === "tl.to");
	const posTo = tos.find((c) => c.args[0] === position);
	const rotTo = tos.find((c) => c.args[0] === rotation);
	const scaleTo = tos.find((c) => c.args[0] === scale);
	expect(posTo).not.toBeUndefined();
	expect(((posTo!.args[1] as Record<string, unknown>).duration as number) * 1000).toBe(700);
	expect((posTo!.args[1] as Record<string, unknown>).x).toBeCloseTo(0.1 + 60, 5);
	expect((posTo!.args[1] as Record<string, unknown>).y).toBeCloseTo(0.2 - 40, 5);
	expect((posTo!.args[1] as Record<string, unknown>).z).toBeCloseTo(1.46 - 120, 4);
	expect(rotTo).not.toBeUndefined();
	expect(((rotTo!.args[1] as Record<string, unknown>).duration as number) * 1000).toBe(700);
	expect((rotTo!.args[1] as Record<string, unknown>).x).toBeCloseTo((-22 * Math.PI) / 180, 5);
	expect((rotTo!.args[1] as Record<string, unknown>).y).toBeCloseTo((18 * Math.PI) / 180, 5);
	expect(scaleTo).not.toBeUndefined();
	expect((scaleTo!.args[1] as Record<string, unknown>).x).toBeCloseTo(0.78, 5);
});

test("playStageLineBobTimeline returns null when reduceMotion enabled", () => {
	const rec: RecordedCall[] = [];
	const gsap = makeFakeGsap(rec);
	const { group } = makeFakeGroup();
	const out = playStageLineBobTimeline(gsap, group as never, { reduceMotion: true });
	expect(out).toBeNull();
});