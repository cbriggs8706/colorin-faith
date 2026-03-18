import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseAuthEnv, isAdminEmail } from "@/lib/supabase/env";

export async function getAdminUser() {
  if (!hasSupabaseAuthEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    return null;
  }

  return user;
}

export async function requireAdminUser() {
  const user = await getAdminUser();

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}
