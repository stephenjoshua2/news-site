const SUPABASE_URL_KEY = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_ANON_KEY = "NEXT_PUBLIC_SUPABASE_ANON_KEY";
const NEWSROOM_ADMIN_EMAIL_KEY = "NEWSROOM_ADMIN_EMAIL";

function readEnvValue(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function normalizeEmail(email?: string | null): string {
  return email?.trim().toLowerCase() ?? "";
}

export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env[SUPABASE_URL_KEY] &&
      process.env[SUPABASE_ANON_KEY] &&
      process.env[NEWSROOM_ADMIN_EMAIL_KEY],
  );
}

export function getSupabaseProjectConfig() {
  return {
    url: readEnvValue(SUPABASE_URL_KEY),
    anonKey: readEnvValue(SUPABASE_ANON_KEY),
  };
}

export function getNewsroomAdminEmail(): string {
  return normalizeEmail(readEnvValue(NEWSROOM_ADMIN_EMAIL_KEY));
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email || !process.env[NEWSROOM_ADMIN_EMAIL_KEY]) {
    return false;
  }

  return normalizeEmail(email) === getNewsroomAdminEmail();
}
