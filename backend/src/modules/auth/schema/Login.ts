import { z } from "zod";
import { PasswordAnySchema } from "./create_Password";

/** POST /auth/login payload (no strength checks here) */
export const LoginSchema = z
  .object({
    email: z.string().email(),
    password: PasswordAnySchema, // e.g., z.string().min(8)
  })
  .strict();

export type LoginDTO = z.infer<typeof LoginSchema>;
