export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type StoryStatus = "draft" | "published";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export type Story = {
  id: string;
  author_id: string;
  title: string;
  category: string;
  location: string | null;
  excerpt: string;
  content: string;
  status: StoryStatus;
  featured_image_url: string | null;
  featured_image_path: string | null;
  video_url: string | null;
  video_path: string | null;
  video_caption: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  views: number;
};

export type Comment = {
  id: string;
  story_id: string;
  author_name: string;
  body: string;
  parent_id: string | null;
  created_at: string;
};

export type CommentWithReplies = Comment & {
  replies: Comment[];
};

export type StoryWithComments = Story & {
  comments?: Comment[];
};

export type StoryFormValues = {
  id?: string;
  title: string;
  category: string;
  location?: string;
  excerpt: string;
  content: string;
  featured_image_url?: string;
  video_caption?: string;
  status: StoryStatus;
};

export interface Database {
  public: {
    Tables: {
      stories: {
        Row: Story;
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          category: string;
          location?: string | null;
          excerpt: string;
          content: string;
          status?: StoryStatus;
          featured_image_url?: string | null;
          featured_image_path?: string | null;
          video_url?: string | null;
          video_path?: string | null;
          video_caption?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          views?: number;
        };
        Update: {
          id?: string;
          author_id?: string;
          title?: string;
          category?: string;
          location?: string | null;
          excerpt?: string;
          content?: string;
          status?: StoryStatus;
          featured_image_url?: string | null;
          featured_image_path?: string | null;
          video_url?: string | null;
          video_path?: string | null;
          video_caption?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          views?: number;
        };
        Relationships: [];
      };
      comments: {
        Row: Comment;
        Insert: {
          id?: string;
          story_id: string;
          author_name: string;
          body: string;
          parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          author_name?: string;
          body?: string;
          parent_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_story_id_fkey";
            columns: ["story_id"];
            referencedRelation: "stories";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_views: {
        Args: {
          story_id_input: string;
        };
        Returns: void;
      };
    };
    Enums: {
      story_status: StoryStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
