"use server";

import { revalidatePath } from "next/cache";

import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export type CommentActionState = {
  status: "idle" | "success" | "error";
  message: string;
  newComment?: {
    id: string;
    story_id: string;
    author_name: string;
    body: string;
    parent_id: string | null;
    created_at: string;
  };
};

export async function addCommentAction(
  _prevState: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  const storyId = readText(formData, "story_id");
  const authorName = readText(formData, "author_name");
  const body = readText(formData, "body");
  const parentId = readText(formData, "parent_id") || null;

  if (!storyId) {
    return { status: "error", message: "Invalid story." };
  }

  if (!hasSupabaseEnv()) {
    return { status: "error", message: "The newsroom backend is not configured." };
  }

  if (authorName.length < 2 || authorName.length > 80) {
    return { status: "error", message: "Name must be between 2 and 80 characters." };
  }

  if (body.length < 2 || body.length > 1000) {
    return { status: "error", message: "Comment must be between 2 and 1000 characters." };
  }

  const supabase = createSupabaseServerClient();

  // Verify story exists and is published
  try {
    const { data: story } = await supabase
      .from("stories")
      .select("id")
      .eq("id", storyId)
      .eq("status", "published")
      .single();

    if (!story) {
      return { status: "error", message: "This story is no longer accepting comments." };
    }

    // If replying, verify parent comment exists
    if (parentId) {
      const { data: parentComment } = await supabase
        .from("comments")
        .select("id")
        .eq("id", parentId)
        .eq("story_id", storyId)
        .single();

      if (!parentComment) {
        return { status: "error", message: "The comment you're replying to no longer exists." };
      }
    }

    const { data: newComment, error } = await supabase
      .from("comments")
      .insert({
        story_id: storyId,
        author_name: authorName,
        body,
        parent_id: parentId,
      })
      .select("*")
      .single();

    if (error || !newComment) {
      return { status: "error", message: "Your comment could not be saved. IMPORTANT: Have you run the schema-replies-migration.sql script in your Supabase SQL editor? The parent_id column might be missing." };
    }

    revalidatePath(`/story/${storyId}`);

    return {
      status: "success",
      message: "Your comment has been posted.",
      newComment,
    };
  } catch (err) {
    console.error("Comment submission error:", err);
    return { status: "error", message: "An unexpected database error occurred. Ensure your Supabase migrations are up to date." };
  }
}

export async function deleteCommentAction(commentId: string, storyId: string) {
  if (!hasSupabaseEnv()) {
    return { status: "error", message: "Backend not configured" };
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("comments").delete().eq("id", commentId);

  if (error) {
    console.error("Delete comment error:", error);
    return { status: "error", message: "Failed to delete comment" };
  }

  revalidatePath(`/story/${storyId}`);
  return { status: "success" };
}
