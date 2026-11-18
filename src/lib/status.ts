import { useOutbox } from './outbox';
import type { Avatar, Stare } from './types';
import { azi } from './session';
import { useQuery } from '@tanstack/react-query';
import { get } from 'idb-keyval';

export type Saved = { avatar: string; ora: string; pending: boolean; alerta?: string };

/** Was a record of this type/title saved today (on the server, or waiting in the outbox)? */
export function useSaved(stare: Stare | undefined) {
  const pending = useOutbox(s => s.pending);
  const today = azi();
  return (tip: string, titlu?: string): Saved | null => {
    const s = stare?.data === today ? [...stare.zi].reverse().find(x => x.tip === tip && (!titlu || x.titlu === titlu)) : undefined;
    if (s) return { avatar: s.avatar, ora: s.ora, pending: false, alerta: s.alerta };
    const p = pending.find(x => x.inregistrare.tip === tip && (!titlu || x.inregistrare.titlu === titlu) && x.inregistrare.id.startsWith(today));
    if (p) return { avatar: p.avatar, ora: new Date(p.t).toTimeString().slice(0, 5), pending: true };
    return null;
  };
}

/** Avatar list (cached at login) to show who did what, by emoji. */
export function useAvatare() {
  const q = useQuery({ queryKey: ['avatare-cache'], queryFn: async () => ((await get('avatare')) as Avatar[] | undefined) ?? [], staleTime: Infinity });
  return (id: string) => q.data?.find(a => a.id === id) ?? { id, emoji: '🙂', nume: id };
}
