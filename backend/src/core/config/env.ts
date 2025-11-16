import 'dotenv/config'
import { z } from 'zod'

/** Base schema */
const Base = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Comma-separated list of origins;
  CORS_ALLOWLIST: z.string().default(''),

  // Token config (durations as strings like "15m", "7d")
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  JWT_ISSUER: z.string().default('https://auth.studywell.app'),
  JWT_AUDIENCE: z.string().default('studywell-api'),

  // DB & Redis
  DATABASE_URL: z.string().url(),
  JOBS_ENABLED: z.coerce.boolean().default(true),
  REDIS_URL: z.string().url().optional(),

  // 32 bytes hex for AES-256-GCM (64 hex chars) — no global /g flag.
  ENCRYPTION_KEY_HEX: z.string().regex(/^[0-9a-fA-F]{64}$/, 'must be 64 hex chars (32 bytes)'),

  // Two possible JWT strategies:
  // - HMAC: JWT_SECRET (min 16)
  // - RSA:  JWT_PRIVATE_KEY + JWT_PUBLIC_KEY (PEM strings)
  JWT_SECRET: z.string().min(16).optional(),
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
})

/** Cross-field rules */
const EnvSchema = Base.superRefine((env, ctx) => {
  // Redis required only if jobs are enabled
  if (env.JOBS_ENABLED && !env.REDIS_URL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['REDIS_URL'],
      message: 'REDIS_URL is required when JOBS_ENABLED=true',
    })
  }

  // Exactly one JWT mode must be provided: secret OR keypair
  const hasSecret = !!env.JWT_SECRET
  const hasKeypair = !!env.JWT_PRIVATE_KEY && !!env.JWT_PUBLIC_KEY
  if (hasSecret === hasKeypair) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_SECRET'],
      message: 'Provide either JWT_SECRET or (JWT_PRIVATE_KEY + JWT_PUBLIC_KEY), but not both.',
    })
  }

  
  const ttlRe = /^\d+(ms|s|m|h|d)$/i
  if (!ttlRe.test(env.JWT_ACCESS_TTL)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['JWT_ACCESS_TTL'], message: 'Use formats like 15m, 1h, 7d' })
  }
  if (!ttlRe.test(env.JWT_REFRESH_TTL)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['JWT_REFRESH_TTL'], message: 'Use formats like 15m, 1h, 7d' })
  }
})

export type Env = z.infer<typeof EnvSchema>

function parse(): Env {
  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n - ')
    // keep it explicit and safe to read in CI logs
    // eslint-disable-next-line no-console
    console.error('Invalid environment:\n - ' + issues)
    process.exit(1)
  }
  return parsed.data
}

export const env = parse()

// ---------- Derived helpers----------
export const isProd = env.NODE_ENV === 'production'
export const corsOrigins: string[] = env.CORS_ALLOWLIST
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

export const encryptionKey = Buffer.from(env.ENCRYPTION_KEY_HEX, 'hex')

export function getJwtConfig():
  | { mode: 'secret'; secret: string }
  | { mode: 'keypair'; publicKey: string; privateKey: string }
{
  if (env.JWT_SECRET) return { mode: 'secret', secret: env.JWT_SECRET }
 
  return { mode: 'keypair', publicKey: env.JWT_PUBLIC_KEY!, privateKey: env.JWT_PRIVATE_KEY! }
}
