import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { ChevronRight, Flame, Trophy } from 'lucide-react';
import { Button, Card, PageTitle } from '../components/ui';
import { getScor } from '../lib/api';
import { go } from '../lib/route';
import { azi, newId, useSession } from '../lib/session';
import type { Scor as ScorT, Stare } from '../lib/types';
import { useSave } from '../lib/useSave';

export const TURE: Record<string, string> = { dim: 'dimineață', sea: 'seară', zi: 'toată ziua' };
const STARE: Record<string, { t: string; c: string }> = {
  'la timp': { t: '✔ la timp', c: 'text-jungle' },
  'cu diferențe': { t: '½ cu diferențe', c: 'text-sun' },
  'târziu': { t: '½ târziu', c: 'text-sun' },
  'prea devreme': { t: '½ prea devreme', c: 'text-sun' },
  'de făcut': { t: 'de făcut', c: 'text-muted' },
  'lipsă': { t: '✘ lipsă', c: 'text-clay' },
};

export function useScor() {
  const token = useSession(s => s.session?.token ?? '');
  return useQuery({ queryKey: ['scor', token], queryFn: () => getScor(token), enabled: !!token, refetchInterval: 5 * 60_000, retry: 1 });
}

/** Asked once a day, at the first sign-in: which shift she works. */
export function TuraPicker({ stare }: { stare?: Stare }) {
  const me = useSession(s => s.session!.avatar);
  const declared = useSession(s => s.drafts[`${azi()}:tura:${me.id}`] as string | undefined);
  const setDraft = useSession(s => s.setDraft);
  const { save, busy } = useSave();
  const onServer = stare?.zi.some(x => x.tip === 'tura' && x.avatar === me.id);
  if (!stare || onServer || declared) return null;

  const pick = async (t: string) => {
    setDraft(`${azi()}:tura:${me.id}`, t);
    await save({ id: newId('tura'), tip: 'tura', titlu: `Tura ${TURE[t]}`, continut: { tura: t } }, { quiet: true });
  };
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md text-center">
        <div className="text-5xl">{me.emoji}</div>
        <h2 className="mt-2 font-display text-2xl text-jungle">Ce tură ai azi?</h2>
        <p className="mt-1 text-muted">Ca scorul tău să socotească doar ce ține de tura ta.</p>
        <div className="mt-5 grid gap-3">
          <Button variant="sun" busy={busy} onClick={() => pick('dim')}>🌅 Dimineață</Button>
          <Button busy={busy} onClick={() => pick('sea')}>🌙 Seară</Button>
          <Button variant="ghost" busy={busy} onClick={() => pick('zi')}>Toată ziua</Button>
        </div>
      </Card>
    </div>
  );
}

function BonusBar({ s }: { s: ScorT }) {
  const p = s.praguri, l = s.luna;
  const unlocked = l.bonus.nivel === 'întreg' || l.bonus.nivel === 'jumătate';
  return (
    <div>
      <div className="relative h-4 overflow-hidden rounded-full bg-line">
        <div className={clsx('h-full rounded-full transition-all', l.procent >= p.intreg ? 'bg-jungle' : l.procent >= p.jumatate ? 'bg-sun' : 'bg-clay/70')} style={{ width: `${Math.min(100, l.procent)}%` }} />
        <span className="absolute top-0 h-full w-0.5 bg-ink/40" style={{ left: `${p.jumatate}%` }} />
        <span className="absolute top-0 h-full w-0.5 bg-ink/60" style={{ left: `${p.intreg}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>0%</span><span>{p.jumatate}% jumătate · {p.intreg}% bonus întreg</span>
      </div>
      <p className={clsx('mt-2 font-bold', unlocked ? 'text-jungle' : 'text-muted')}>
        {unlocked
          ? `🎉 Bonus ${l.bonus.nivel} deblocat${l.bonus.suma ? `: ${l.bonus.suma} lei` : ''}`
          : l.ture < p.minTure ? `Încă ${p.minTure - l.ture} ture până intri în calculul bonusului.`
            : `Mai ai ${Math.max(0, p.jumatate - l.procent)} puncte procentuale până la prima treaptă.`}
      </p>
    </div>
  );
}

/** Small card on the home screen. */
export function ScorCard() {
  const q = useScor();
  const s = q.data;
  if (!s) return null;
  const z = s.azi;
  return (
    <button onClick={() => go('scor')} className="w-full text-left">
      <Card tone="leaf">
        <div className="flex items-center gap-3">
          <Trophy className="size-6 flex-none text-jungle" />
          <h2 className="flex-1 font-extrabold">Scorul tău</h2>
          <ChevronRight className="size-5 text-muted" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-white p-2"><div className="text-2xl font-extrabold text-jungle">{z ? `${z.puncte}/${z.max}` : '—'}</div><div className="text-xs text-muted">azi</div></div>
          <div className="rounded-2xl bg-white p-2"><div className="text-2xl font-extrabold text-jungle">{s.luna.procent}%</div><div className="text-xs text-muted">luna aceasta</div></div>
          <div className="rounded-2xl bg-white p-2"><div className="flex items-center justify-center gap-1 text-2xl font-extrabold text-sun"><Flame className="size-5" />{s.serie}</div><div className="text-xs text-muted">ture la rând</div></div>
        </div>
      </Card>
    </button>
  );
}

export default function ScorScreen() {
  const q = useScor();
  const s = q.data;
  if (!s) return <div><PageTitle emoji="🏆" title="Scorul tău" /><p className="text-muted">{q.isError ? 'Nu s-a putut încărca scorul.' : 'Se încarcă…'}</p></div>;
  const z = s.azi;
  return (
    <div className="space-y-4">
      <PageTitle emoji="🏆" title="Scorul tău" sub="Doar tu și Andrei vedeți scorul tău. Contează ce se salvează la timp în tura ta." />

      <Card>
        <h2 className="mb-1 font-extrabold">Azi {z ? `· tura de ${TURE[z.tura]}` : ''}</h2>
        {z ? (
          <div className="divide-y divide-line">
            {z.sarcini.map(t => (
              <div key={t.id} className="flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1">{t.nume}<span className="block text-xs text-muted">până la {t.pana}{t.ora ? ` · salvat la ${t.ora}` : ''}</span></span>
                <span className={clsx('text-sm font-bold whitespace-nowrap', STARE[t.stare]?.c)}>{STARE[t.stare]?.t ?? t.stare}</span>
                <span className="w-10 text-right font-extrabold">{t.puncte}/{t.max}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-muted">Alege tura de azi ca să-ți apară sarcinile.</p>}
      </Card>

      <Card tone="leaf">
        <h2 className="mb-2 font-extrabold">Luna aceasta: {s.luna.procent}% · {s.luna.ture} ture</h2>
        <BonusBar s={s} />
      </Card>

      <Card>
        <h2 className="mb-2 font-extrabold">Insigne</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {s.insigne.map(i => (
            <div key={i.id} className={clsx('flex items-center gap-3 rounded-2xl border p-3', i.are ? 'border-[#cfe0d3] bg-leaf' : 'border-line opacity-50 grayscale')}>
              <span className="text-3xl">{i.emoji}</span><span className="font-bold">{i.nume}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">Cea mai lungă serie: {s.serieMax} ture · sarcini de curățenie săptămânală făcute: {s.curatenie}</p>
      </Card>

      {s.ultimele.length > 0 && (
        <Card>
          <h2 className="mb-2 font-extrabold">Ultimele ture</h2>
          <div className="flex flex-wrap gap-2">
            {s.ultimele.map(u => (
              <div key={u.data} className={clsx('rounded-xl px-3 py-2 text-center text-sm font-bold', u.procent === 100 ? 'bg-leaf text-jungle' : u.procent >= 80 ? 'bg-sun-soft' : 'bg-clay-soft text-clay')}>
                {u.data.slice(8, 10)}.{u.data.slice(5, 7)}<div className="text-xs font-normal">{u.procent}%</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card tone="sun" className="text-sm">
        <b>Cum se socotește:</b> fiecare sarcină a turei are puncte (deschiderea, închiderea și raportul câte 2, restul câte 1). La timp = toate punctele; târziu = jumătate; lipsă = 0. Ce face o colegă în tura ta contează pentru toată tura. Bifezi doar ce ai făcut cu adevărat: Andrei mai verifică pe loc.
      </Card>
    </div>
  );
}
