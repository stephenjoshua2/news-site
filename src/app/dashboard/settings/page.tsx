import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/auth";
import SettingsForm from "./SettingsForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdminUser();

  const supabase = createSupabaseServerClient();
  const { data: settings } = await (supabase as any).from("site_settings").select("*").single();

  return (
    <div className="max-w-3xl w-full">
       <SettingsForm settings={settings} />
    </div>
  );
}
