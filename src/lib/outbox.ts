// Offline outbox: every save goes here first, then is sent in order.
// A save is never lost when the Wi-Fi drops; the backend ignores duplicates (same id).
import { createStore, get, set } from 'idb-keyval';
import { create } from 'zustand';
import type { Inregistrare } from './types';

export type Pending = { inregistrare: Inregistrare; token: string; avatar: string; t: number; error?: string };
type Sender = (token: string, i: Inregistrare) => Promise<unknown>;

const store = createStore('craft-echipa', 'outbox');
const KEY = 'pending';

export const useOutbox = create<{ pending: Pending[]; sending: boolean }>(() => ({ pending: [], sending: false }));

async function read(): Promise<Pending[]> { return ((await get(KEY, store)) as Pending[] | undefined) ?? []; }
async function write(p: Pending[]) { await set(KEY, p, store); useOutbox.setState({ pending: p }); }

export async function loadOutbox() { useOutbox.setState({ pending: await read() }); }

export async function enqueue(item: Pending, send: Sender) {
  await write([...(await read()), item]);
  return flush(send);
}

let running: Promise<number> | null = null;

/** Sends everything waiting. Returns how many were sent. Stops at the first network error. */
export function flush(send: Sender): Promise<number> {
  if (running) return running;
  running = (async () => {
    useOutbox.setState({ sending: true });
    let sent = 0;
    try {
      for (;;) {
        const q = await read();
        if (!q.length) break;
        const head = q[0];
        try {
          await send(head.token, head.inregistrare);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          // network problem: keep it and retry later; a refused save is kept with its error so nothing disappears silently
          await write([{ ...head, error: msg }, ...q.slice(1)]);
          break;
        }
        await write(q.slice(1));
        sent++;
      }
    } finally {
      useOutbox.setState({ sending: false });
      running = null;
    }
    return sent;
  })();
  return running;
}

/** Replaces the token of waiting items (after a new login, an old token from yesterday would be refused). */
export async function retoken(avatar: string, token: string) {
  const q = await read();
  await write(q.map(p => (p.avatar === avatar ? { ...p, token, error: undefined } : p)));
}
