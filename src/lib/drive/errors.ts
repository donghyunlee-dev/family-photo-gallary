export type DriveErrorDetails = {
  code:
    | "oauth_refresh_invalid"
    | "oauth_client_invalid"
    | "oauth_env_missing"
    | "drive_permission_denied"
    | "drive_quota_exceeded"
    | "drive_unavailable";
  publicMessage: string;
  rawMessage: string;
  status: number;
};

function getRawMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "unknown drive error";
}

function includesAny(message: string, patterns: string[]) {
  return patterns.some((pattern) => message.includes(pattern));
}

export function getDriveErrorDetails(error: unknown): DriveErrorDetails {
  const rawMessage = getRawMessage(error);
  const normalizedMessage = rawMessage.toLowerCase();

  if (includesAny(normalizedMessage, ["invalid_grant", "invalid grant"])) {
    return {
      code: "oauth_refresh_invalid",
      publicMessage:
        "Google Drive 연결이 만료되었습니다. 관리자에게 Google OAuth refresh token을 다시 발급해 환경변수를 갱신해 달라고 요청해 주세요.",
      rawMessage,
      status: 500,
    };
  }

  if (normalizedMessage.includes("invalid_client")) {
    return {
      code: "oauth_client_invalid",
      publicMessage:
        "Google OAuth 클라이언트 정보가 올바르지 않습니다. `GOOGLE_OAUTH_CLIENT_ID` 와 `GOOGLE_OAUTH_CLIENT_SECRET` 값을 다시 확인해 주세요.",
      rawMessage,
      status: 500,
    };
  }

  if (
    includesAny(normalizedMessage, [
      "google oauth env vars are missing",
      "failed to acquire google oauth access token",
    ])
  ) {
    return {
      code: "oauth_env_missing",
      publicMessage:
        "Google OAuth 환경변수가 누락되었거나 액세스 토큰 발급에 실패했습니다. Vercel 환경변수를 다시 확인해 주세요.",
      rawMessage,
      status: 500,
    };
  }

  if (
    includesAny(normalizedMessage, [
      "insufficientfilepermissions",
      "file not found",
      "notfound",
      "the user does not have sufficient permissions",
    ])
  ) {
    return {
      code: "drive_permission_denied",
      publicMessage:
        "Google Drive 권한이 없거나 대상 폴더를 찾지 못했습니다. OAuth 계정이 해당 폴더의 편집자로 추가되어 있는지 확인해 주세요.",
      rawMessage,
      status: 500,
    };
  }

  if (includesAny(normalizedMessage, ["storage quota", "quota exceeded", "quotaexceeded"])) {
    return {
      code: "drive_quota_exceeded",
      publicMessage:
        "Google Drive 저장 용량이 부족합니다. Drive 용량을 확보한 뒤 다시 시도해 주세요.",
      rawMessage,
      status: 500,
    };
  }

  return {
    code: "drive_unavailable",
    publicMessage: "Google Drive 요청이 실패했습니다. 잠시 후 다시 시도해 주세요.",
    rawMessage,
    status: 500,
  };
}
