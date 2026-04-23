"use client";

import { useState, useTransition } from "react";
import { saveSettingsAction } from "@/app/actions/settings";
import { SubmitButton } from "@/components/SubmitButton";

type SettingsProps = {
  settings: {
    author_bio: string | null;
    social_twitter: string | null;
    social_linkedin: string | null;
    social_instagram: string | null;
  } | null;
};

export default function SettingsForm({ settings }: SettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "success" | "error" | null, message: string }>({ type: null, message: "" });

  async function handleSave(formData: FormData) {
    setStatus({ type: null, message: "" });
    startTransition(async () => {
      const result = await saveSettingsAction(formData);
      if (result.error) {
        setStatus({ type: "error", message: result.error });
      } else {
        setStatus({ type: "success", message: "Settings saved successfully." });
      }
    });
  }

  return (
    <div className="bg-surface p-8 max-w-3xl mx-auto border border-border shadow-sm">
      <h2 className="font-headline text-3xl font-bold mb-8">Platform Settings</h2>

      {status.type && (
        <div className={`mb-8 p-4 border-l-4 font-bold text-sm ${status.type === "error" ? "bg-danger-soft border-danger text-danger" : "bg-success-soft border-success text-success"}`}>
          {status.message}
        </div>
      )}

      <form action={handleSave} className="space-y-8 text-on-surface">
         <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-muted mb-2">Author Bio</label>
            <textarea 
               name="author_bio"
               defaultValue={settings?.author_bio || ""}
               rows={6}
               className="w-full bg-surface-muted border-none p-4 focus:ring-2 focus:ring-primary focus:outline-none"
               placeholder="Editorial bio..."
            />
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label className="block text-[10px] uppercase tracking-widest font-bold text-muted mb-2">X / Twitter URL</label>
               <input 
                  type="url"
                  name="social_twitter"
                  defaultValue={settings?.social_twitter || ""}
                  className="w-full bg-surface-muted border-none p-4 focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="https://x.com/..."
               />
            </div>
            <div>
               <label className="block text-[10px] uppercase tracking-widest font-bold text-muted mb-2">LinkedIn URL</label>
               <input 
                  type="url"
                  name="social_linkedin"
                  defaultValue={settings?.social_linkedin || ""}
                  className="w-full bg-surface-muted border-none p-4 focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="https://linkedin.com/..."
               />
            </div>
            <div className="md:col-span-2">
               <label className="block text-[10px] uppercase tracking-widest font-bold text-muted mb-2">Instagram URL</label>
               <input 
                  type="url"
                  name="social_instagram"
                  defaultValue={settings?.social_instagram || ""}
                  className="w-full bg-surface-muted border-none p-4 focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="https://instagram.com/..."
               />
            </div>
         </div>

         <SubmitButton 
           className="bg-primary text-white font-bold text-xs px-8 py-4 uppercase tracking-widest"
           pendingLabel="Saving..."
         >
           Save Settings
         </SubmitButton>
      </form>
    </div>
  );
}
