import type {
  Track,
  PlaylistSummary,
  PlaylistDetail,
  LyricLine,
  LyricPayload,
  PlayableState
} from "@mineradio/shared";

export interface HanaSong {
  id?: number | string;
  name?: string;
  ar?: Array<{ id?: number; name?: string } | null | undefined>;
  al?: { id?: number; name?: string; picUrl?: string } | null | undefined;
  dt?: number;
  fee?: number;
}

export interface HanaPlaylistBody {
  id?: number | string;
  name?: string;
  coverImgUrl?: string;
  trackCount?: number;
  trackIds?: Array<{ id?: number | string } | number | string>;
  tracks?: HanaSong[];
}

export function mapPlayable(
  fee: unknown,
  code: unknown,
  freeTrialInfo: unknown,
  cookie: boolean,
  url: string | null
): PlayableState {
  const f = typeof fee === "number" ? fee : -1;
  const c = typeof code === "number" ? code : 0;
  if (c === 200 && url) return "playable";
  if (c === 401) return "login_required";
  if (f === 1) return cookie && url ? "playable" : "vip_required";
  if (f === 4) return "paid_required";
  if (f === 8 && freeTrialInfo != null) return "trial_only";
  if (url) return "playable";
  return "unknown";
}

export function mapHanaSongToTrack(raw: HanaSong): Track {
  const idStr = raw && raw.id != null ? String(raw.id) : "";
  const ar = raw && Array.isArray(raw.ar) ? raw.ar : [];
  const artists: string[] = [];
  for (const a of ar) {
    if (a && typeof a === "object" && typeof a.name === "string" && a.name.length > 0) {
      artists.push(a.name);
    }
  }
  const al = raw && raw.al && typeof raw.al === "object" ? raw.al : null;
  const fee = raw && typeof raw.fee === "number" ? raw.fee : 0;
  const playableState: PlayableState =
    fee === 1 ? "vip_required" :
    fee === 4 ? "paid_required" :
    fee === 8 ? "trial_only" :
    "unknown";
  return {
    provider: "netease",
    id: idStr,
    sourceId: idStr,
    title: raw?.name ?? "",
    artists,
    album: al?.name ?? "",
    coverUrl: al?.picUrl ?? "",
    durationMs: typeof raw?.dt === "number" ? raw.dt : undefined,
    qualityHints: ["standard"],
    playableState
  };
}

export function parseLrc(text: string): LyricLine[] {
  const out: LyricLine[] = [];
  if (!text || typeof text !== "string") return out;
  const re = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
  for (const rawLine of text.split(/\r\n|\r|\n/)) {
    if (!rawLine) continue;
    const marks: Array<{ ms: number; end: number }> = [];
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(rawLine)) !== null) {
      const min = parseInt(m[1], 10);
      const sec = parseInt(m[2], 10);
      const fracRaw = m[3] ?? "";
      let frac = 0;
      if (fracRaw) {
        const padded = (fracRaw + "000").slice(0, 3);
        frac = parseInt(padded, 10);
      }
      marks.push({ ms: min * 60000 + sec * 1000 + frac, end: m.index + m[0].length });
    }
    if (marks.length === 0) continue;
    const last = marks[marks.length - 1];
    const lineText = rawLine.slice(last.end).trim();
    for (const mark of marks) out.push({ timeMs: mark.ms, text: lineText });
  }
  return out;
}

export function mapHanaLyricToPayload(opts: {
  trackId: string;
  lrc?: string;
  tlyric?: string;
  klyric?: string | null;
  yrc?: string | null;
}): LyricPayload {
  const lrcText = opts.lrc ?? "";
  const tlrc = opts.tlyric ?? "";
  const klrc = opts.klyric ?? "";
  const yrc = opts.yrc ?? "";
  const baseLines = parseLrc(lrcText);
  const transLines = parseLrc(tlrc);
  const transMap = new Map<number, string>();
  for (const t of transLines) transMap.set(t.timeMs, t.text);
  const lines: LyricLine[] = baseLines.map(l => {
    const tr = transMap.get(l.timeMs);
    return tr != null ? { timeMs: l.timeMs, text: l.text, translation: tr } : l;
  });
  const hasTranslation = tlrc.trim().length > 0 && transLines.length > 0;
  const isWordByWord = klrc.trim().length > 0 || yrc.trim().length > 0;
  return {
    provider: "netease",
    trackId: opts.trackId,
    lines,
    hasTranslation,
    isWordByWord
  };
}

export function mapHanaPlaylistToSummary(
  raw: HanaPlaylistBody,
  idHint?: string
): PlaylistSummary {
  const idStr = raw && raw.id != null ? String(raw.id) : (idHint ?? "");
  const trackIds: string[] = [];
  if (raw && Array.isArray(raw.trackIds)) {
    for (const t of raw.trackIds) {
      if (t && typeof t === "object" && "id" in t) {
        const s = String((t as { id: unknown }).id ?? "");
        if (s.length > 0) trackIds.push(s);
      } else {
        const s = String(t ?? "");
        if (s.length > 0) trackIds.push(s);
      }
    }
  }
  return {
    provider: "netease",
    id: idStr,
    name: raw?.name ?? "",
    coverUrl: raw?.coverImgUrl ?? "",
    trackCount: typeof raw?.trackCount === "number" ? raw.trackCount : undefined,
    trackIds
  };
}

export function mapHanaPlaylistToDetail(
  raw: HanaPlaylistBody | null | undefined,
  idHint?: string
): PlaylistDetail {
  if (!raw) {
    return {
      provider: "netease",
      id: idHint ?? "",
      name: "",
      coverUrl: "",
      trackCount: undefined,
      trackIds: [],
      tracks: []
    };
  }
  const summary = mapHanaPlaylistToSummary(raw, idHint);
  const tracks: Track[] = Array.isArray(raw.tracks) ? (raw.tracks as HanaSong[]).map(mapHanaSongToTrack) : [];
  return { ...summary, tracks };
}