import type { ApiError, ApiResponse } from "@mineradio/shared";

export type JsonBody = ApiResponse<unknown> | { ok: true };

export function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data };
}

export function fail(opts: ApiError): ApiResponse<never> {
  return {
    ok: false,
    error: opts
  };
}

export function json(body: JsonBody, status = 200): Response {
  return Response.json(body, { status });
}
