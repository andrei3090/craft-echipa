import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { salveaza } from './api';
import { enqueue, flush, useOutbox } from './outbox';
import { useSession } from './session';
import type { Inregistrare } from './types';

export const sender = (token: string, i: Inregistrare) => salveaza(token, i);

/** Save = put in the offline outbox, then try to send. Never loses the record. */
export function useSave() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const save = async (i: Inregistrare): Promise<boolean> => {
    const s = useSession.getState().session;
    if (!s) return false;
    setBusy(true);
    try {
      i.continut = { ...i.continut, salvat_pe_tableta: new Date().toISOString() };
      await enqueue({ inregistrare: i, token: s.token, avatar: s.avatar.id, t: Date.now() }, sender);
      const left = useOutbox.getState().pending.some(p => p.inregistrare.id === i.id);
      if (left) toast.warning('Salvat pe tabletă. Se trimite singur când revine internetul.');
      else toast.success('Salvat. S-a creat înregistrarea în Drive.');
      await qc.invalidateQueries({ queryKey: ['azi'] });
      return true;
    } catch (e) {
      toast.error('Nu s-a putut salva: ' + (e instanceof Error ? e.message : String(e)));
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { save, busy };
}

export const retry = () => flush(sender);
