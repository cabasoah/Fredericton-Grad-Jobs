import { z } from "zod";
import { CompanyInputSchema } from "./companies";

export const USER_ROLES = ["SEEKER", "EMPLOYER"] as const;
export const UserRoleSchema = z.enum(USER_ROLES);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SEEKER: "Job seeker",
  EMPLOYER: "Employer",
};

export const PASSWORD_MIN_LENGTH = 10;
// bcrypt only uses the first 72 bytes of a password; longer ones would be
// silently truncated, so they are rejected instead.
export const PASSWORD_MAX_BYTES = 72;

// UTF-8 length in bytes, without TextEncoder (not in every runtime's types).
const utf8Length = (value: string) => encodeURIComponent(value).replace(/%[0-9A-F]{2}/g, "x").length;

// Emails are compared and stored lowercased.
const EmailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));

const NewPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .refine((value) => utf8Length(value) <= PASSWORD_MAX_BYTES, {
    message: `Password must be at most ${PASSWORD_MAX_BYTES} bytes`,
  });

const RegisterBaseSchema = z.strictObject({
  email: EmailSchema,
  password: NewPasswordSchema,
  name: z.string().trim().min(1, "Enter your name").max(100),
});

// POST /auth/register. Employers create their company at the same time.
export const RegisterSchema = z.discriminatedUnion("role", [
  RegisterBaseSchema.extend({ role: z.literal("SEEKER") }),
  RegisterBaseSchema.extend({ role: z.literal("EMPLOYER"), company: CompanyInputSchema }),
]);

// POST /auth/login. No length rules here so old passwords keep working.
export const LoginSchema = z.strictObject({
  email: EmailSchema,
  password: z.string().min(1, "Enter your password"),
});

// The signed-in user as returned by the API (never includes the password hash).
export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: UserRoleSchema,
  company: z.object({ id: z.string(), name: z.string() }).nullable(),
});

export const AuthResponseSchema = z.object({ user: UserSchema });

export type RegisterInput = z.input<typeof RegisterSchema>;
export type Register = z.infer<typeof RegisterSchema>;
export type LoginInput = z.input<typeof LoginSchema>;
export type User = z.infer<typeof UserSchema>;
