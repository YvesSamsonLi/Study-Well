import bcrypt from "bcryptjs";
import { PasswordStrongSchema } from "../schema/create_Password";

/**
 * Validate password strength and hash with bcrypt (12 rounds).
 * Use ONLY for registration/change password flows.
 */
export async function hashPwd(plain: string) {
  // Throws a ZodError with granular messages if invalid
  PasswordStrongSchema.parse(plain);
  return bcrypt.hash(plain, 12);
}
