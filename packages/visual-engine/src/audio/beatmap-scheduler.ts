export interface NormalizedBeatMapEvent {
	time: number;
	strength: number;
	impact: number;
	body: number;
	combo: string | null;
}

export interface BeatMapSchedulerDeps {
	scheduleCameraBeat(beat: {
		strength?: number;
		impact?: number;
		body?: number;
		combo?: string | null;
	}): void;
	triggerScheduledBeat(beat: {
		strength?: number;
		impact?: number;
		body?: number;
		combo?: string | null;
	}): void;
	setWaitingForBeatMap(waiting: boolean): void;
	setBeatMapReady(ready: boolean): void;
}

export interface BeatMapScheduler {
	setBeatMap(key: string, map: unknown): void;
	update(positionSeconds: number): void;
	reset(): void;
}

const CAMERA_EVENT_KEYS = ["cameraBeats", "beats", "kicks"] as const;
const PULSE_EVENT_KEYS = ["pulseBeats", "kicks"] as const;
const CROSSING_PAD_SEC = 0.035;
const CAMERA_LOOKAHEAD_SEC = 0.075;

export function normalizeBeatMapEvents(map: unknown): NormalizedBeatMapEvent[] {
	return normalizeBeatMapEventList(map, CAMERA_EVENT_KEYS);
}

export function normalizeBeatMapPulseEvents(map: unknown): NormalizedBeatMapEvent[] {
	return normalizeBeatMapEventList(map, PULSE_EVENT_KEYS);
}

function normalizeBeatMapEventList(
	map: unknown,
	keys: readonly string[],
): NormalizedBeatMapEvent[] {
	if (!map || typeof map !== "object") return [];
	const record = map as Record<string, unknown>;
	let source: unknown[] | null = null;
	for (const key of keys) {
		const raw = record[key];
		if (Array.isArray(raw) && raw.length > 0) {
			source = raw;
			break;
		}
	}
	if (!source) return [];
	const events: NormalizedBeatMapEvent[] = [];
	for (const item of source) {
		const event = normalizeBeatEvent(item);
		if (event) events.push(event);
	}
	events.sort((a, b) => a.time - b.time);
	return events;
}

export function createBeatMapScheduler(deps: BeatMapSchedulerDeps): BeatMapScheduler {
	let key = "";
	let cameraEvents: NormalizedBeatMapEvent[] = [];
	let pulseEvents: NormalizedBeatMapEvent[] = [];
	let cameraCursor = 0;
	let pulseCursor = 0;
	let lastPosition: number | null = null;

	function applyReadyState(ready: boolean): void {
		deps.setWaitingForBeatMap(!ready);
		deps.setBeatMapReady(ready);
	}

	function seekCursor(position: number): void {
		cameraCursor = 0;
		pulseCursor = 0;
		const cameraSyncTime = Math.max(0, position - 0.025);
		while (cameraCursor < cameraEvents.length && cameraEvents[cameraCursor].time < cameraSyncTime) {
			cameraCursor += 1;
		}
		const pulseSyncTime = Math.max(0, position - CROSSING_PAD_SEC);
		while (pulseCursor < pulseEvents.length && pulseEvents[pulseCursor].time < pulseSyncTime) {
			pulseCursor += 1;
		}
	}

	return {
		setBeatMap(nextKey, map) {
			key = nextKey || "";
			cameraEvents = key ? normalizeBeatMapEvents(map) : [];
			pulseEvents = key ? normalizeBeatMapPulseEvents(map) : [];
			cameraCursor = 0;
			pulseCursor = 0;
			lastPosition = null;
			applyReadyState(cameraEvents.length > 0 || pulseEvents.length > 0);
		},
		update(positionSeconds) {
			if ((!cameraEvents.length && !pulseEvents.length) || !Number.isFinite(positionSeconds)) return;
			const position = Math.max(0, positionSeconds);
			if (lastPosition === null || position + 0.08 < lastPosition) {
				seekCursor(position);
				lastPosition = position;
				return;
			}
			const from = Math.max(0, lastPosition - CROSSING_PAD_SEC);
			const cameraTo = position + CAMERA_LOOKAHEAD_SEC;
			while (cameraCursor < cameraEvents.length && cameraEvents[cameraCursor].time <= cameraTo) {
				const event = cameraEvents[cameraCursor];
				cameraCursor += 1;
				if (event.time < from) continue;
				deps.scheduleCameraBeat({
					strength: event.strength,
					impact: event.impact,
					body: event.body,
					combo: event.combo,
				});
			}
			while (pulseCursor < pulseEvents.length && pulseEvents[pulseCursor].time <= position) {
				const event = pulseEvents[pulseCursor];
				pulseCursor += 1;
				if (event.time < from) continue;
				deps.triggerScheduledBeat({
					strength: event.strength,
					impact: event.impact,
					body: event.body,
					combo: event.combo,
				});
			}
			lastPosition = position;
		},
		reset() {
			key = "";
			cameraEvents = [];
			pulseEvents = [];
			cameraCursor = 0;
			pulseCursor = 0;
			lastPosition = null;
			applyReadyState(false);
		},
	};
}

function normalizeBeatEvent(value: unknown): NormalizedBeatMapEvent | null {
	if (typeof value === "number") {
		return Number.isFinite(value)
			? { time: Math.max(0, value), strength: 0.42, impact: 0.42, body: 0, combo: null }
			: null;
	}
	if (!value || typeof value !== "object") return null;
	const record = value as Record<string, unknown>;
	const time = numberValue(record.t ?? record.time ?? record.at ?? record.sec);
	if (time === null) return null;
	const strength = clamp01(numberValue(record.strength) ?? numberValue(record.s) ?? 0.42);
	const impact = clamp01(numberValue(record.impact) ?? numberValue(record.i) ?? strength);
	const body = clamp01(numberValue(record.body) ?? numberValue(record.b) ?? 0);
	const combo = typeof record.combo === "string" && record.combo.trim()
		? record.combo.trim()
		: null;
	return {
		time: Math.max(0, time),
		strength,
		impact,
		body,
		combo,
	};
}

function numberValue(value: unknown): number | null {
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}
