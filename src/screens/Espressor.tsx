import { clsx } from 'clsx';
import { AlertTriangle, Gauge } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, Field, PageTitle, inputCls } from '../components/ui';
import { verdict } from '../lib/calc';
import { azi, newId, useDraft } from '../lib/session';
import { useAvatare, useSaved } from '../lib/status';
import type { Continut, Stare } from '../lib/types';
import { useSave } from '../lib/useSave';

type Draft = { v: Record<string, string>; macinare: string; gust: string; obs: string };
const GUST = ['echilibrat', 'acru / apos', 'amar / ars'];


export default function Espressor({ c, stare }: { c: Continut; stare?: Stare }) {
  const e = c.espressor;
  const [d, setD, clear] = useDraft<Draft>(`${azi()}:reglaj`, { v: {}, macinare: '', gust: '', obs: '' });
  const { save, busy } = useSave();
  const saved = useSaved(stare);
  const av = useAvatare();
  const [tried, setTried] = useState(false);
  const sv = saved('reglaj');

  const rows = e.tinte.map(t => ({ t, v: d.v[t.id] ?? '', st: verdict(t, d.v[t.id] ?? '') }));
  const timp = rows.find(r => r.t.id === 'timp');
  const sfat = timp?.st === 'jos' ? 'Curge prea repede: macină mai FIN cu o treaptă și mai fă un shot.'
    : timp?.st === 'sus' ? 'Curge prea încet: macină mai GROSIER cu o treaptă și mai fă un shot.'
      : timp?.st === 'ok' ? 'Timpul e bun. Gustă și salvează reglajul.' : '';
  const lipsa = rows.some(r => !r.v.trim()) || !d.macinare.trim() || !d.gust;

  const submit = async () => {
    setTried(true);
    if (lipsa) return;
    const afara = rows.filter(r => r.st !== 'ok').map(r => `${r.t.nume}: ${r.v} ${r.t.unit} (țintă ${r.t.text})`);
    const ok = await save({
      id: newId('reglaj'), tip: 'reglaj', titlu: 'Reglaj espresso',
      continut: {
        valori: { macinare: d.macinare, ...Object.fromEntries(rows.map(r => [r.t.id, r.v.replace(',', '.')])), gust: d.gust },
        etichete: { macinare: 'Treapta râșniței', ...Object.fromEntries(rows.map(r => [r.t.id, `${r.t.nume} (${r.t.unit}), țintă ${r.t.text}`])), gust: 'Gust' },
        afara, observatii: d.obs.trim(),
      },
    });
    if (ok) { clear(); setTried(false); }
  };

  return (
    <div className="space-y-5">
      <PageTitle emoji="☕" title="Espressorul și râșnița" sub="Cafea Guatemala Hedone · râșnița Eureka Mignon Libra 65 · espressor cu 2 grupuri (comodat Hedone)" />

      <Card tone="leaf">
        <h2 className="mb-3 flex items-center gap-2 font-extrabold"><Gauge className="size-5" /> Ținta pentru fiecare espresso</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {e.tinte.map(t => (
            <div key={t.id} className="rounded-2xl bg-white p-3 text-center">
              <div className="text-2xl font-extrabold text-jungle">{t.text}</div>
              <div className="text-sm text-muted">{t.nume}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-display text-2xl text-jungle">Reglajul de dimineață</h2>
        <p className="mb-3 text-muted">Se face în fiecare dimineață, după ce aparatul s-a încălzit, și ori de câte ori cafeaua nu iese bine.</p>
        <ol className="mb-4 space-y-2">
          {e.reglaj.map((p, i) => (
            <li key={i} className="flex gap-3"><span className="grid size-7 flex-none place-items-center rounded-full bg-jungle text-sm font-extrabold text-white">{i + 1}</span><span className="leading-snug">{p}</span></li>
          ))}
        </ol>
        {sv && <Card tone="leaf" className="mb-3">Reglaj salvat azi de {av(sv.avatar).emoji} {av(sv.avatar).nume} la {sv.ora}. Poți salva din nou dacă reglezi iar.</Card>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Treapta râșniței (cum scrie pe ea)">
            <input value={d.macinare} onChange={ev => setD(p => ({ ...p, macinare: ev.target.value }))} className={clsx(inputCls, tried && !d.macinare.trim() && 'border-clay')} />
          </Field>
          {rows.map(({ t, v, st }) => (
            <Field key={t.id} label={`${t.nume} · țintă ${t.text}`}>
              <div className="flex items-center gap-2">
                <input inputMode="decimal" value={v} onChange={ev => setD(p => ({ ...p, v: { ...p.v, [t.id]: ev.target.value.replace(/[^\d,.]/g, '') } }))}
                  className={clsx(inputCls, 'text-lg font-extrabold', st === 'ok' && 'border-jungle', (st === 'jos' || st === 'sus') && 'border-clay text-clay', tried && !v && 'border-clay')} />
                <span className="w-6 text-muted">{t.unit}</span>
              </div>
            </Field>
          ))}
        </div>
        <div className="mt-3">
          <span className="mb-1 block font-bold">Gustul</span>
          <div className="flex flex-wrap gap-2">
            {GUST.map(g => (
              <button key={g} onClick={() => setD(p => ({ ...p, gust: g }))}
                className={clsx('rounded-full border px-4 py-2 font-bold', d.gust === g ? 'border-jungle bg-jungle text-white' : 'border-line bg-card', tried && !d.gust && 'border-clay')}>{g}</button>
            ))}
          </div>
        </div>
        {sfat && <p className={clsx('mt-3 rounded-2xl px-4 py-3 font-bold', timp?.st === 'ok' ? 'bg-leaf text-jungle-dark' : 'bg-clay-soft text-clay')}>{sfat}</p>}
        <textarea value={d.obs} onChange={ev => setD(p => ({ ...p, obs: ev.target.value }))} rows={2} placeholder="Observații (manometre, pungă nouă de cafea, ce ai schimbat)" className={`${inputCls} mt-3`} />
        {tried && lipsa && <p className="mt-2 font-bold text-clay">Completează treapta, cele 3 valori și gustul.</p>}
        <div className="mt-3 flex justify-end"><Button onClick={submit} busy={busy}>Salvează reglajul</Button></div>
      </Card>

      <Card>
        <h2 className="mb-2 font-display text-2xl text-jungle">Setările aparatului</h2>
        <table className="w-full">
          <tbody>
            {e.aparat.map(([k, v]) => (
              <tr key={k} className="border-b border-line last:border-0"><td className="py-2 pr-3">{k}</td><td className="py-2 text-right font-extrabold text-jungle">{v}</td></tr>
            ))}
          </tbody>
        </table>
        <ul className="mt-3 space-y-1">
          {e.reguli_aparat.map(r => <li key={r} className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 flex-none text-sun" />{r}</li>)}
        </ul>
      </Card>

      <div>
        <h2 className="mb-2 font-display text-2xl text-jungle">Curățarea</h2>
        <div className="space-y-3">
          {e.curatare.map(s => (
            <Card key={s.cand}>
              <h3 className="mb-2 font-extrabold">{s.cand}</h3>
              <ol className="space-y-2">
                {s.pasi.map((p, i) => <li key={i} className="flex gap-3"><span className="w-5 flex-none text-right font-extrabold text-jungle">{i + 1}.</span><span className="leading-snug">{p}</span></li>)}
              </ol>
            </Card>
          ))}
        </div>
      </div>

      <Card tone="sun">
        <h2 className="mb-2 font-extrabold">Când nu iese bine</h2>
        <div className="space-y-2">
          {e.probleme.map(([p, s]) => <div key={p}><b>{p}</b><div>{s}</div></div>)}
        </div>
      </Card>
    </div>
  );
}
