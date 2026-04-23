"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function submitContactAction(formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const message = formData.get("message")?.toString().trim();

  if (!name || !email || !message) {
    return { error: "Please fill out all fields." };
  }

  const supabase = createSupabaseServerClient();
  const { error } = await (supabase as any).from("contact_messages").insert({ name, email, message });

  if (error) {
    return { error: "An unexpected error occurred. Please try again." };
  }

  return { error: null, success: true };
}
