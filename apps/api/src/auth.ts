import jwt from "jsonwebtoken";
import { z } from "zod";
import type { UserRecord } from "./domain.js";

const claimsSchema = z.object({
  sub: z.string().min(1),
  role: z.enum(["operator", "admin"]),
});

export type AccessClaims = z.infer<typeof claimsSchema>;

export function issueAccessToken(user: UserRecord, secret: string): string {
  return jwt.sign({ role: user.role }, secret, {
    subject: user.id,
    algorithm: "HS256",
    expiresIn: "15m",
    issuer: "secure-dashboard-api",
    audience: "secure-dashboard-web",
  });
}

export function verifyAccessToken(token: string, secret: string): AccessClaims {
  const decoded = jwt.verify(token, secret, {
    algorithms: ["HS256"],
    issuer: "secure-dashboard-api",
    audience: "secure-dashboard-web",
  });

  return claimsSchema.parse(decoded);
}

