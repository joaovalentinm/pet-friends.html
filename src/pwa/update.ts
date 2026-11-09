import { registerSW } from 'virtual:pwa-register';

/**
 * Registra o service worker e mantém o app sempre na versão mais nova:
 * quando há versão nova publicada, ela é baixada e a tela recarrega sozinha.
 * Também confere se há novidade ao voltar para o app e a cada 30 minutos.
 */
export function startAutoUpdate() {
  if (!('serviceWorker' in navigator)) return;
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => registration.update().catch(() => {});
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
      setInterval(check, 30 * 60 * 1000);
    },
  });
}
