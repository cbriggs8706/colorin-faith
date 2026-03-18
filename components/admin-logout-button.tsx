"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AdminLogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/admin/login");
      router.refresh();
    });
  }

  return (
    <button className="secondary-button" disabled={isPending} onClick={handleLogout} type="button">
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
