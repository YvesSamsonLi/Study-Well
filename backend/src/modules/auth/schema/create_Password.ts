import { z } from "zod";

/**
 * Strong password:
 * - Min 8 chars
 * - ≥1 lowercase
 * - ≥1 uppercase
 * - ≥1 number
 * - ≥1 special char
 */
export const PasswordStrongSchema = z
  .string()
  .min(8)
  .regex(/[a-z]/, "must include at least one lowercase letter")
  .regex(/[A-Z]/, "must include at least one uppercase letter")
  .regex(/\d/, "must include at least one number")
  .regex(/[\W_]/, "must include at least one special character");

export const PasswordAnySchema = z.string().min(1); // for login only
