import type { LyricPalette } from "./palette";
import type { LyricPaletteRuntime } from "./palette-runtime";

export interface PaletteDriver {
	setPalette(patch: Partial<LyricPalette>): LyricPalette;
	setCoverPalette(patch: Partial<LyricPalette>): LyricPalette;
	applyCoverPalette(): LyricPalette;
	clearCoverPalette(): LyricPalette;
	reset(): LyricPalette;
}

export function createLyricPaletteDriver(runtime: LyricPaletteRuntime): PaletteDriver {
	return {
		setPalette(patch) {
			return runtime.set(patch);
		},
		setCoverPalette(patch) {
			return runtime.setCover(patch);
		},
		applyCoverPalette() {
			return runtime.applyCover();
		},
		clearCoverPalette() {
			return runtime.clearCover();
		},
		reset() {
			return runtime.reset();
		},
	};
}