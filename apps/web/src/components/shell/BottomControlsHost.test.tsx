import { expect, test } from "bun:test";
import { createRoot } from "react-dom/client";
import React from "react";
import { BottomControlsHost } from "./BottomControlsHost";

test("BottomControlsHost forwards window chrome callbacks to the player console", async () => {
	await import("../../../../../packages/visual-engine/src/runtime/happy-dom-preload");
	const calls: string[] = [];
	const container = document.createElement("div");
	document.body.appendChild(container);
	const root = createRoot(container);
	root.render(
		React.createElement(BottomControlsHost, {
			visible: true,
			onReveal: () => calls.push("reveal"),
			onMinimize: () => calls.push("minimize"),
			onToggleMaximize: () => calls.push("maximize"),
			onToggleFullscreen: () => calls.push("fullscreen"),
		}),
	);
	await new Promise((resolve) => setTimeout(resolve, 0));

	(container.querySelector(".console-host-minimize") as HTMLButtonElement).click();
	(container.querySelector(".console-host-maximize") as HTMLButtonElement).click();
	(container.querySelector(".fullscreen-toggle-btn") as HTMLButtonElement).click();

	expect(calls).toEqual(["minimize", "maximize", "fullscreen"]);
	root.unmount();
	container.remove();
});
