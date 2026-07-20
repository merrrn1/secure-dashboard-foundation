import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import type { DashboardRecord, DataStore, UserRecord } from "./domain.js";

const jwtSecret = "test-secret-that-is-long-enough-for-hs256";
let user: UserRecord;

const dashboard: DashboardRecord[] = [
  { id: "row-1", ownerId: "user-1", name: "Verification API", status: "healthy", updatedAt: "2026-07-18T10:00:00.000Z" },
];

const store: DataStore = {
  async findUserByEmail(email) {
    return email.toLowerCase() === user.email ? user : null;
  },
  async listDashboard(ownerId) {
    return dashboard.filter((row) => row.ownerId === ownerId);
  },
};

beforeAll(async () => {
  user = {
    id: "user-1",
    email: "operator@example.com",
    passwordHash: await bcrypt.hash("correct-password", 4),
    role: "operator",
  };
});

const app = createApp({ store, jwtSecret, webOrigin: "http://localhost:3000", rateLimitEnabled: false });

describe("secure dashboard API", () => {
  it("rejects invalid login credentials without revealing which field failed", async () => {
    const response = await request(app).post("/api/auth/login").send({ email: user.email, password: "wrong-password" });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("issues a short-lived access token and returns protected dashboard data", async () => {
    const login = await request(app).post("/api/auth/login").send({ email: user.email, password: "correct-password" });
    expect(login.status).toBe(200);
    expect(login.body.expiresInSeconds).toBe(900);

    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${login.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: dashboard, meta: { count: 1 } });
  });

  it("rejects protected requests without a bearer token", async () => {
    const response = await request(app).get("/api/dashboard");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });
});

