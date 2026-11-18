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

/** Network failure (no Wi-Fi, server unreachable) as opposed to a save the server refused. */
const isNetwork = (e: unknown) => e instanceof TypeError || /fetch|network|load failed/i.test(String((e as Error)?.message ?? e));

/**
 * Sends everything waiting, oldest first. Returns how many were sent.
 * A network failure stops the run (the rest waits for the connection). A save the server refuses is
 * kept with its error and skipped, so one bad item never blocks the others.
 */
export function flush(send: Sender): Promise<number> {
  if (running) return running;
  running = (async () => {
    useOutbox.setState({ sending: true });
    let sent = 0;
    try {
      const ids = (await read()).map(p => p.inregistrare.id);
      for (const id of ids) {
        const item = (await read()).find(p => p.inregistrare.id === id);
        if (!item) continue;
        try {
          await send(item.token, item.inregistrare);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await write((await read()).map(p => (p.inregistrare.id === id ? { ...p, error: msg } : p)));
          if (isNetwork(e)) break;
          continue;
        }
        await write((await read()).filter(p => p.inregistrare.id !== id));
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
