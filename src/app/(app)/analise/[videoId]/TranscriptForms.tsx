"use client";
import { ActionForm } from "@/components/client";
import { saveManualTranscript, transcribeFromUrl } from "@/app/actions/transcripts";

export function TranscriptForms({ videoId }: { videoId: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ActionForm action={saveManualTranscript} submitLabel="Salvar transcrição" className="space-y-2">
        <input type="hidden" name="video_id" value={videoId} />
        <label className="label">Colar transcrição</label>
        <textarea name="text" rows={4} className="input" />
        <label className="flex items-center gap-2 text-xs text-ink-400"><input type="checkbox" name="authorized" /> Confirmo que o uso desta transcrição é autorizado.</label>
      </ActionForm>
      <ActionForm action={transcribeFromUrl} submitLabel="Transcrever (AssemblyAI)" className="space-y-2">
        <input type="hidden" name="video_id" value={videoId} />
        <label className="label">URL direta de áudio/vídeo</label>
        <input name="audio_url" type="url" className="input" placeholder="https://..." />
        <label className="flex items-center gap-2 text-xs text-ink-400"><input type="checkbox" name="authorized" /> Tenho autorização para transcrever este arquivo.</label>
      </ActionForm>
    </div>
  );
}
