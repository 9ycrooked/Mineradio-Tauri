import { DEFAULT_LYRIC_PALETTE, type LyricPalette, resolveLyricPalette } from "./palette";

export class LyricPaletteRuntime {
	private current: LyricPalette;
	private cover: LyricPalette;
	private _hasCover: boolean;

	constructor(initial?: Partial<LyricPalette>) {
		this.current = resolveLyricPalette(initial);
		this.cover = resolveLyricPalette(initial);
		this._hasCover = false;
	}

	get(): LyricPalette {
		return this.current;
	}

	getCover(): LyricPalette {
		return this.cover;
	}

	hasCover(): boolean {
		return this._hasCover;
	}

	set(patch: Partial<LyricPalette>): LyricPalette {
		this.current = resolveLyricPalette({ ...this.current, ...patch });
		return this.current;
	}

	setCover(patch: Partial<LyricPalette>): LyricPalette {
		this.cover = resolveLyricPalette({ ...this.cover, ...patch });
		this._hasCover = true;
		return this.cover;
	}

	applyCover(): LyricPalette {
		if (this._hasCover) this.current = this.cover;
		return this.current;
	}

	clearCover(): LyricPalette {
		this._hasCover = false;
		this.cover = resolveLyricPalette(this.current);
		return this.current;
	}

	reset(): LyricPalette {
		this.current = { ...DEFAULT_LYRIC_PALETTE };
		this.cover = { ...DEFAULT_LYRIC_PALETTE };
		this._hasCover = false;
		return this.current;
	}
}