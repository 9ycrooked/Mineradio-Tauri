import { fail, json } from "../http/envelope";

export type AudioProxyRequest = {
  target: string;
  request: Request;
};

export type AudioProxy = (input: AudioProxyRequest) => Promise<Response>;

export type AudioProxyDeps = {
  fetch?: (request: Request) => Promise<Response>;
};

const playbackRequestHeaders = ["range"];
const upstreamResponseHeaders = [
  "content-type",
  "content-length",
  "accept-ranges",
  "content-range",
  "cache-control",
  "etag",
  "last-modified"
];

export function createAudioProxy(deps: AudioProxyDeps = {}): AudioProxy {
  const fetcher = deps.fetch ?? fetch;

  return async function proxyAudio(input: AudioProxyRequest): Promise<Response> {
    const parsed = parseTargetUrl(input.target);
    if (!parsed.ok) {
      return badRequest(parsed.message);
    }

    const upstreamRequest = new Request(parsed.url, {
      method: "GET",
      headers: playbackHeadersFrom(input.request)
    });

    let upstream: Response;
    try {
      upstream = await fetcher(upstreamRequest);
    } catch {
      return upstreamFailure("upstream audio request failed");
    }

    if (!upstream.ok) {
      return upstreamFailure(`upstream audio request returned ${upstream.status}`);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeadersFrom(upstream)
    });
  };
}

export const resolveAudioProxy = createAudioProxy();

function parseTargetUrl(target: string): { ok: true; url: string } | { ok: false; message: string } {
  if (!target.trim()) {
    return { ok: false, message: "url required" };
  }

  try {
    const url = new URL(target);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, message: "url must use http or https" };
    }
    return { ok: true, url: url.toString() };
  } catch {
    return { ok: false, message: "invalid url" };
  }
}

function playbackHeadersFrom(request: Request): Headers {
  const headers = new Headers();
  for (const header of playbackRequestHeaders) {
    const value = request.headers.get(header);
    if (value !== null) {
      headers.set(header, value);
    }
  }
  return headers;
}

function responseHeadersFrom(upstream: Response): Headers {
  const headers = new Headers({
    "access-control-allow-origin": "*"
  });
  for (const header of upstreamResponseHeaders) {
    const value = upstream.headers.get(header);
    if (value !== null) {
      headers.set(header, value);
    }
  }
  return headers;
}

function badRequest(message: string): Response {
  return json(
    fail({
      code: "BAD_REQUEST",
      message,
      retryable: false
    }),
    400
  );
}

function upstreamFailure(message: string): Response {
  return json(
    fail({
      code: "UPSTREAM_AUDIO_PROXY",
      message,
      retryable: true
    }),
    502
  );
}
