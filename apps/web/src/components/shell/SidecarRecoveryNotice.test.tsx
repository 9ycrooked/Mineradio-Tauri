import { expect, test } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
	SidecarRecoveryNotice,
	resolveSidecarRecoveryNotice,
	type SidecarRecoveryNoticeState,
} from "./SidecarRecoveryNotice";

function state(overrides: Partial<SidecarRecoveryNoticeState> = {}): SidecarRecoveryNoticeState {
	return {
		phase: "ready",
		restarts: 0,
		lastError: null,
		recovered: false,
		...overrides,
	};
}

test("resolveSidecarRecoveryNotice hides healthy ready and starting states", () => {
	expect(resolveSidecarRecoveryNotice(state())).toBeNull();
	expect(resolveSidecarRecoveryNotice(state({ phase: "starting" }))).toBeNull();
});

test("resolveSidecarRecoveryNotice exposes recovering, recovered, stopped, and error states", () => {
	expect(resolveSidecarRecoveryNotice(state({ phase: "recovering", restarts: 2 }))).toEqual({
		tone: "recovering",
		text: "sidecar 正在恢复连接",
		detail: "已自动重启 2 次",
	});
	expect(resolveSidecarRecoveryNotice(state({ phase: "ready", restarts: 1, recovered: true }))).toEqual({
		tone: "recovered",
		text: "sidecar 已恢复",
		detail: "已自动重启 1 次",
	});
	expect(resolveSidecarRecoveryNotice(state({ phase: "stopped" }))?.text).toBe("sidecar 连接已停止");
	expect(resolveSidecarRecoveryNotice(state({ phase: "error", lastError: "spawn failed" }))).toEqual({
		tone: "error",
		text: "sidecar 连接异常",
		detail: "spawn failed",
	});
});

test("SidecarRecoveryNotice renders no markup for hidden state and status markup for recovery", () => {
	const empty = renderToStaticMarkup(<SidecarRecoveryNotice state={state()} />);
	expect(empty).toBe("");
	const recovering = renderToStaticMarkup(<SidecarRecoveryNotice state={state({ phase: "recovering", restarts: 3 })} />);
	expect(recovering).toContain('id="sidecar-recovery-notice"');
	expect(recovering).toContain('role="status"');
	expect(recovering).toContain("sidecar 正在恢复连接");
	expect(recovering).toContain("已自动重启 3 次");
});
