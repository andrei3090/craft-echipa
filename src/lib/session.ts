import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Avatar } from './types';

export const azi = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
export const oraAcum = () => new Date().toTimeString().slice(0, 5);
export const newId = (tip: string) => `${azi()}-${tip}-${crypto.randomUUID().slice(0, 8)}`;

const IDLE_MS = 30 * 60 * 1000;   // shared tablet: lock after 30 minutes without touch

type Session = { avatar: Avatar; token: string; data: string } | null;

type State = {
  session: Session;
  lastActive: number;
  /** Unsaved work, by key (e.g. "2026-11-18:zilnic:deschidere"). Kept on the device until saved. */
  drafts: Record<string, unknown>;
  signIn: (s: NonNullable<Session>) => void;
  signOut: () => void;
  touch: () => void;
  setDraft: (key: string, v: unknown) => void;
  clearDraft: (key: string) => void;
};

export const useSession = create<State>()(
  persist(
    set => ({
      session: null,
      lastActive: Date.now(),
      drafts: {},
      signIn: s => set({ session: s, lastActive: Date.now() }),
      signOut: () => set({ session: null }),
      touch: () => set({ lastActive: Date.now() }),
      setDraft: (key, v) => set(st => ({ drafts: { ...st.drafts, [key]: v } })),
      clearDraft: key => set(st => { const d = { ...st.drafts }; delete d[key]; return { drafts: d }; }),
    }),
    {
      name: 'craft-echipa',
      // drop drafts from previous days and expired sessions when the app opens
      onRehydrateStorage: () => st => {
        if (!st) return;
        const today = azi();
        const drafts = Object.fromEntries(Object.entries(st.drafts).filter(([k]) => k.startsWith(today) || k.startsWith('W:') || k.startsWith('M:')));
        const expired = !st.session || st.session.data !== today || Date.now() - st.lastActive > IDLE_MS;
        useSession.setState({ drafts, session: expired ? null : st.session });
      },
    },
  ),
);

export function startIdleWatch() {
  const bump = () => { if (useSession.getState().session) useSession.getState().touch(); };
  ['pointerdown', 'keydown'].forEach(e => addEventListener(e, bump, { passive: true }));
  setInterval(() => {
    const { session, lastActive, signOut } = useSession.getState();
    if (session && (Date.now() - lastActive > IDLE_MS || session.data !== azi())) signOut();
  }, 30_000);
}

/** Draft helper bound to one key. */
export function useDraft<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void, () => void] {
  const value = useSession(s => (s.drafts[key] as T | undefined)) ?? initial;
  const setDraft = useSession(s => s.setDraft);
  const clear = useSession(s => s.clearDraft);
  return [
    value,
    v => setDraft(key, typeof v === 'function' ? (v as (p: T) => T)((useSession.getState().drafts[key] as T | undefined) ?? initial) : v),
    () => clear(key),
  ];
}
