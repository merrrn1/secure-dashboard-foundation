import { resolve } from "node:path";
import { config as loadEnvironment } from "dotenv";
import { z } from "zod";

loadEnvironment({
  path: [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")],
  quiet: true,
});

const environmentSchema = z.object({
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  API_PORT: z.coerce.number().int().positive().default(4000),
});

export type AppConfig = z.infer<typeof environmentSchema>;

export function readConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  return environmentSchema.parse(environment);
}

