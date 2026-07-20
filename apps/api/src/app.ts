import bcrypt from "bcryptjs";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { z } from "zod";
import { issueAccessToken, verifyAccessToken } from "./auth.js";
import type { DataStore } from "./domain.js";

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

interface CreateAppOptions {
  store: DataStore;
  jwtSecret: string;
  webOrigin: string;
  rateLimitEnabled?: boolean;
}

interface AuthenticatedRequest extends Request {
  user?: { id: string; role: "operator" | "admin" };
}

export function createApp(options: CreateAppOptions) {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: options.webOrigin, credentials: false }));
  app.use(express.json({ limit: "32kb" }));

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: options.rateLimitEnabled === false ? 100_000 : 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  });

  app.post("/api/auth/login", loginLimiter, async (request, response, next) => {
    try {
      const credentials = credentialsSchema.parse(request.body);
      const user = await options.store.findUserByEmail(credentials.email);
      const valid = user && (await bcrypt.compare(credentials.password, user.passwordHash));

      if (!user || !valid) {
        response.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
        return;
      }

      response.json({
        accessToken: issueAccessToken(user, options.jwtSecret),
        expiresInSeconds: 900,
        user: { id: user.id, email: user.email, role: user.role },
      });
    } catch (error) {
      next(error);
    }
  });

  function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction) {
    const authorization = request.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      response.status(401).json({ error: { code: "UNAUTHORIZED", message: "Bearer token required" } });
      return;
    }

    try {
      const claims = verifyAccessToken(authorization.slice(7), options.jwtSecret);
      request.user = { id: claims.sub, role: claims.role };
      next();
    } catch {
      response.status(401).json({ error: { code: "UNAUTHORIZED", message: "Token is invalid or expired" } });
    }
  }

  app.get("/api/dashboard", requireAuth, async (request: AuthenticatedRequest, response, next) => {
    try {
      const rows = await options.store.listDashboard(request.user!.id);
      response.json({ data: rows, meta: { count: rows.length } });
    } catch (error) {
      next(error);
    }
  });

  app.use((_request, response) => {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
  });

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof z.ZodError) {
      response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Request validation failed", details: z.flattenError(error).fieldErrors } });
      return;
    }

    console.error(error);
    response.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unexpected server error" } });
  });

  return app;
}

