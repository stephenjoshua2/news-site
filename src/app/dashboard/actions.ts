"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminUser } from "@/lib/auth";
import {
  MAX_IMAGE_FILE_SIZE,
  MAX_VIDEO_FILE_SIZE,
  STORY_IMAGE_BUCKET,
  STORY_VIDEO_BUCKET,
  isAllowedImageType,
  isAllowedVideoType,
  isValidHttpUrl,
} from "@/lib/media";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, StoryStatus } from "@/lib/types";

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalText(formData: FormData, key: string): string | null {
  const value = readText(formData, key);
  return value.length > 0 ? value : null;
}

function isProvidedFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File && value.size > 0;
}

function sanitizeFileName(fileName: string): string {
  return fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
}

function redirectToDashboard(search: string): never {
  redirect(`/dashboard?${search}`);
}

function isPermissionError(error: { code?: string | null; message?: string | null }) {
  return (
    error.code === "42501" ||
    error.message?.toLowerCase().includes("row-level security") === true
  );
}

async function removeStorageObject(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  bucket: string,
  path?: string | null,
) {
  if (!path) {
    return;
  }

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(error.message);
  }
}

async function uploadStorageObject(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  bucket: string,
  storyId: string,
  userId: string,
  file: File,
  existingPath?: string | null,
) {
  if (existingPath) {
    await removeStorageObject(supabase, bucket, existingPath);
  }

  const objectPath = `${userId}/${storyId}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(objectPath, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(objectPath);

  return {
    path: objectPath,
    url: publicUrl,
  };
}

function validateStoryFields(input: {
  title: string;
  category: string;
  location: string | null;
  excerpt: string;
  content: string;
  featuredImageUrlInput: string | null;
  videoCaptionInput: string | null;
}) {
  const {
    title,
    category,
    location,
    excerpt,
    content,
    featuredImageUrlInput,
    videoCaptionInput,
  } = input;

  if (
    title.length < 3 ||
    title.length > 180 ||
    category.length < 2 ||
    category.length > 80 ||
    (location !== null && location.length > 120) ||
    excerpt.length < 10 ||
    excerpt.length > 280 ||
    content.length < 20
  ) {
    redirectToDashboard("error=story-validation");
  }

  if (featuredImageUrlInput && !isValidHttpUrl(featuredImageUrlInput)) {
    redirectToDashboard("error=image-url");
  }

  if (videoCaptionInput && videoCaptionInput.length > 200) {
    redirectToDashboard("error=video-caption");
  }
}

export async function signOutAction() {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();

  redirect("/login?notice=signed-out");
}

export async function saveStoryAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirectToDashboard("error=missing-config");
  }

  const user = await requireAdminUser();
  const supabase = createSupabaseServerClient();

  const storyId = readText(formData, "story_id");
  const nextStatus: StoryStatus =
    readText(formData, "intent") === "publish" ? "published" : "draft";

  const title = readText(formData, "title");
  const category = readText(formData, "category");
  const excerpt = readText(formData, "excerpt");
  const content = readText(formData, "content");

  if (!title || !category || !excerpt || !content) {
    redirectToDashboard("error=story-validation");
  }

  const location = readOptionalText(formData, "location");
  const featuredImageUrlInput = readOptionalText(formData, "featured_image_url");
  const featuredImageFile = formData.get("featured_image_file");
  const videoFile = formData.get("video_file");
  const removeFeaturedImage = formData.get("remove_featured_image") === "on";
  const removeVideo = formData.get("remove_video") === "on";
  const videoCaptionInput = readOptionalText(formData, "video_caption");

  validateStoryFields({
    title,
    category,
    location,
    excerpt,
    content,
    featuredImageUrlInput,
    videoCaptionInput,
  });

  if (isProvidedFile(featuredImageFile)) {
    if (!isAllowedImageType(featuredImageFile.type)) {
      redirectToDashboard("error=image-type");
    }

    if (featuredImageFile.size > MAX_IMAGE_FILE_SIZE) {
      redirectToDashboard("error=image-size");
    }
  }

  if (isProvidedFile(videoFile)) {
    if (!isAllowedVideoType(videoFile.type)) {
      redirectToDashboard("error=video-type");
    }

    if (videoFile.size > MAX_VIDEO_FILE_SIZE) {
      redirectToDashboard("error=video-size");
    }
  }

  const storyPayload: Database["public"]["Tables"]["stories"]["Update"] = {
    title,
    category,
    location,
    excerpt,
    content,
    status: nextStatus,
  };

  type EditableStory = {
    id: string;
    published_at: string | null;
    featured_image_path: string | null;
    video_path: string | null;
  };

  let selectedStory: EditableStory;

  if (storyId) {
    const { data, error } = await supabase
      .from("stories")
      .select("id, published_at, featured_image_path, video_path")
      .eq("id", storyId)
      .eq("author_id", user.id)
      .single();

    if (error || !data) {
      redirectToDashboard("error=story-not-found");
    }

    selectedStory = data;
    storyPayload.published_at =
      nextStatus === "published"
        ? selectedStory.published_at ?? new Date().toISOString()
        : null;

    const { error: updateError } = await supabase
      .from("stories")
      .update(storyPayload)
      .eq("id", storyId)
      .eq("author_id", user.id);

    if (updateError) {
      if (isPermissionError(updateError)) {
        redirectToDashboard("error=admin-setup");
      }

      redirectToDashboard("error=story-save-failed");
    }
  } else {
    storyPayload.published_at =
      nextStatus === "published" ? new Date().toISOString() : null;

    const { data, error } = await supabase
      .from("stories")
      .insert({
        author_id: user.id,
        title,
        category,
        location,
        excerpt,
        content,
        status: nextStatus,
        published_at: storyPayload.published_at,
      })
      .select("id, published_at, featured_image_path, video_path")
      .single();

    if (error || !data) {
      if (error && isPermissionError(error)) {
        redirectToDashboard("error=admin-setup");
      }

      redirectToDashboard("error=story-save-failed");
    }

    selectedStory = data;
  }

  const mediaUpdate: Database["public"]["Tables"]["stories"]["Update"] = {};

  try {
    if (removeFeaturedImage) {
      await removeStorageObject(
        supabase,
        STORY_IMAGE_BUCKET,
        selectedStory.featured_image_path,
      );
      selectedStory.featured_image_path = null;
      mediaUpdate.featured_image_path = null;
      mediaUpdate.featured_image_url = null;
    }

    if (isProvidedFile(featuredImageFile)) {
      try {
        const upload = await uploadStorageObject(
          supabase,
          STORY_IMAGE_BUCKET,
          selectedStory.id,
          user.id,
          featuredImageFile,
          selectedStory.featured_image_path,
        );

        selectedStory.featured_image_path = upload.path;
        mediaUpdate.featured_image_path = upload.path;
        mediaUpdate.featured_image_url = upload.url;
      } catch {
        redirectToDashboard("error=storage-upload-failed");
      }
    } else if (featuredImageUrlInput) {
      if (selectedStory.featured_image_path) {
        await removeStorageObject(
          supabase,
          STORY_IMAGE_BUCKET,
          selectedStory.featured_image_path,
        );
        selectedStory.featured_image_path = null;
      }

      mediaUpdate.featured_image_path = null;
      mediaUpdate.featured_image_url = featuredImageUrlInput;
    }

    if (removeVideo) {
      await removeStorageObject(supabase, STORY_VIDEO_BUCKET, selectedStory.video_path);
      selectedStory.video_path = null;
      mediaUpdate.video_path = null;
      mediaUpdate.video_url = null;
    }

    if (isProvidedFile(videoFile)) {
      try {
        const upload = await uploadStorageObject(
          supabase,
          STORY_VIDEO_BUCKET,
          selectedStory.id,
          user.id,
          videoFile,
          selectedStory.video_path,
        );

        selectedStory.video_path = upload.path;
        mediaUpdate.video_path = upload.path;
        mediaUpdate.video_url = upload.url;
      } catch {
        redirectToDashboard("error=storage-upload-failed");
      }
    }
  } catch {
    redirectToDashboard("error=storage-delete-failed");
  }

  mediaUpdate.video_caption =
    removeVideo && !isProvidedFile(videoFile) ? null : videoCaptionInput;

  if (Object.keys(mediaUpdate).length > 0) {
    const { error } = await supabase
      .from("stories")
      .update(mediaUpdate)
      .eq("id", selectedStory.id)
      .eq("author_id", user.id);

    if (error) {
      if (isPermissionError(error)) {
        redirectToDashboard("error=admin-setup");
      }

      redirectToDashboard("error=story-save-failed");
    }
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/story/${selectedStory.id}`);

  if (nextStatus === "published") {
    redirect(`/dashboard/stories?notice=story-published`);
  } else {
    redirect(`/dashboard/stories?notice=draft-saved`);
  }
}

export async function deleteStoryAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirectToDashboard("error=missing-config");
  }

  const user = await requireAdminUser();
  const supabase = createSupabaseServerClient();
  const storyId = readText(formData, "story_id");

  if (!storyId) {
    redirectToDashboard("error=story-not-found");
  }

  const { data, error } = await supabase
    .from("stories")
    .select("id, featured_image_path, video_path")
    .eq("id", storyId)
    .eq("author_id", user.id)
    .single();

  if (error || !data) {
    redirectToDashboard("error=story-not-found");
  }

  const ensuredData = data;

  try {
    await removeStorageObject(
      supabase,
      STORY_IMAGE_BUCKET,
      ensuredData.featured_image_path,
    );
    await removeStorageObject(
      supabase,
      STORY_VIDEO_BUCKET,
      ensuredData.video_path,
    );
  } catch {
    redirectToDashboard("error=storage-delete-failed");
  }

  const { error: deleteError } = await supabase
    .from("stories")
    .delete()
    .eq("id", storyId)
    .eq("author_id", user.id);

  if (deleteError) {
    if (isPermissionError(deleteError)) {
      redirectToDashboard("error=admin-setup");
    }

    redirectToDashboard("error=story-delete-failed");
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/story/${storyId}`);

  redirect(`/dashboard/stories?notice=story-deleted`);
}
