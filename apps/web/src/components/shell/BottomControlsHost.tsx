import { type ReactElement } from "react";
import { PlayerConsoleHost } from "../../visual/PlayerConsoleHost";
import type { PlaybackMode } from "../../stores/playback-store";

export interface BottomControlsHostProps {
	visible: boolean;
	onReveal: () => void;
	onTogglePlay?: () => void;
	onPrevious?: () => void;
	onNext?: () => void;
	onModeChange?: (mode: PlaybackMode) => void;
	onQueue?: () => void;
	onLyrics?: () => void;
	onClose?: () => void;
	onNotice?: (message: string) => void;
	mode?: PlaybackMode;
	isPlaying?: boolean;
	currentTitle?: string;
	currentArtist?: string;
	positionMs?: number;
	durationMs?: number | null;
}

export function BottomControlsHost(props: BottomControlsHostProps): ReactElement {
	return (
		<>
			<button
				id="bottom-handle"
				className={props.visible ? "active" : ""}
				type="button"
				onClick={props.onReveal}
				onPointerEnter={props.onReveal}
				aria-label="展开播放器控制台"
				title="展开播放器控制台"
			>
				<span />
			</button>
			<PlayerConsoleHost
				visible={props.visible}
				onReveal={props.onReveal}
				onTogglePlay={props.onTogglePlay}
				onPrevious={props.onPrevious}
				onNext={props.onNext}
				onModeChange={props.onModeChange}
				onQueue={props.onQueue}
				onLyrics={props.onLyrics}
				onClose={props.onClose}
				onNotice={props.onNotice}
				mode={props.mode}
				isPlaying={props.isPlaying}
				currentTitle={props.currentTitle}
				currentArtist={props.currentArtist}
				positionMs={props.positionMs}
				durationMs={props.durationMs}
			/>
		</>
	);
}
