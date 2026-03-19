"use server";

import { z } from "zod";
import { getCustomerAuthSchema } from "@/lib/customer-auth-config";
import { hashPassword } from "@/lib/security/password";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

const signupSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email(),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(40)
      .regex(/^[a-z0-9._-]+$/),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignupState = {
  error?: string;
  success?: string;
};

export async function createUserAccountAction(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form values." };
  }

  const supabase = createSupabaseServiceRoleClient();
  const schema = getCustomerAuthSchema();
  const [{ data: emailExisting, error: emailError }, { data: usernameExisting, error: usernameError }] =
    await Promise.all([
      supabase
        .schema(schema)
        .from("users")
        .select("id")
        .ilike("email", parsed.data.email)
        .maybeSingle(),
      supabase
        .schema(schema)
        .from("users")
        .select("id")
        .ilike("username", parsed.data.username)
        .maybeSingle(),
    ]);

  if (emailError || usernameError) {
    return { error: emailError?.message ?? usernameError?.message ?? "Could not create account." };
  }

  if (emailExisting) {
    return { error: "An account with that email already exists." };
  }

  if (usernameExisting) {
    return { error: "That username is already taken." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const { error } = await supabase.schema(schema).from("users").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    username: parsed.data.username,
    password_hash: passwordHash,
    is_admin: false,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Account created. Use the same email as checkout to see past orders." };
}
