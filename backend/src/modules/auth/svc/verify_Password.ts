// auth/svc/verify_Password.ts
import bcrypt from "bcryptjs";

export async function verifyPassword(plain: string, hashed?: string | null) {
  if (!hashed || typeof hashed !== "string") return false;
  try {
    return await bcrypt.compare(plain, hashed);
  } catch {
    return false;
  }
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}
