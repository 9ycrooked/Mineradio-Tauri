import { expect, test } from "bun:test";
import { ProviderLoginStatusSchema, ProviderLogoutAckSchema, ProviderSessionCookieAckSchema } from "./session";

test("ProviderSessionCookieAckSchema accepts provider + stored ack without cookie", () => {
  const parsed = ProviderSessionCookieAckSchema.parse({
    provider: "netease",
    stored: true,
  });

  expect(parsed.provider).toBe("netease");
  expect(parsed.stored).toBe(true);
  expect(JSON.stringify(parsed)).not.toContain("MUSIC_U");
  expect(JSON.stringify(parsed)).not.toContain("cookie");
});

test("ProviderSessionCookieAckSchema rejects cookie-bearing responses", () => {
  const parsed = ProviderSessionCookieAckSchema.safeParse({
    provider: "qq",
    stored: true,
    cookie: "uin=123; qqmusic_key=secret",
  });

  expect(parsed.success).toBe(false);
});

test("ProviderLoginStatusSchema accepts profile summaries without cookie", () => {
  const parsed = ProviderLoginStatusSchema.parse({
    provider: "netease",
    loggedIn: true,
    nickname: "tester",
    userId: "42",
  });

  expect(parsed.loggedIn).toBe(true);
  expect(JSON.stringify(parsed)).not.toContain("MUSIC_U");
  expect(JSON.stringify(parsed)).not.toContain("cookie");
});

test("ProviderLoginStatusSchema accepts Netease VIP profile metadata without auth material", () => {
  const parsed = ProviderLoginStatusSchema.parse({
    provider: "netease",
    loggedIn: true,
    nickname: "tester",
    userId: "42",
    vipType: 11,
    vipLevel: "svip",
    isVip: true,
    isSvip: true,
    vipLabel: "黑胶SVIP",
  });

  expect(parsed.vipType).toBe(11);
  expect(parsed.vipLevel).toBe("svip");
  expect(parsed.isVip).toBe(true);
  expect(parsed.isSvip).toBe(true);
  expect(parsed.vipLabel).toBe("黑胶SVIP");
  expect(JSON.stringify(parsed)).not.toContain("MUSIC_U");
  expect(JSON.stringify(parsed)).not.toContain("cookie");
});

test("ProviderLoginStatusSchema still rejects cookie-bearing profile responses", () => {
  const parsed = ProviderLoginStatusSchema.safeParse({
    provider: "netease",
    loggedIn: true,
    userId: "42",
    cookie: "MUSIC_U=secret",
  });

  expect(parsed.success).toBe(false);
});

test("ProviderLogoutAckSchema accepts logout ack without auth material", () => {
  const parsed = ProviderLogoutAckSchema.parse({
    provider: "netease",
    loggedOut: true,
  });

  expect(parsed.loggedOut).toBe(true);
  expect(JSON.stringify(parsed)).not.toContain("cookie");
});
