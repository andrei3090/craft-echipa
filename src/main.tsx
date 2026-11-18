import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { flush, loadOutbox } from './lib/outbox';
import { startIdleWatch } from './lib/session';
import { sender } from './lib/useSave';
import './index.css';

// The tablet keeps the app open for days: look for a new version every hour and when the screen
// comes back, and reload once the new version takes over. Unsaved work is kept in drafts.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    const check = () => { if (navigator.onLine) reg.update().catch(() => {}); };
    setInterval(check, 60 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  },
});
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
}

const qc = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: true, networkMode: 'always' } } });

loadOutbox().then(() => flush(sender));
addEventListener('online', () => flush(sender));
setInterval(() => flush(sender), 2 * 60_000);
startIdleWatch();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <App />
      <Toaster position="top-center" richColors toastOptions={{ style: { fontSize: '1rem' } }} />
    </QueryClientProvider>
  </StrictMode>,
);
