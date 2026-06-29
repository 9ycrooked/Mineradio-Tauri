import { fail } from "../http/envelope";
import type { ApiResponse, PlaybackRestriction, ProviderId } from "@mineradio/shared";
import { ProviderNotImplementedError, ProviderError } from "../providers/provider-adapter";

const REDACTED_PROVIDER_ERROR_MESSAGE = "provider error redacted";
const SENSITIVE_AUTH_PATTERNS = [
  /\bMUSIC_U\s*=/i,
  /\b__csrf\s*=/i,
  /\bNMTID\s*=/i,
  /\bqm_keyst\s*=/i,
  /\bqqmusic_key\s*=/i,
  /\bmusic_key\s*=/i,
  /\bwxskey\s*=/i,
  /\bp_skey\s*=/i,
  /\bskey\s*=/i,
  /\bpsrf_qqaccess_token\s*=/i,
  /\bpsrf_qqrefresh_token\s*=/i,
  /\bwxrefresh_token\s*=/i,
  /\bAuthorization\s*:/i,
  /\bCookie\s*:/i,
  /\bSet-Cookie\s*:/i,
  /\bBearer\s+[A-Za-z0-9._~+/=-]+/i
];

export function redactErrorMessage(message: string): string {
  const text = String(message ?? "");
  if (SENSITIVE_AUTH_PATTERNS.some(pattern => pattern.test(text))) {
    return REDACTED_PROVIDER_ERROR_MESSAGE;
  }
  return text;
}

function normalizeRestriction(restriction: PlaybackRestriction): PlaybackRestriction {
  return {
    provider: restriction.provider,
    category: restriction.category,
    action: restriction.action ?? "",
    message: redactErrorMessage(restriction.message),
    ...(restriction.code !== undefined ? { code: restriction.code } : {}),
    ...(restriction.fee !== undefined ? { fee: restriction.fee } : {}),
    ...(restriction.rawMessage !== undefined ? { rawMessage: redactErrorMessage(restriction.rawMessage) } : {}),
    ...(restriction.missingPlaybackKey !== undefined ? { missingPlaybackKey: restriction.missingPlaybackKey } : {})
  };
}

export function normalizeError(provider: ProviderId, err: unknown): ApiResponse<never> {
  if (err instanceof ProviderNotImplementedError) {
    return fail({
      code: err.code,
      message: redactErrorMessage(err.message),
      provider: err.provider,
      retryable: err.retryable,
      action: err.action
    });
  }
  if (err instanceof ProviderError) {
    const rawMessage = err.rawMessage ? redactErrorMessage(err.rawMessage) : undefined;
    const restriction = err.restriction ? normalizeRestriction(err.restriction) : undefined;
    const tried = err.tried?.map(entry => redactErrorMessage(entry));
    return fail({
      code: err.code,
      message: redactErrorMessage(err.message),
      provider: err.provider,
      retryable: err.retryable,
      action: err.action,
      playbackKeyReady: err.playbackKeyReady,
      restriction,
      reason: err.reason,
      qqCode: err.qqCode,
      rawMessage,
      tried
    });
  }
  const message = err instanceof Error ? err.message : String(err);
  return fail({
    code: "INTERNAL",
    message: redactErrorMessage(message),
    provider,
    retryable: true
  });
}
