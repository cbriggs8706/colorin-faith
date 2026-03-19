import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCustomerAuthSchema } from "@/lib/customer-auth-config";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

type CustomerUserRecord = {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
};

export async function findCustomerUserByEmail(email: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .schema(getCustomerAuthSchema())
    .from("users")
    .select("id,name,email,username")
    .ilike("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as CustomerUserRecord;
}

export async function requireCustomerUser(options?: { callbackUrl?: string }) {
  const session = await auth();

  if (!session?.user?.email) {
    const callbackUrl = options?.callbackUrl ?? "/orders";
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const user = await findCustomerUserByEmail(session.user.email);

  if (!user) {
    redirect("/login");
  }

  return {
    session,
    user,
  };
}
