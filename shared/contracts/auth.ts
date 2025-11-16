// shared/contracts/auth.ts
import { z } from "zod";

/* ================================================================
   HOW AUTH FLOW WORKS (Frontend vs Backend)
   ----------------------------------------------------------------
   1) Frontend calls POST /v1/auth/login with { email, password }.
   2) Backend verifies credentials, then responds with:
        { accessToken: "<JWT>", expiresIn: 1800 }
   3) Frontend stores that accessToken (in memory / app state or via
      a secure httpOnly cookie set by the server if you choose that approach).
   4) For protected API calls, frontend includes:
        Authorization: Bearer <accessToken>
   5) Backend middleware (requireAuth) verifies the token and attaches:
        req.user.sub, req.user.email, etc.
   6) Logout is stateless: frontend forgets the token and may call
      POST /v1/auth/logout {} for acknowledgement.
   ================================================================= */

/** ---------- Password helpers (mirror backend) ---------- */
export const PasswordStrongSchema = z
  .string()
  .min(8, "Must be at least 8 characters")
  .regex(/[a-z]/, "Must include at least one lowercase letter")
  .regex(/[A-Z]/, "Must include at least one uppercase letter")
  .regex(/\d/, "Must include at least one number")
  .regex(/[\W_]/, "Must include at least one special character");

/** For login only (server compares hash; no strength check here). */
export const PasswordAnySchema = z.string().min(1);

/** ---------- Auth payloads ---------- */
export const RegisterSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: PasswordStrongSchema,
  })
  .strict();

export const LoginSchema = z
  .object({
    email: z.string().email(),
    password: PasswordAnySchema,
  })
  .strict();

/**
 * Example (frontend):
 *   const { accessToken } = await api.post('/v1/auth/login', credentials);
 *   api.defaults.headers.Authorization = `Bearer ${accessToken}`;
 */

export const ChangePasswordSchema = z
  .object({
    oldPassword: PasswordAnySchema,
    newPassword: PasswordStrongSchema,
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .strict()
  .superRefine((d, ctx) => {
    if (d.newPassword !== d.confirmNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New passwords do not match",
        path: ["confirmNewPassword"],
      });
    }
    if (d.oldPassword === d.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New password must be different from old password",
        path: ["newPassword"],
      });
    }
  });

/** Logout sends an empty JSON body {} to avoid 415 errors in some clients. */
export const LogoutSchema = z.object({}).strict();

/** ---------- Responses ---------- */

/** Returned by POST /v1/auth/login (and optionally /v1/auth/register if auto-login). */
export const AccessTokenSchema = z
  .object({
    accessToken: z.string(), // JWT signed by backend
    expiresIn: z.number(),   // token lifetime (seconds)
  })
  .strict();

/** Returned by GET /v1/auth/me when Authorization header is present and valid. */
export const MeSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().min(1),
  })
  .strict();

/** Generic message response, e.g. { "message": "Password updated" } */
export const MessageSchema = z.object({ message: z.string() }).strict();

/** ---------- Tiny FE helpers ---------- */
/** Build the Authorization header value from an access token. */
export const buildAuthHeader = (token: string) => `Bearer ${token}` as const;
/** Convenience: turn token into a headers object for fetch/axios. */
export const authHeaders = (token: string) => ({ Authorization: buildAuthHeader(token) });

/** ---------- Shared Types (FE & BE) ---------- */
export type RegisterDTO = z.infer<typeof RegisterSchema>;
export type LoginDTO = z.infer<typeof LoginSchema>;
export type ChangePasswordDTO = z.infer<typeof ChangePasswordSchema>;
export type LogoutDTO = z.infer<typeof LogoutSchema>;

export type AccessTokenDTO = z.infer<typeof AccessTokenSchema>;
export type MeDTO = z.infer<typeof MeSchema>;
export type MessageDTO = z.infer<typeof MessageSchema>;
