import { expect, test } from "bun:test";
import { buildEdgeAndDepthCanvas, createCoverDepthTween, visualEase } from "./cover-depth";

function makeSourceCanvas(width: number, height: number, data: Uint8ClampedArray) {
	return {
		width,
		height,
		getContext(type: string) {
			expect(type).toBe("2d");
			return {
				drawImage() {},
				getImageData() {
					return { data };
				},
			};
		},
	};
}

function makeOutputCanvas() {
	const out = {
		width: 0,
		height: 0,
		imageData: null as { data: Uint8ClampedArray; width: number; height: number } | null,
		sourceData: null as Uint8ClampedArray | null,
		getContext(type: string) {
			expect(type).toBe("2d");
			return {
				drawImage() {},
				getImageData() {
					return { data: out.sourceData ?? new Uint8ClampedArray(256 * 256 * 4) };
				},
				createImageData(width: number, height: number) {
					return { data: new Uint8ClampedArray(width * height * 4), width, height };
				},
				putImageData(imageData: { data: Uint8ClampedArray; width: number; height: number }) {
					out.imageData = imageData;
				},
			};
		},
	};
	return out;
}

test("visualEase preserves baseline smoothstep easing", () => {
	expect(visualEase(-1)).toBe(0);
	expect(visualEase(0)).toBe(0);
	expect(visualEase(0.5)).toBe(0.5);
	expect(visualEase(1)).toBe(1);
	expect(visualEase(2)).toBe(1);
});

test("buildEdgeAndDepthCanvas outputs baseline 256x256 RGBA depth/edge/fg/luminance texture", () => {
	const srcData = new Uint8ClampedArray(256 * 256 * 4);
	for (let y = 0; y < 256; y++) {
		for (let x = 0; x < 256; x++) {
			const i = (y * 256 + x) * 4;
			const v = x < 128 ? 0 : 255;
			srcData[i] = v;
			srcData[i + 1] = v;
			srcData[i + 2] = v;
			srcData[i + 3] = 255;
		}
	}
	const source = makeSourceCanvas(256, 256, srcData);
	const normalized = makeOutputCanvas();
	normalized.sourceData = srcData;
	const output = makeOutputCanvas();
	const result = buildEdgeAndDepthCanvas(source as never, {
		createCanvas: (width, height) => {
			const canvas = normalized.width === 0 ? normalized : output;
			canvas.width = width;
			canvas.height = height;
			return canvas as never;
		},
	});

	expect(result).toBe(output);
	expect(output.width).toBe(256);
	expect(output.height).toBe(256);
	expect(output.imageData?.width).toBe(256);
	expect(output.imageData?.height).toBe(256);
	const centerLeft = (128 * 256 + 127) * 4;
	const centerRight = (128 * 256 + 128) * 4;
	expect(output.imageData!.data[centerRight + 3]).toBeGreaterThan(output.imageData!.data[centerLeft + 3]);
	expect(output.imageData!.data[centerLeft + 1]).toBeGreaterThan(0);
	expect(output.imageData!.data[centerRight + 1]).toBeGreaterThan(0);
});

test("createCoverDepthTween advances uHasDepth and uAiBoost with baseline smoothstep", () => {
	const uniforms = {
		uHasDepth: { value: 0 },
		uAiBoost: { value: 0 },
	};
	const tween = createCoverDepthTween(uniforms);
	tween.setTarget(1, 0.55, 180);
	tween.advance(0.09);
	expect(uniforms.uHasDepth.value).toBeCloseTo(0.5, 5);
	expect(uniforms.uAiBoost.value).toBeCloseTo(0.275, 5);
	tween.advance(0.09);
	expect(uniforms.uHasDepth.value).toBe(1);
	expect(uniforms.uAiBoost.value).toBe(0.55);
	tween.setTarget(0, 0, 1);
	expect(uniforms.uHasDepth.value).toBe(0);
	expect(uniforms.uAiBoost.value).toBe(0);
});
