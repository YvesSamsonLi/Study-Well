import { z } from "zod";
import { PasswordAnySchema } from "./create_Password";

export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: PasswordAnySchema, // e.g., z.string().min(8)
}).strict();

export type RegisterDTO = z.infer<typeof RegisterSchema>;
