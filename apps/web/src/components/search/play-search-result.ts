import type { Track } from "@mineradio/shared";
import { usePlaybackStore } from "../../stores/playback-store";

export function playSearchResult(track: Track): void {
	const store = usePlaybackStore.getState();
	const sameTrack = (t: Track) => t.provider === track.provider && t.id === track.id;
	const queue = store.queue.filter((t) => !sameTrack(t));
	store.setQueue([track, ...queue]);
	const nextQueue = usePlaybackStore.getState().queue;
	const index = nextQueue.findIndex(
		(t) => t.provider === track.provider && t.id === track.id,
	);
	if (index >= 0) {
		store.playAt(index);
	}
}

export function isPlayable(state: Track["playableState"]): boolean {
	return (
		state === "playable" ||
		state === "trial_only" ||
		state === "unknown"
	);
}
