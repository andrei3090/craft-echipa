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

registerSW({ immediate: true });

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
