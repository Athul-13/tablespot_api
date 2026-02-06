import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { AUTH_COOKIE_NAMES } from "@/types/auth";

const mockVerifyAccess = vi.fn();

const mockJwtService = {
  verifyAccess: (token: string) => mockVerifyAccess(token),
  signAccess: vi.fn(),
  signRefresh: vi.fn(),
  verifyRefresh: vi.fn(),
  getAccessTokenMaxAgeSeconds: vi.fn(),
  getRefreshTokenMaxAgeSeconds: vi.fn(),
};

function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    cookies: {},
    headers: {},
    ...overrides,
  } as Request;
}

function createMockRes(): Response {
  return {} as Response;
}

function createMockNext(): NextFunction {
  return vi.fn();
}

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls next() with req.user undefined when no token (no cookie, no Bearer header)", async () => {
    const req = createMockReq();
    const next = createMockNext();
    const handler = authMiddleware(mockJwtService as never);

    handler(req, createMockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeUndefined();
    expect(mockVerifyAccess).not.toHaveBeenCalled();
  });

  it("sets req.user from payload when valid Bearer token in Authorization header", async () => {
    const req = createMockReq({
      headers: { authorization: "Bearer my-access-token" },
    });
    const next = createMockNext();
    mockVerifyAccess.mockReturnValue({
      sub: "user-123",
      email: "user@example.com",
      name: "Test User",
    });

    const handler = authMiddleware(mockJwtService as never);
    handler(req, createMockRes(), next);

    expect(mockVerifyAccess).toHaveBeenCalledWith("my-access-token");
    expect(req.user).toEqual({
      id: "user-123",
      email: "user@example.com",
      name: "Test User",
    });
    expect(next).toHaveBeenCalledWith();
  });

  it("sets req.user from payload when valid token in cookie", async () => {
    const req = createMockReq({
      cookies: { [AUTH_COOKIE_NAMES.ACCESS_TOKEN]: "cookie-access-token" },
    });
    const next = createMockNext();
    mockVerifyAccess.mockReturnValue({
      sub: "user-456",
      email: "cookie@example.com",
      name: "Cookie User",
    });

    const handler = authMiddleware(mockJwtService as never);
    handler(req, createMockRes(), next);

    expect(mockVerifyAccess).toHaveBeenCalledWith("cookie-access-token");
    expect(req.user).toEqual({
      id: "user-456",
      email: "cookie@example.com",
      name: "Cookie User",
    });
    expect(next).toHaveBeenCalledWith();
  });

  it("prefers cookie over Authorization header when both present", async () => {
    const req = createMockReq({
      cookies: { [AUTH_COOKIE_NAMES.ACCESS_TOKEN]: "cookie-token" },
      headers: { authorization: "Bearer header-token" },
    });
    const next = createMockNext();
    mockVerifyAccess.mockReturnValue({
      sub: "u",
      email: "e@e.com",
      name: "N",
    });

    const handler = authMiddleware(mockJwtService as never);
    handler(req, createMockRes(), next);

    expect(mockVerifyAccess).toHaveBeenCalledWith("cookie-token");
  });

  it("calls next(invalidToken()) when verifyAccess throws", async () => {
    const req = createMockReq({
      headers: { authorization: "Bearer bad-token" },
    });
    const next = createMockNext();
    mockVerifyAccess.mockImplementation(() => {
      throw new Error("jwt expired");
    });

    const handler = authMiddleware(mockJwtService as never);
    handler(req, createMockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err).toMatchObject({
      name: "AuthError",
      code: "INVALID_TOKEN",
      statusCode: 401,
    });
  });

  it("uses name from payload when present, else falls back to email", async () => {
    const req = createMockReq({
      headers: { authorization: "Bearer t" },
    });
    const next = createMockNext();
    mockVerifyAccess.mockReturnValue({
      sub: "id",
      email: "nobody@example.com",
      name: "Display Name",
    });

    const handler = authMiddleware(mockJwtService as never);
    handler(req, createMockRes(), next);

    expect(req.user!.name).toBe("Display Name");
  });
});
