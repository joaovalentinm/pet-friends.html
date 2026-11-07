"use client";
import { ActionForm } from "@/components/client";
import { saveSetting } from "@/app/actions/settings";

export function SettingForm({ settingKey, value }: { settingKey: string; value: string }) {
  const rows = Math.min(16, value.split("\n").length + 1);
  return (
    <ActionForm action={saveSetting}>
      <input type="hidden" name="key" value={settingKey} />
      <textarea name="value" defaultValue={value} rows={rows} className="input font-mono text-xs" spellCheck={false} />
    </ActionForm>
  );
}
