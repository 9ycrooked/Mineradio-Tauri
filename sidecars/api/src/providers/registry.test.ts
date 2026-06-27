import { expect, test } from "bun:test";
import { providers, buildCapabilityMatrix, PROVIDER_IDS } from "./registry";

test("registry exposes netease and qq adapters", () => {
  expect(providers.netease.id).toBe("netease");
  expect(providers.qq.id).toBe("qq");
  expect(PROVIDER_IDS).toEqual(["netease", "qq"]);
});

test("capability matrix: netease is online with capabilities; qq stays unavailable", () => {
  const m = buildCapabilityMatrix();
  expect(m.providers.length).toBe(2);
  const netease = m.providers.find(e => e.providerId === "netease");
  const qq = m.providers.find(e => e.providerId === "qq");
  expect(netease).toBeDefined();
  expect(netease?.available).toBe(true);
  expect(netease?.capabilities.length).toBeGreaterThan(0);
  expect(qq).toBeDefined();
  expect(qq?.available).toBe(false);
  expect(qq?.capabilities.length).toBe(0);
});