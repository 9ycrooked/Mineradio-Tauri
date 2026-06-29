import { expect, test } from "bun:test";
import {
	createBeatMapScheduler,
	normalizeBeatMapEvents,
	normalizeBeatMapPulseEvents,
} from "./beatmap-scheduler";

test("normalizeBeatMapEvents accepts the first baseline beat array in time order", () => {
	const events = normalizeBeatMapEvents({
		cameraBeats: [
			{ t: 2.4, strength: 0.8, impact: 0.7, body: 0.3, combo: "drop" },
			1.2,
		],
		kicks: [3.6],
	});

	expect(events).toEqual([
		{ time: 1.2, strength: 0.42, impact: 0.42, body: 0, combo: null },
		{ time: 2.4, strength: 0.8, impact: 0.7, body: 0.3, combo: "drop" },
	]);
});

test("normalizeBeatMapPulseEvents follows baseline pulseBeats then kicks fallback", () => {
	expect(normalizeBeatMapPulseEvents({
		cameraBeats: [1],
		pulseBeats: [{ time: 1.5, impact: 0.7 }],
		kicks: [3],
	})).toEqual([
		{ time: 1.5, strength: 0.42, impact: 0.7, body: 0, combo: null },
	]);
	expect(normalizeBeatMapPulseEvents({ kicks: [3] })).toEqual([
		{ time: 3, strength: 0.42, impact: 0.42, body: 0, combo: null },
	]);
});

test("beatmap scheduler toggles ready state, schedules camera beats with lookahead, and triggers pulse beats at time", () => {
	const camera: unknown[] = [];
	const pulses: unknown[] = [];
	const readyStates: boolean[] = [];
	const waitingStates: boolean[] = [];
	const scheduler = createBeatMapScheduler({
		scheduleCameraBeat: (beat) => camera.push(beat),
		triggerScheduledBeat: (beat) => pulses.push(beat),
		setBeatMapReady: (ready) => readyStates.push(ready),
		setWaitingForBeatMap: (waiting) => waitingStates.push(waiting),
	});

	scheduler.setBeatMap("netease:42", {
		cameraBeats: [
			{ t: 1.0, strength: 0.9, impact: 0.8, body: 0.2, combo: "downbeat" },
			{ time: 2.0, strength: 0.6 },
		],
		pulseBeats: [{ time: 1.25, strength: 0.7, impact: 0.6 }],
	});
	scheduler.update(0.92);
	scheduler.update(1.01);
	scheduler.update(1.24);
	scheduler.update(1.26);
	scheduler.update(1.5);
	scheduler.update(2.02);
	scheduler.update(2.4);

	expect(waitingStates.at(-1)).toBe(false);
	expect(readyStates.at(-1)).toBe(true);
	expect(camera).toEqual([
		{ strength: 0.9, impact: 0.8, body: 0.2, combo: "downbeat" },
		{ strength: 0.6, impact: 0.6, body: 0, combo: null },
	]);
	expect(pulses).toEqual([
		{ strength: 0.7, impact: 0.6, body: 0, combo: null },
	]);
});

test("beatmap scheduler resets to waiting mode when a track has no map", () => {
	const readyStates: boolean[] = [];
	const waitingStates: boolean[] = [];
	const scheduler = createBeatMapScheduler({
		scheduleCameraBeat: () => {},
		triggerScheduledBeat: () => {},
		setBeatMapReady: (ready) => readyStates.push(ready),
		setWaitingForBeatMap: (waiting) => waitingStates.push(waiting),
	});

	scheduler.setBeatMap("netease:42", { beats: [1] });
	scheduler.setBeatMap("", null);

	expect(waitingStates.at(-1)).toBe(true);
	expect(readyStates.at(-1)).toBe(false);
});

test("beatmap scheduler refreshes events when the same key receives a newer map", () => {
	const triggered: unknown[] = [];
	const scheduler = createBeatMapScheduler({
		scheduleCameraBeat: (beat) => triggered.push(beat),
		triggerScheduledBeat: () => {},
		setBeatMapReady: () => {},
		setWaitingForBeatMap: () => {},
	});

	scheduler.setBeatMap("netease:42", { cameraBeats: [1] });
	scheduler.setBeatMap("netease:42", { cameraBeats: [{ t: 2, strength: 0.9 }] });
	scheduler.update(1.2);
	scheduler.update(2.1);

	expect(triggered).toEqual([
		{ strength: 0.9, impact: 0.9, body: 0, combo: null },
	]);
});
