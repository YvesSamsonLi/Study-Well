// auth/schema/change_Password_Schema.ts
import { z } from "zod";
import { PasswordAnySchema, PasswordStrongSchema } from "./create_Password";

/**
 * PATCH /auth/password
 * - oldPassword: any non-empty string (we only verify against stored hash)
 * - newPassword: must meet strong password policy
 * - confirmNewPassword: must match newPassword
 * - also enforces: newPassword !== oldPassword
 */
export const ChangePasswordSchema = z
  .object({
    oldPassword: PasswordAnySchema,
    newPassword: PasswordStrongSchema,
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New passwords do not match",
        path: ["confirmNewPassword"],
      });
    }
    if (data.oldPassword === data.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New password must be different from old password",
        path: ["newPassword"],
      });
    }
  });

export type ChangePasswordDTO = z.infer<typeof ChangePasswordSchema>;
