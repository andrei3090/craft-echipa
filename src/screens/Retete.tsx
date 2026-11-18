import { clsx } from 'clsx';
import { ChevronRight, CupSoda, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Card, PageTitle, inputCls } from '../components/ui';
import { go } from '../lib/route';
import { useSession } from '../lib/session';
import type { Continut } from '../lib/types';

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Retete({ c }: { c: Continut }) {
  const [q, setQ] = useState('');
  const cat = useSession(s => (s.drafts['ui:retete-cat'] as string | undefined) ?? 'toate');
  const setDraft = useSession(s => s.setDraft);
  const setCat = (v: string) => setDraft('ui:retete-cat', v);

  const list = useMemo(() => {
    const k = fold(q.trim());
    return c.retete.filter(r => (cat === 'toate' || r.cat === cat) &&
      (!k || fold(r.nume).includes(k) || r.ingrediente.some(i => fold(i.n).includes(k))));
  }, [q, cat, c.retete]);

  return (
    <div>
      <PageTitle emoji="📒" title="Rețete" sub="Gramajele sunt aceleași cu cele din casa de marcat: după ele se descarcă stocul." backTo={false} />

      <button onClick={() => go('espressor')} className="mb-4 flex w-full items-center gap-4 rounded-3xl border border-[#f1dca8] bg-sun-soft p-4 text-left active:scale-[.99]">
        <span className="grid size-14 flex-none place-items-center rounded-2xl bg-white text-3xl">☕</span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-extrabold">Espressorul și râșnița</span>
          <span className="block text-sm text-muted">Reglajul de dimineață, setările, curățarea zilnică și săptămânală</span>
        </span>
        <ChevronRight className="text-muted" />
      </button>

      <div className="relative mb-3">
        <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Caută: latte, căpșuni, croissant…" className={`${inputCls} pl-12`} />
      </div>
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        {[{ id: 'toate', nume: 'Toate', emoji: '' }, ...c.categorii].map(k => (
          <button key={k.id} onClick={() => setCat(k.id)}
            className={clsx('flex-none rounded-full border px-4 py-2 font-bold whitespace-nowrap', cat === k.id ? 'border-jungle bg-jungle text-white' : 'border-line bg-card')}>
            {k.emoji && <span className="mr-1">{k.emoji}</span>}{k.nume}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {list.map(r => (
          <button key={r.id} onClick={() => go(`reteta/${r.id}`)} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3 text-left active:scale-[.99]">
            <span className="grid size-11 flex-none place-items-center rounded-xl bg-cream text-2xl">{c.categorii.find(k => k.id === r.cat)?.emoji ?? '•'}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold leading-tight">{r.nume}</span>
              <span className="block truncate text-sm text-muted">{r.ingrediente.map(i => `${i.n} ${i.q}`).join(' · ')}</span>
            </span>
            <ChevronRight className="size-5 flex-none text-muted" />
          </button>
        ))}
        {!list.length && <p className="text-muted">Nimic găsit.</p>}
      </div>

      {cat !== 'toate' && (c.categorii.find(k => k.id === cat)?.reguli.length ?? 0) > 0 && (
        <Card tone="sun" className="mt-4">
          <h2 className="mb-1 font-extrabold">Reguli</h2>
          <ul className="list-disc space-y-1 pl-5">{c.categorii.find(k => k.id === cat)!.reguli.map(x => <li key={x}>{x}</li>)}</ul>
        </Card>
      )}
    </div>
  );
}

export function RetetaPage({ c, id }: { c: Continut; id?: string }) {
  const r = c.retete.find(x => x.id === id);
  if (!r) return <PageTitle title="Rețeta nu există" />;
  const k = c.categorii.find(x => x.id === r.cat);
  return (
    <div className="space-y-4">
      <PageTitle emoji={k?.emoji} title={r.nume} sub={[k?.nume, r.sub].filter(Boolean).join(' · ')} />
      <Card>
        <h2 className="mb-2 font-extrabold">Ingrediente</h2>
        <table className="w-full">
          <tbody>
            {r.ingrediente.map(i => (
              <tr key={i.n} className="border-b border-line last:border-0">
                <td className="py-2 pr-3">{i.n}</td>
                <td className="py-2 text-right text-lg font-extrabold whitespace-nowrap text-jungle">{i.q}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <h2 className="mb-2 font-extrabold">Cum se face</h2>
        <ol className="space-y-3">
          {r.pasi.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid size-8 flex-none place-items-center rounded-full bg-jungle font-extrabold text-white">{i + 1}</span>
              <span className="pt-1 leading-snug">{p}</span>
            </li>
          ))}
        </ol>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        {r.pahar && (
          <Card tone="leaf" className="flex items-center gap-3">
            <CupSoda className="size-6 flex-none text-jungle" />
            <span><b>Pahar:</b> {r.pahar}</span>
          </Card>
        )}
        <Card tone={r.alergeni.length ? 'clay' : 'leaf'}>
          <b>Alergeni:</b> {r.alergeni.length ? r.alergeni.join(', ') : 'niciunul declarat'}
          <div className="text-sm text-muted">La copii întrebi părintele. Detaliile sunt în evidența alergenilor.</div>
        </Card>
      </div>
      {r.nota && <Card tone="sun">{r.nota}</Card>}
      {r.cat === 'cafea' || r.cat === 'vegetal' ? (
        <button onClick={() => go('espressor')} className="flex w-full items-center justify-between rounded-2xl border border-line bg-card p-4 font-bold">
          <span>☕ Reglajul espresso-ului și curățarea</span><ChevronRight />
        </button>
      ) : null}
    </div>
  );
}
