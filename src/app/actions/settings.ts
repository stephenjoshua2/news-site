"use server";

import { requireAdminUser } from "@/lib/auth";
import { isValidHttpUrl } from "@/lib/media";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function readOptionalText(formData: FormData, key: string): string | null {
  const value = formData.get(key)?.toString().trim() ?? "";
  return value.length > 0 ? value : null;
}

function readOptionalUrl(formData: FormData, key: string): string | null {
  const value = readOptionalText(formData, key);

  if (!value) {
    return null;
  }

  if (value.length > 2048 || !isValidHttpUrl(value)) {
    throw new Error("invalid-url");
  }

  return value;
}

export async function saveSettingsAction(formData: FormData) {
  await requireAdminUser();

  try {
    const author_bio = readOptionalText(formData, "author_bio");
    const social_twitter = readOptionalUrl(formData, "social_twitter");
    const social_linkedin = readOptionalUrl(formData, "social_linkedin");
    const social_instagram = readOptionalUrl(formData, "social_instagram");

    if (author_bio && author_bio.length > 4000) {
      return { error: "Author bio must be 4,000 characters or fewer." };
    }

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
    if (err?.message === "invalid-url") {
      return { error: "Social links must be valid http:// or https:// URLs." };
    }

    return { error: "An unexpected error occurred." };
  }
}
