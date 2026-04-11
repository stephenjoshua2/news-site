import { redirect } from "next/navigation";

import { isAdminEmail, hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentAdminSession() {
  if (!hasSupabaseEnv()) {
    return {
      user: null,
      isAdmin: false,
    };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    user,
    isAdmin: isAdminEmail(user?.email),
  };
}

export async function requireAdminUser() {
  if (!hasSupabaseEnv()) {
    redirect("/login?error=missing-config");
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !isAdminEmail(user.email)) {
    redirect("/login?error=admin-required");
  }

  return user;
}
