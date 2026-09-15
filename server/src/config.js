const { z } = require("zod");

const booleanFromEnv = z.enum(["true", "false"]).transform((value) => value === "true");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  CLIENT_ORIGIN: z.string().default("http://localhost:3000"),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().int().positive().default(3310),
  DB_USER: z.string().default("root"),
  DB_PASSWORD: z.string().default("local_change_me"),
  DB_NAME: z.string().default("tcc-projeto"),
  DB_POOL_SIZE: z.coerce.number().int().min(1).max(100).default(10),
  JWT_SECRET: z.string().min(32).default("development-only-secret-change-before-production"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  COOKIE_SECURE: booleanFromEnv.default("false"),
  WEBHOOK_SECRET: z.string().min(16).optional(),
  AI_SERVICE_URL: z.string().url().default("http://localhost:8000"),
  EVOLUTION_API_URL: z.string().url().default("http://localhost:8080"),
  EVOLUTION_API_KEY: z.string().default(""),
  EVOLUTION_INSTANCE: z.string().default(""),
  NUMERO_AUTORIZADO: z.string().default(""),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Configuração inválida:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (parsed.data.NODE_ENV === "production" && parsed.data.JWT_SECRET.startsWith("development-")) {
  console.error("JWT_SECRET precisa ser configurado em produção.");
  process.exit(1);
}
if (parsed.data.NODE_ENV === "production" && !parsed.data.WEBHOOK_SECRET) {
  console.error("WEBHOOK_SECRET precisa ser configurado em produção.");
  process.exit(1);
}

module.exports = Object.freeze(parsed.data);
