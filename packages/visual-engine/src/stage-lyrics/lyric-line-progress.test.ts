import { expect, test } from "bun:test";
import { getLyricLineProgress, type LyricLine } from "./lyric-line-progress";

function line(t: number, text: string, duration?: number): LyricLine {
	return { t, text, duration };
}

test("getLyricLineProgress returns 0 for null/undefined line", () => {
	expect(getLyricLineProgress(null, null, 1)).toBe(0);
	expect(getLyricLineProgress(undefined, undefined, 1)).toBe(0);
});

test("getLyricLineProgress returns 0 when t < line.t (plain line, nextLine provided)", () => {
	const a = line(1, "x");
	const b = line(3, "y");
	expect(getLyricLineProgress(a, b, 0.5)).toBe(0);
});

test("getLyricLineProgress returns ~1 at t >= nextLine.t (plain line)", () => {
	const a = line(1, "x");
	const b = line(3, "y");
	expect(getLyricLineProgress(a, b, 3)).toBeCloseTo(1, 6);
	expect(getLyricLineProgress(a, b, 5)).toBe(1);
});

test("getLyricLineProgress smoothstep prog*prog*(3-2*prog) at prog=0.5 returns 0.5", () => {
	const a = line(1, "x");
	const b = line(3, "y");
	const now = 1 + 0.5 * (3 - 1) - 0.020;
	expect(getLyricLineProgress(a, b, now)).toBeCloseTo(0.5, 6);
});

test("getLyricLineProgress smoothstep at prog=0 and prog=1 endpoints", () => {
	const a = line(0, "x");
	const b = line(2, "y");
	expect(getLyricLineProgress(a, b, -0.5)).toBeCloseTo(0, 6);
	expect(getLyricLineProgress(a, b, 5)).toBeCloseTo(1, 6);
});

test("getLyricLineProgress audioDuration fallback when no nextLine (line.t + duration*4.8 span)", () => {
	const a = line(1, "x");
	const spanOffset = Math.max(0.75, 5.8 - 1);
	const nowForProgHalf = 1 - 0.020 + 0.5 * spanOffset;
	const out = getLyricLineProgress(a, null, nowForProgHalf, 9999);
	expect(out).toBeCloseTo(0.5, 1);
});

test("getLyricLineProgress YRC words path advances word-by-word", () => {
	const wline: LyricLine = {
		t: 1,
		text: "abcde",
		charCount: 5,
		words: [{ t: 1, d: 0.5, c0: 0, c1: 5 }],
	};
	expect(getLyricLineProgress(wline, undefined, 0.5)).toBe(0);
	const at023 = getLyricLineProgress(wline, undefined, 1.2);
	expect(at023).toBeGreaterThan(0.1);
	expect(at023).toBeLessThan(0.5);
	expect(getLyricLineProgress(wline, undefined, 2)).toBe(1);
});