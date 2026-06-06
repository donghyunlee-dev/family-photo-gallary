import { describe, expect, it } from "vitest";

import { getDriveErrorDetails } from "./errors";

describe("getDriveErrorDetails", () => {
  it("maps invalid_grant to refresh token guidance", () => {
    const result = getDriveErrorDetails(new Error("drive.files.list failed (invalid_grant)"));

    expect(result.code).toBe("oauth_refresh_invalid");
    expect(result.publicMessage).toContain("refresh token");
    expect(result.status).toBe(500);
  });

  it("maps invalid_client to client credential guidance", () => {
    const result = getDriveErrorDetails(new Error("invalid_client"));

    expect(result.code).toBe("oauth_client_invalid");
    expect(result.publicMessage).toContain("GOOGLE_OAUTH_CLIENT_ID");
  });

  it("maps permission errors to folder access guidance", () => {
    const result = getDriveErrorDetails(
      new Error("drive.files.create failed (The user does not have sufficient permissions for this file.)"),
    );

    expect(result.code).toBe("drive_permission_denied");
    expect(result.publicMessage).toContain("편집자");
  });

  it("maps storage quota failures to quota guidance", () => {
    const result = getDriveErrorDetails(new Error("storage quota exceeded"));

    expect(result.code).toBe("drive_quota_exceeded");
    expect(result.publicMessage).toContain("용량");
  });

  it("falls back for unknown errors", () => {
    const result = getDriveErrorDetails(new Error("unexpected failure"));

    expect(result.code).toBe("drive_unavailable");
    expect(result.publicMessage).toContain("잠시 후");
    expect(result.rawMessage).toBe("unexpected failure");
  });
});
