import { useEffect, useRef, type RefObject } from "react";
import {
	createAudioReactivity,
	createCinemaCamera,
	createHomeVisual,
	createRenderLoop,
	createRenderer,
	createStageLyricsLifecycle,
	RenderStepSlot,
	type AudioFrameBytes,
	type AudioFrameSource,
	type AudioReactivityEngine,
	type CinemaCamera,
	type FxState,
	type HomeVisual,
	type LyricLine as VisualLyricLine,
	type RendererHandle,
	type RenderLoop,
	type StageLyricsLifecycle,
} from "@mineradio/visual-engine";

export interface VisualEngineRefs {
	hostRef: RefObject<HTMLDivElement | null>;
	audioElementRef: RefObject<HTMLAudioElement | null>;
	positionRef: RefObject<number>;
	isPlayingRef: RefObject<boolean>;
	lyricLinesRef: RefObject<VisualLyricLine[]>;
	splashActiveRef: RefObject<boolean>;
	lifecycleRef: RefObject<StageLyricsLifecycle | null>;
	coverResolution: number;
	fxDefaults?: Partial<FxState>;
}

interface MountedHandles {
	renderer: RendererHandle;
	audioEngine: AudioReactivityEngine;
	cinema: CinemaCamera;
	homeVisual: HomeVisual;
	lifecycle: StageLyricsLifecycle;
	renderLoop: RenderLoop;
	audioContext: AudioContext | null;
	offHome: () => void;
	offCamera: () => void;
	offLyrics: () => void;
	offAudio: () => void;
	offHomeAudio: () => void;
}

function prefersReducedMotion(): boolean {
	if (typeof window === "undefined") return false;
	const m = (window as unknown as { matchMedia?: (q: string) => { matches: boolean } | null }).matchMedia;
	if (typeof m !== "function") return false;
	try {
		return m.call(window, "(prefers-reduced-motion: reduce)")?.matches ?? false;
	} catch {
		return false;
	}
}

async function initAudioSource(el: HTMLAudioElement | null): Promise<AudioFrameSource> {
	if (typeof window === "undefined") return makeFallbackFrameSource();
	const AudioCtor =
		(window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ??
		(window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
	if (typeof AudioCtor !== "function") return makeFallbackFrameSource();

	let ctx: AudioContext;
	try {
		ctx = new AudioCtor();
	} catch {
		return makeFallbackFrameSource();
	}

	const mainAnalyser = ctx.createAnalyser();
	mainAnalyser.fftSize = 2048;
	mainAnalyser.smoothingTimeConstant = 0.58;
	const beatAnalyser = ctx.createAnalyser();
	beatAnalyser.fftSize = 2048;
	beatAnalyser.smoothingTimeConstant = 0.10;

	let source: MediaElementAudioSourceNode | null = null;
	if (el) {
		try {
			source = ctx.createMediaElementSource(el);
			source.connect(mainAnalyser);
			source.connect(beatAnalyser);
			mainAnalyser.connect(ctx.destination);
			beatAnalyser.connect(ctx.destination);
		} catch {
			source = null;
		}
	}

	const mainFreq = new Uint8Array(mainAnalyser.frequencyBinCount);
	const mainTime = new Uint8Array(mainAnalyser.fftSize);
	const beatFreq = new Uint8Array(beatAnalyser.frequencyBinCount);
	const beatTime = new Uint8Array(beatAnalyser.fftSize);

	return function frameSource(): AudioFrameBytes {
		try {
			mainAnalyser.getByteFrequencyData(mainFreq);
			mainAnalyser.getByteTimeDomainData(mainTime);
			beatAnalyser.getByteFrequencyData(beatFreq);
			beatAnalyser.getByteTimeDomainData(beatTime);
		} catch {
			return makeFallbackFrameSource()() ?? {
				mainFreqData: new Uint8Array(0),
				mainTimeData: new Uint8Array(0),
				mainSampleRate: 0,
				mainFftSize: 0,
				beatFreqData: new Uint8Array(0),
				beatTimeData: new Uint8Array(0),
				beatSampleRate: 0,
				beatFftSize: 0,
				playing: false,
				currentTimeSeconds: 0,
			};
		}
		const playing = !!(el && !el.paused && !el.ended);
		const currentTimeSeconds = el ? el.currentTime : 0;
		return {
			mainFreqData: mainFreq,
			mainTimeData: mainTime,
			mainSampleRate: ctx.sampleRate,
			mainFftSize: mainAnalyser.fftSize,
			beatFreqData: beatFreq,
			beatTimeData: beatTime,
			beatSampleRate: ctx.sampleRate,
			beatFftSize: beatAnalyser.fftSize,
			playing,
			currentTimeSeconds,
		};
	};
}

function makeFallbackFrameSource(): AudioFrameSource {
	const empty = new Uint8Array(0);
	return function fallbackFrame(): AudioFrameBytes {
		return {
			mainFreqData: empty,
			mainTimeData: empty,
			mainSampleRate: 0,
			mainFftSize: 0,
			beatFreqData: empty,
			beatTimeData: empty,
			beatSampleRate: 0,
			beatFftSize: 0,
			playing: false,
			currentTimeSeconds: 0,
		};
	};
}

function disposeHandles(handles: MountedHandles | null): void {
	if (!handles) return;
	try {
		handles.renderLoop.stop();
	} catch {
	}
	try {
		handles.offHome();
	} catch {
	}
	try {
		handles.offCamera();
	} catch {
	}
	try {
		handles.offLyrics();
	} catch {
	}
	try {
		handles.offAudio();
	} catch {
	}
	try {
		handles.offHomeAudio();
	} catch {
	}
	try {
		handles.lifecycle.dispose();
	} catch {
	}
	try {
		handles.homeVisual.dispose();
	} catch {
	}
	try {
		handles.cinema.dispose();
	} catch {
	}
	try {
		handles.audioEngine.dispose();
	} catch {
	}
	try {
		handles.renderLoop.dispose();
	} catch {
	}
	try {
		handles.renderer.dispose();
	} catch {
	}
	try {
		if (handles.audioContext && handles.audioContext.state !== "closed") {
			void handles.audioContext.close();
		}
	} catch {
	}
}

export function useVisualEngine(refs: VisualEngineRefs): void {
	const disposedRef = useRef(false);
	useEffect(() => {
		disposedRef.current = false;
		const host = refs.hostRef.current;
		if (typeof window === "undefined" || !host) return;
		let handles: MountedHandles | null = null;
		let cancelled = false;

		void (async () => {
			const frameSource = await initAudioSource(refs.audioElementRef.current);
			if (cancelled || disposedRef.current) {
				return;
			}
			const audioEngine = createAudioReactivity({
				frameSource,
				prefersReducedMotion,
			});
			const renderer = await createRenderer(host, {});
			if (cancelled || disposedRef.current) {
				audioEngine.dispose();
				renderer.dispose();
				return;
			}
			const cinema = createCinemaCamera({
				camera: renderer.camera,
				getCurrentTime: () => refs.positionRef.current / 1000,
			});
			const homeVisual = await createHomeVisual({
				scene: renderer.scene,
				coverResolution: refs.coverResolution,
				fx: refs.fxDefaults as FxState | undefined,
			});
			if (cancelled || disposedRef.current) {
				audioEngine.dispose();
				cinema.dispose();
				renderer.dispose();
				return;
			}
			const lifecycle = createStageLyricsLifecycle({
				scene: renderer.scene,
				currentTimeSupplier: () => refs.positionRef.current / 1000,
				isPlayingSupplier: () => refs.isPlayingRef.current,
				lyricLinesSupplier: () => refs.lyricLinesRef.current,
				getShelfVisibility: () => 0,
				pixelScale: 1,
				reduceMotion: prefersReducedMotion,
			});
			void lifecycle.mount(renderer.scene);
			refs.lifecycleRef.current = lifecycle;
			try {
				lifecycle.setLyricLines(refs.lyricLinesRef.current);
			} catch {
			}
			const renderLoop = createRenderLoop({
				renderer: renderer.renderer,
				scene: renderer.scene,
				camera: renderer.camera,
				audio: audioEngine,
				isMainSceneCoveredBySplash: () => refs.splashActiveRef.current,
				getAdaptiveFps: () => 0,
				prefersReducedMotion,
				onCacheTrim: () => {},
			});
			const offHomeAudio = renderLoop.registerStep(RenderStepSlot.Ripples, (ctx) => {
				audioEngine.update(ctx.dt);
			});
			const offHome = renderLoop.registerStep(RenderStepSlot.HomeVisual, (ctx) => {
				homeVisual.update(ctx);
			});
			const offCamera = renderLoop.registerStep(RenderStepSlot.CameraCinematic, (ctx) => {
				cinema.update(ctx);
			});
			const offLyrics = renderLoop.registerStep(RenderStepSlot.StageLyrics, (ctx) => {
				lifecycle.update(ctx);
			});
			const offAudio = audioEngine.subscribeBeat((burst, isScheduled) => {
				cinema.applyBeat(burst, isScheduled);
			});
			handles = {
				renderer,
				audioEngine,
				cinema,
				homeVisual,
				lifecycle,
				renderLoop,
				audioContext: null,
				offHome,
				offCamera,
				offLyrics,
				offAudio,
				offHomeAudio,
			};
			renderLoop.start();
		})();

		return () => {
			cancelled = true;
			disposedRef.current = true;
			disposeHandles(handles);
			handles = null;
			refs.lifecycleRef.current = null;
		};
	}, [refs.hostRef, refs.audioElementRef, refs.positionRef, refs.isPlayingRef, refs.lyricLinesRef, refs.splashActiveRef, refs.lifecycleRef, refs.coverResolution, refs.fxDefaults]);
}