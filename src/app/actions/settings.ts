"use server";

import { requireAdminUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function saveSettingsAction(formData: FormData) {
  try {
    await requireAdminUser();

    const author_bio = formData.get("author_bio")?.toString() || null;
    const social_twitter = formData.get("social_twitter")?.toString() || null;
    const social_linkedin = formData.get("social_linkedin")?.toString() || null;
    const social_instagram = formData.get("social_instagram")?.toString() || null;

    const supabase = createSupabaseServerClient();
    const { error } = await (supabase as any)
      .from("site_settings")
      .update({
        author_bio,
        social_twitter,
        social_linkedin,
        social_instagram,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) {
       return { error: "Failed to save settings. Please try again." };
    }

    return { error: null, success: true };
  } catch (err: any) {
    if (err.message === "Unauthorized") {
       return { error: "You must be an admin to edit settings." };
    }
    return { error: "An unexpected error occurred." };
  }
}
