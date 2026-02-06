import "reflect-metadata";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import * as crypto from "crypto";
import { createApp } from "@/app";
import { prisma } from "@/lib/prisma";

const app = createApp();

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function uniqueEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`;
}

/** Build Cookie header value from Set-Cookie response header (array or string). */
function toCookieHeader(setCookie: string | string[] | undefined): string {
  const arr = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  return arr.map((c) => c.split(";")[0].trim()).join("; ");
}

describe("Auth routes (integration)", () => {
  let testUserEmail: string;
  let testUserPassword: string;

  beforeAll(async () => {
    testUserEmail = uniqueEmail();
    testUserPassword = "password123";
    await request(app)
      .post("/auth/signup")
      .send({ name: "Forgot Password User", email: testUserEmail, password: testUserPassword });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /auth/signup", () => {
    it("returns 201 and user (id, email, name; no password) on valid body", async () => {
      const email = uniqueEmail();
      const res = await request(app)
        .post("/auth/signup")
        .send({
          name: "Integration User",
          email,
          password: "password123",
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toMatchObject({
        email,
        name: "Integration User",
      });
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user).not.toHaveProperty("password");
      expect(res.body.user).not.toHaveProperty("passwordHash");
    });

    it("returns 400 with validation errors on invalid body", async () => {
      const res = await request(app)
        .post("/auth/signup")
        .send({
          name: "A",
          email: "not-an-email",
          password: "short",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
      expect(res.body.details).toBeDefined();
    });

    it("returns 400 with EMAIL_ALREADY_EXISTS message on duplicate email", async () => {
      const email = uniqueEmail();
      await request(app)
        .post("/auth/signup")
        .send({ name: "First", email, password: "password123" });

      const res = await request(app)
        .post("/auth/signup")
        .send({ name: "Second", email, password: "otherpassword" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already registered/i);
    });
  });

  describe("POST /auth/login", () => {
    it("returns 200, user, and Set-Cookie for access and refresh on valid credentials", async () => {
      const email = uniqueEmail();
      await request(app)
        .post("/auth/signup")
        .send({ name: "Login User", email, password: "mypassword" });

      const res = await request(app)
        .post("/auth/login")
        .send({ email, password: "mypassword" });

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({ email, name: "Login User" });
      expect(res.body.user).toHaveProperty("id");
      const setCookie = res.headers["set-cookie"];
      const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
      expect(cookies.some((c) => c.includes("accessToken="))).toBe(true);
      expect(cookies.some((c) => c.includes("refreshToken="))).toBe(true);
    });

    it("returns 401 on invalid credentials", async () => {
      const email = uniqueEmail();
      await request(app)
        .post("/auth/signup")
        .send({ name: "User", email, password: "correct" });

      const res = await request(app)
        .post("/auth/login")
        .send({ email, password: "wrongpassword" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("POST /auth/refresh", () => {
    it("returns 401 when no refresh cookie", async () => {
      const res = await request(app).post("/auth/refresh");

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/refresh token required/i);
    });

    it("returns 200 and new tokens when valid refresh cookie", async () => {
      const email = uniqueEmail();
      const signupRes = await request(app)
        .post("/auth/signup")
        .send({ name: "Refresh User", email, password: "password" });
      expect(signupRes.status).toBe(201);

      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email, password: "password" });
      expect(loginRes.status).toBe(200);
      const cookieHeader = toCookieHeader(loginRes.headers["set-cookie"]);
      expect(cookieHeader).toBeTruthy();

      const refreshRes = await request(app)
        .post("/auth/refresh")
        .set("Cookie", cookieHeader);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.user).toMatchObject({ email, name: "Refresh User" });
      expect(refreshRes.headers["set-cookie"]).toBeDefined();
    });
  });

  describe("POST /auth/logout", () => {
    it("returns 200 and clears cookies; refresh with old cookie then returns 401", async () => {
      const email = uniqueEmail();
      const signupRes = await request(app)
        .post("/auth/signup")
        .send({ name: "Logout User", email, password: "password" });
      expect(signupRes.status).toBe(201);

      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email, password: "password" });
      expect(loginRes.status).toBe(200);
      const cookieHeader = toCookieHeader(loginRes.headers["set-cookie"]);
      expect(cookieHeader).toBeTruthy();

      const logoutRes = await request(app)
        .post("/auth/logout")
        .set("Cookie", cookieHeader);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.ok).toBe(true);

      const refreshAfterLogout = await request(app)
        .post("/auth/refresh")
        .set("Cookie", cookieHeader);

      expect(refreshAfterLogout.status).toBe(401);
    });
  });

  describe("POST /auth/forgot-password", () => {
    it("returns 200 with same message regardless of email existence", async () => {
      const resExisting = await request(app)
        .post("/auth/forgot-password")
        .send({ email: testUserEmail });

      const resUnknown = await request(app)
        .post("/auth/forgot-password")
        .send({ email: "nonexistent@example.com" });

      expect(resExisting.status).toBe(200);
      expect(resUnknown.status).toBe(200);
      expect(resExisting.body.message).toBe(resUnknown.body.message);
      expect(resExisting.body.message).toMatch(/if an account exists/i);
    });

    it("returns 400 on invalid body", async () => {
      const res = await request(app)
        .post("/auth/forgot-password")
        .send({ email: "not-an-email" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });
  });

  describe("POST /auth/reset-password", () => {
    it("returns 200 on valid token and new password", async () => {
      const email = uniqueEmail();
      const signupRes = await request(app)
        .post("/auth/signup")
        .send({ name: "Reset User", email, password: "oldpass12" });
      expect(signupRes.status).toBe(201);
      expect(signupRes.body.user).toBeDefined();
      const userId = signupRes.body.user.id;

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 3600000);
      await prisma.passwordResetToken.create({
        data: { userId, tokenHash, expiresAt },
      });

      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: rawToken, newPassword: "newpassword123" });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/successfully/i);

      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email, password: "newpassword123" });
      expect(loginRes.status).toBe(200);
    });

    it("returns 401 on invalid or expired token", async () => {
      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: "invalid-token", newPassword: "newpass123" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("GET /auth/me", () => {
    it("returns 401 when no token", async () => {
      const res = await request(app).get("/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/unauthorized/i);
    });

    it("returns 200 and user when Authorization Bearer accessToken", async () => {
      const email = uniqueEmail();
      const signupRes = await request(app)
        .post("/auth/signup")
        .send({ name: "Me User", email, password: "password" });
      expect(signupRes.status).toBe(201);

      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email, password: "password" });
      expect(loginRes.status).toBe(200);
      const setCookie = loginRes.headers["set-cookie"];
      const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
      const accessCookie = cookies.find((c) => c.startsWith("accessToken="));
      const cookiePart = accessCookie ? accessCookie.split(";")[0] : "";
      const accessToken = cookiePart.includes("=")
        ? cookiePart.slice(cookiePart.indexOf("=") + 1).trim()
        : null;
      expect(accessToken).toBeTruthy();

      const meRes = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body).toMatchObject({ email, name: "Me User" });
      expect(meRes.body).toHaveProperty("id");
    });
  });

  describe("POST /auth/change-password", () => {
    it("returns 401 when no Authorization header", async () => {
      const res = await request(app)
        .post("/auth/change-password")
        .send({ currentPassword: "old", newPassword: "newpass123" });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/unauthorized/i);
    });

    it("returns 200 and success message on valid auth and passwords", async () => {
      const email = uniqueEmail();
      const oldPassword = "oldpass123";
      await request(app)
        .post("/auth/signup")
        .send({ name: "Change Password User", email, password: oldPassword });

      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email, password: oldPassword });
      expect(loginRes.status).toBe(200);
      const setCookie = loginRes.headers["set-cookie"];
      const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
      const accessCookie = cookies.find((c) => c.startsWith("accessToken="));
      const cookiePart = accessCookie ? accessCookie.split(";")[0] : "";
      const accessToken = cookiePart.includes("=")
        ? cookiePart.slice(cookiePart.indexOf("=") + 1).trim()
        : null;
      expect(accessToken).toBeTruthy();

      const changeRes = await request(app)
        .post("/auth/change-password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ currentPassword: oldPassword, newPassword: "newpass456" });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.message).toMatch(/password changed/i);

      const loginWithNew = await request(app)
        .post("/auth/login")
        .send({ email, password: "newpass456" });
      expect(loginWithNew.status).toBe(200);
      expect(loginWithNew.body.user).toMatchObject({ email, name: "Change Password User" });
    });

    it("returns 401 when current password is wrong", async () => {
      const email = uniqueEmail();
      await request(app)
        .post("/auth/signup")
        .send({ name: "Wrong Current User", email, password: "correctpass" });

      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email, password: "correctpass" });
      const setCookie = loginRes.headers["set-cookie"];
      const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
      const accessCookie = cookies.find((c) => c.startsWith("accessToken="));
      const cookiePart = accessCookie ? accessCookie.split(";")[0] : "";
      const accessToken = cookiePart.includes("=")
        ? cookiePart.slice(cookiePart.indexOf("=") + 1).trim()
        : null;

      const res = await request(app)
        .post("/auth/change-password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ currentPassword: "wrongcurrent", newPassword: "newpass123" });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid|password/i);
    });

    it("returns 400 when body validation fails", async () => {
      const email = uniqueEmail();
      await request(app)
        .post("/auth/signup")
        .send({ name: "Validation User", email, password: "password" });
      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email, password: "password" });
      const setCookie = loginRes.headers["set-cookie"];
      const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
      const accessCookie = cookies.find((c) => c.startsWith("accessToken="));
      const cookiePart = accessCookie ? accessCookie.split(";")[0] : "";
      const accessToken = cookiePart.includes("=")
        ? cookiePart.slice(cookiePart.indexOf("=") + 1).trim()
        : null;

      const res = await request(app)
        .post("/auth/change-password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ currentPassword: "password", newPassword: "short" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
      expect(res.body.details).toBeDefined();
    });
  });
});
