"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectToStory(storyId: string, search: string): never {
  redirect(`/story/${storyId}?${search}#comment-form`);
}

export async function addCommentAction(formData: FormData) {
  const storyId = readText(formData, "story_id");
  const authorName = readText(formData, "author_name");
  const body = readText(formData, "body");

  if (!storyId) {
    redirect("/");
  }

  if (!hasSupabaseEnv()) {
    redirectToStory(storyId, "error=missing-config");
  }

  if (
    authorName.length < 2 ||
    authorName.length > 80 ||
    body.length < 2 ||
    body.length > 1000
  ) {
    redirectToStory(storyId, "error=comment-validation");
  }

  const supabase = createSupabaseServerClient();
  const { data: story } = await supabase
    .from("stories")
    .select("id")
    .eq("id", storyId)
    .eq("status", "published")
    .single();

  if (!story) {
    redirectToStory(storyId, "error=comment-story");
  }

  const { error } = await supabase.from("comments").insert({
    story_id: storyId,
    author_name: authorName,
    body,
  });

  if (error) {
    redirectToStory(storyId, "error=comment-save-failed");
  }

  revalidatePath(`/story/${storyId}`);

  redirectToStory(storyId, "notice=comment-posted");
}
