import { useSyncExternalStore } from 'react';

// Tiny hash router: #/azi, #/lista/deschidere, #/manual/m-abc ... The tablet's back button works.
const read = () => location.hash.replace(/^#\/?/, '') || 'azi';
const subscribe = (cb: () => void) => { addEventListener('hashchange', cb); return () => removeEventListener('hashchange', cb); };

export function useRoute(): string[] {
  return useSyncExternalStore(subscribe, read).split('/');
}
export function go(path: string) { location.hash = '/' + path; }
export function back() { if (history.length > 1) history.back(); else go('azi'); }
