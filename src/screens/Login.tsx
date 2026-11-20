import { useQuery } from '@tanstack/react-query';
import { Delete } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAvatare, login } from '../lib/api';
import { retoken } from '../lib/outbox';
import { useSession } from '../lib/session';
import type { Avatar } from '../lib/types';
import { retry } from '../lib/useSave';
import { Button } from '../components/ui';
import { ProgramLogin } from '../components/ProgramView';

const base = import.meta.env.BASE_URL;

export default function Login() {
  const avatare = useQuery({ queryKey: ['avatare'], queryFn: getAvatare, retry: 1 });
  const [who, setWho] = useState<Avatar | null>(null);

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
      <img src={`${base}logo.png`} alt="Craft Cafe · Play & Study" className="mb-6 h-28 w-auto" />
      {!who ? (
        <div className="w-full max-w-xl">
          <h1 className="font-display text-3xl text-jungle">Cine e în tură?</h1>
          <p className="mt-2 text-muted">Atinge-ți animalul, apoi scrie PIN-ul.</p>
          {avatare.isError && (
            <p className="mt-6 rounded-2xl bg-clay-soft p-4 text-clay">{(avatare.error as Error).message}</p>
          )}
          <div className="mt-8 grid w-full grid-cols-2 gap-4">
            {(avatare.data ?? []).map(a => (
              <button key={a.id} onClick={() => setWho(a)}
                className="flex flex-col items-center gap-2 rounded-3xl border border-line bg-card px-4 py-6 shadow-sm transition active:scale-95">
                <span className="text-6xl" aria-hidden>{a.emoji}</span>
                <span className="text-lg font-extrabold">{a.nume}</span>
              </button>
            ))}
            {avatare.isLoading && Array.from({ length: 4 }, (_, i) => <div key={i} className="h-40 animate-pulse rounded-3xl bg-line/60" />)}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-xl"><PinPad avatar={who} onBack={() => setWho(null)} /></div>
      )}
      {!who && avatare.data && <div className="mt-10 w-full"><ProgramLogin avatare={avatare.data} /></div>}
    </div>
  );
}

function PinPad({ avatar, onBack }: { avatar: Avatar; onBack: () => void }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const signIn = useSession(s => s.signIn);

  useEffect(() => {
    if (pin.length !== 4) return;
    setBusy(true);
    login(avatar.id, pin)
      .then(async r => {
        await retoken(avatar.id, r.token);
        signIn({ avatar, token: r.token, data: r.data });
        retry();
      })
      .catch(e => { setErr(e instanceof Error && /fetch/i.test(e.message) ? 'Nu e internet. Verifică Wi-Fi-ul.' : (e as Error).message); setPin(''); })
      .finally(() => setBusy(false));
  }, [pin, avatar, signIn]);

  const press = (d: string) => { setErr(''); setPin(p => (p.length < 4 ? p + d : p)); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') setPin(p => p.slice(0, -1));
      else if (e.key === 'Escape') onBack();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  return (
    <div className="w-full">
      <div className="text-6xl" aria-hidden>{avatar.emoji}</div>
      <h1 className="mt-2 font-display text-3xl text-jungle">Bună, {avatar.nume}!</h1>
      <p className="mt-1 text-muted">Scrie PIN-ul tău</p>
      <div className="my-6 flex justify-center gap-4" aria-live="polite">
        {[0, 1, 2, 3].map(i => (
          <span key={i} className={`size-5 rounded-full border-2 border-jungle ${i < pin.length ? 'bg-jungle' : ''} ${busy ? 'animate-pulse' : ''}`} />
        ))}
      </div>
      <div className="mx-auto grid max-w-xs grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
          <button key={d} onClick={() => press(d)} disabled={busy}
            className="h-18 rounded-2xl border border-line bg-card text-3xl font-extrabold shadow-sm active:bg-leaf">{d}</button>
        ))}
        <Button variant="ghost" onClick={onBack} className="h-18">Înapoi</Button>
        <button onClick={() => press('0')} disabled={busy} className="h-18 rounded-2xl border border-line bg-card text-3xl font-extrabold shadow-sm active:bg-leaf">0</button>
        <button onClick={() => setPin(pin.slice(0, -1))} aria-label="Șterge" className="grid h-18 place-items-center rounded-2xl border border-line bg-card"><Delete /></button>
      </div>
      <p className="mt-5 min-h-6 font-bold text-clay" role="alert">{err}</p>
    </div>
  );
}
