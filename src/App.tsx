import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { BookOpen, CalendarCheck, ClipboardList, CloudOff, Home as HomeIcon, LogOut, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { getContinut, getStare, SessionExpired } from './lib/api';
import { useOutbox } from './lib/outbox';
import { go, useRoute } from './lib/route';
import { useSession } from './lib/session';
import { retry } from './lib/useSave';
import Login from './screens/Login';
import Home from './screens/Home';
import Checklist from './screens/Checklist';
import Runde from './screens/Runde';
import Temperaturi from './screens/Temperaturi';
import Raport from './screens/Raport';
import Periodic from './screens/Periodic';
import Formulare, { FormularScreen } from './screens/Formulare';
import Manual, { ManualPage } from './screens/Manual';

const base = import.meta.env.BASE_URL;

export default function App() {
  const session = useSession(s => s.session);
  if (!session) return <Login />;
  return <Shell />;
}

function Shell() {
  const { session, signOut } = useSession();
  const token = session!.token;
  const route = useRoute();

  const continut = useQuery({ queryKey: ['continut', token], queryFn: () => getContinut(token), staleTime: 60 * 60 * 1000, retry: 1 });
  const stare = useQuery({ queryKey: ['azi', token], queryFn: () => getStare(token), refetchInterval: 60_000, retry: 1 });

  const path = route.join('/');
  useEffect(() => { scrollTo(0, 0); }, [path]);

  useEffect(() => {
    const e = continut.error ?? stare.error;
    if (e instanceof SessionExpired) signOut();
  }, [continut.error, stare.error, signOut]);

  const c = continut.data;
  const [r0, r1] = route;
  let page: React.ReactNode = null;
  if (!c) {
    page = continut.isError
      ? <p className="rounded-2xl bg-clay-soft p-4 text-clay">Nu s-a putut încărca: {(continut.error as Error).message}</p>
      : <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-28 animate-pulse rounded-3xl bg-line/60" />)}</div>;
  } else if (r0 === 'lista') page = <Checklist c={c} id={r1} stare={stare.data} />;
  else if (r0 === 'runde') page = <Runde c={c} ora={r1} stare={stare.data} />;
  else if (r0 === 'temp') page = <Temperaturi c={c} stare={stare.data} />;
  else if (r0 === 'raport') page = <Raport c={c} stare={stare.data} />;
  else if (r0 === 'sapt') page = <Periodic c={c} stare={stare.data} />;
  else if (r0 === 'formulare') page = <Formulare c={c} />;
  else if (r0 === 'form') page = <FormularScreen c={c} id={r1} />;
  else if (r0 === 'manual') page = r1 ? <ManualPage c={c} id={r1} /> : <Manual c={c} />;
  else page = <Home c={c} stare={stare.data} loading={stare.isLoading} />;

  const tab = r0 === 'sapt' ? 'sapt' : r0 === 'formulare' || r0 === 'form' ? 'formulare' : r0 === 'manual' ? 'manual' : 'azi';

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-cream/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2 sm:px-6">
          <button onClick={() => go('azi')} className="flex items-center gap-2">
            <img src={`${base}logo.png`} alt="Craft Cafe" className="h-10 w-auto" />
          </button>
          <div className="flex-1" />
          <OutboxBadge />
          <span className="flex items-center gap-2 rounded-full border border-line bg-card py-1 pr-3 pl-1.5 font-bold">
            <span className="text-2xl" aria-hidden>{session!.avatar.emoji}</span>{session!.avatar.nume}
          </span>
          <button onClick={signOut} aria-label="Ieșire" className="grid size-11 place-items-center rounded-2xl border border-line bg-card">
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-5 pb-28 sm:px-6">{page}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto grid max-w-4xl grid-cols-4">
          {([
            ['azi', 'Azi', HomeIcon],
            ['sapt', 'Săptămâna', CalendarCheck],
            ['formulare', 'Formulare', ClipboardList],
            ['manual', 'Manual', BookOpen],
          ] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => go(id)}
              className={clsx('flex h-[4.5rem] flex-col items-center justify-center gap-1 text-sm font-bold', tab === id ? 'text-jungle' : 'text-muted')}>
              <Icon className={clsx('size-6', tab === id && 'stroke-[2.5]')} />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function OutboxBadge() {
  const { pending, sending } = useOutbox();
  if (!pending.length) return null;
  return (
    <button onClick={() => retry()} className="flex items-center gap-2 rounded-full bg-sun-soft px-3 py-2 text-sm font-bold text-ink">
      {sending ? <RefreshCw className="size-4 animate-spin" /> : <CloudOff className="size-4" />}
      {pending.length} de trimis
    </button>
  );
}
