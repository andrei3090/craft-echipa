import { clsx } from 'clsx';
import { AlertTriangle, ChevronRight, CloudUpload, Coffee, Thermometer, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, Progress } from '../components/ui';
import { go } from '../lib/route';
import { useSession } from '../lib/session';
import { useAvatare, useSaved, type Saved } from '../lib/status';
import type { Continut, Stare } from '../lib/types';

const zile = ['duminică', 'luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă'];
const luni = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];

export default function Home({ c, stare, loading }: { c: Continut; stare?: Stare; loading: boolean }) {
  const me = useSession(s => s.session!.avatar);
  const saved = useSaved(stare);
  const av = useAvatare();
  const d = new Date();
  const h = d.getHours();
  const salut = h < 11 ? 'Bună dimineața' : h < 18 ? 'Bună ziua' : 'Bună seara';

  const runde = c.zilnic.find(s => s.tip === 'runde');
  const liste = c.zilnic.filter(s => s.tip === 'lista');
  const alerte = (stare?.zi ?? []).filter(x => x.alerta);
  const saptDone = c.saptamanal.filter(i => stare?.saptamanal[i.id]).length;

  const who = (s: Saved | null) => s && (
    <span className="flex items-center gap-1.5 text-sm font-bold text-jungle">
      {s.pending ? <CloudUpload className="size-4 text-sun" /> : '✔'} {av(s.avatar).emoji} {s.ora}
    </span>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-jungle">{salut}, {me.nume}!</h1>
        <p className="text-muted capitalize-first">{zile[d.getDay()]}, {d.getDate()} {luni[d.getMonth()]}{loading ? ' · se încarcă…' : ''}</p>
      </div>

      {alerte.length > 0 && (
        <Card tone="clay">
          <h2 className="mb-2 flex items-center gap-2 font-extrabold text-clay"><AlertTriangle className="size-5" /> De verificat azi</h2>
          <ul className="space-y-1">
            {alerte.map(a => <li key={a.id}><b>{a.titlu}</b> ({a.ora}): {a.alerta}</li>)}
          </ul>
        </Card>
      )}

      <section>
        <h2 className="mb-2 text-sm font-extrabold tracking-wider text-muted uppercase">Checklistul zilei</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {liste.map(s => {
            const sv = saved('zilnic', s.titlu);
            return (
              <Tile key={s.id} onClick={() => go(`lista/${s.id}`)} emoji={s.emoji} title={s.titlu} sub={s.cand} done={!!sv} right={who(sv)} />
            );
          })}
        </div>
      </section>

      {runde && runde.tip === 'runde' && (
        <section>
          <h2 className="mb-2 text-sm font-extrabold tracking-wider text-muted uppercase">{runde.emoji} Runde la 2 ore</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {runde.ore.map(o => {
              const sv = saved('runde', `Runda ${o}`);
              return (
                <button key={o} onClick={() => go(`runde/${o}`)}
                  className={clsx('rounded-2xl border p-3 text-center transition active:scale-95', sv ? 'border-[#cfe0d3] bg-leaf' : 'border-line bg-card')}>
                  <div className="text-xl font-extrabold">{o}</div>
                  <div className="mt-1 text-sm text-muted">{sv ? `${av(sv.avatar).emoji} ${sv.ora}` : 'de făcut'}</div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Tile onClick={() => go('espressor')} icon={<Coffee className="size-7 text-jungle" />} title="Reglaj espresso"
          sub="Dimineața: 18 g → 36 g în 25–30 s" done={!!saved('reglaj')} right={who(saved('reglaj'))} />
        <Tile onClick={() => go('temp')} icon={<Thermometer className="size-7 text-jungle" />} title="Temperaturi"
          sub={`Dimineața ${saved('temperaturi', 'Temperaturi dimineața') ? '✔' : '—'} · Seara ${saved('temperaturi', 'Temperaturi seara') ? '✔' : '—'}`}
          done={!!saved('temperaturi', 'Temperaturi dimineața') && !!saved('temperaturi', 'Temperaturi seara')} />
        <Tile onClick={() => go('raport')} icon={<Wallet className="size-7 text-jungle" />} title="Raport de închidere"
          sub="Z, card, numerar, pierderi, de comandat" done={!!saved('raport')} right={who(saved('raport'))} />
      </section>

      <Card>
        <button onClick={() => go('sapt')} className="w-full text-left">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-extrabold">Curățenia săptămânii</h2>
            <ChevronRight className="size-5 text-muted" />
          </div>
          <Progress done={saptDone} total={c.saptamanal.length} />
        </button>
      </Card>
    </div>
  );
}

function Tile({ onClick, emoji, icon, title, sub, done, right }: { onClick: () => void; emoji?: string; icon?: ReactNode; title: string; sub?: string; done?: boolean; right?: ReactNode }) {
  return (
    <button onClick={onClick}
      className={clsx('flex w-full items-center gap-4 rounded-3xl border p-4 text-left shadow-sm transition active:scale-[.99]',
        done ? 'border-[#cfe0d3] bg-leaf' : 'border-line bg-card')}>
      <span className="grid size-14 flex-none place-items-center rounded-2xl bg-cream text-3xl">{emoji ?? icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-extrabold">{title}</span>
        {sub && <span className="block text-sm text-muted">{sub}</span>}
      </span>
      {right ?? <ChevronRight className="size-5 flex-none text-muted" />}
    </button>
  );
}
