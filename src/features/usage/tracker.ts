import { supabase } from '@/services/supabase';

/**
 * Mede o tempo de uso: a cada minuto com o app aberto e visível, soma esse tempo
 * no dia da pessoa (tabela app_usage). Só minutos, sem registrar o que ela faz.
 */
let timer: ReturnType<typeof setInterval> | undefined;
let since = 0;

function flush() {
  if (!since) return;
  const seconds = Math.round((Date.now() - since) / 1000);
  since = document.visibilityState === 'visible' ? Date.now() : 0;
  if (seconds < 5) return;
  void supabase.rpc('track_usage', { p_seconds: Math.min(seconds, 120) });
}

function onVisibility() {
  if (document.visibilityState === 'hidden') flush();
  else if (!since) since = Date.now();
}

export function startUsageTracking() {
  stopUsageTracking();
  since = document.visibilityState === 'visible' ? Date.now() : 0;
  timer = setInterval(flush, 60_000);
  document.addEventListener('visibilitychange', onVisibility);
}

export function stopUsageTracking() {
  if (timer) clearInterval(timer);
  timer = undefined;
  since = 0;
  document.removeEventListener('visibilitychange', onVisibility);
}
