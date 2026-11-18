import { clsx } from 'clsx';
import { Camera, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Card, CheckRow, Field, PageTitle, SaveBar, inputCls } from '../components/ui';
import { calculeaza, totalBancnote } from '../lib/calc';
import { photoToBase64 } from '../lib/image';
import { go } from '../lib/route';
import { azi, newId, useDraft } from '../lib/session';
import { useAvatare, useSaved } from '../lib/status';
import type { Continut, Stare } from '../lib/types';
import { useSave } from '../lib/useSave';

type Draft = {
  v: Record<string, string>;
  bancnote: Record<string, string>;
  tabele: Record<string, string[][]>;
  copii: string;
  probleme: string;
  verificari: Record<string, boolean>;
};
const CALC = new Set(['dif_card', 'dif_numerar', 'plic']);

export default function Raport({ c, stare }: { c: Continut; stare?: Stare }) {
  const r = c.raport;
  const fond = String(r.fond_casa ?? '');
  const [d, setD, clear] = useDraft<Draft>(`${azi()}:raport`, { v: { fond_start: fond, fond_ramas: fond }, bancnote: {}, tabele: {}, copii: '', probleme: '', verificari: {} });
  const [poze, setPoze] = useState<{ key: string; b64: string }[]>([]);   // not kept in drafts (too large)
  const { save, busy } = useSave();
  const saved = useSaved(stare);
  const av = useAvatare();
  const [tried, setTried] = useState(false);
  const sv = saved('raport');

  const calc = calculeaza(d.v);
  const numarat = totalBancnote(d.bancnote);
  const set = (k: string, val: string) => setD(p => ({ ...p, v: { ...p.v, [k]: val.replace(/[^\d,.\-]/g, '') } }));
  const required = ['z_nr', 'z_total', 'z_numerar', 'z_card', 'pos_total', 'numerar'];
  const lipsa = required.filter(k => !(d.v[k] ?? '').trim());

  const field = ([label, unit, key]: [string, string, string]) => {
    if (CALC.has(key)) {
      const val = calc[key as 'dif_card' | 'dif_numerar' | 'plic'];
      const bad = key !== 'plic' && val !== 0;
      return (
        <div key={key} className={clsx('flex items-center justify-between rounded-2xl px-4 py-3 font-bold', bad ? 'bg-clay-soft text-clay' : 'bg-leaf text-jungle-dark')}>
          <span>{label}</span><span className="text-xl">{val.toFixed(2)} lei</span>
        </div>
      );
    }
    return (
      <Field key={key} label={label} hint={unit && unit !== 'lei' ? unit : undefined}>
        <input inputMode="decimal" value={d.v[key] ?? ''} onChange={e => set(key, e.target.value)}
          className={clsx(inputCls, tried && required.includes(key) && !(d.v[key] ?? '').trim() && 'border-clay')} />
      </Field>
    );
  };

  const table = (key: 'pierderi' | 'de_comandat' | 'petreceri', title: string) => {
    const t = r[key];
    const rows = d.tabele[key] ?? Array.from({ length: t.randuri }, () => t.coloane.map(() => ''));
    const upd = (i: number, j: number, val: string) => setD(p => {
      const cur = (p.tabele[key] ?? rows).map(x => [...x]);
      cur[i][j] = val;
      return { ...p, tabele: { ...p.tabele, [key]: cur } };
    });
    return (
      <Card key={key}>
        <h2 className="mb-3 font-extrabold">{title}</h2>
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="grid gap-2" style={{ gridTemplateColumns: t.coloane.map((_, j) => (j === 0 ? '2fr' : '1fr')).join(' ') }}>
              {row.map((cell, j) => (
                key === 'pierderi' && j === 2 && t.motive ? (
                  <select key={j} value={cell} onChange={e => upd(i, j, e.target.value)} className={inputCls} aria-label={t.coloane[j]}>
                    <option value="">{t.coloane[j]}</option>
                    {t.motive.map(m => <option key={m}>{m}</option>)}
                  </select>
                ) : (
                  <input key={j} value={cell} onChange={e => upd(i, j, e.target.value)} placeholder={t.coloane[j]} className={inputCls} />
                )
              ))}
            </div>
          ))}
        </div>
        <button onClick={() => setD(p => ({ ...p, tabele: { ...p.tabele, [key]: [...rows, t.coloane.map(() => '')] } }))} className="mt-2 font-bold text-jungle">+ încă un rând</button>
      </Card>
    );
  };

  const addPhoto = async (f: File | undefined) => {
    if (!f) return;
    const key = crypto.randomUUID();
    setPoze(p => [...p, { key, b64: '' }]);
    try { const b64 = await photoToBase64(f); setPoze(p => p.map(x => (x.key === key ? { ...x, b64 } : x))); }
    catch { toast.error('Poza nu s-a putut citi'); setPoze(p => p.filter(x => x.key !== key)); }
  };

  const submit = async () => {
    setTried(true);
    if (lipsa.length) { toast.error('Completează câmpurile marcate cu roșu.'); return; }
    const etichete = Object.fromEntries([...r.campuri_casa, ...r.campuri_card, ...r.campuri_numerar].map(([l, , k]) => [k, l]));
    const ok = await save({
      id: newId('raport'), tip: 'raport', titlu: 'Raport de închidere',
      continut: {
        valori: { ...d.v, ...Object.fromEntries([...CALC].map(k => [k, String(calc[k as keyof typeof calc])])), bancnote_total: String(numarat), copii_loc_joaca: d.copii },
        etichete: { ...etichete, bancnote_total: 'Numerar din numărătoarea bancnotelor', copii_loc_joaca: r.copii_loc_joaca },
        dif_card: calc.dif_card, dif_numerar: calc.dif_numerar,
        bancnote: d.bancnote,
        pierderi: (d.tabele.pierderi ?? []), de_comandat: (d.tabele.de_comandat ?? []), petreceri: (d.tabele.petreceri ?? []),
        probleme: d.probleme.trim(),
        verificari: r.verificari.map(v => ({ text: v, facut: !!d.verificari[v] })),
      },
      poze: poze.filter(p => p.b64).map(p => ({ b64: p.b64 })),
    });
    if (ok) { clear(); setPoze([]); go('azi'); }
  };

  return (
    <div className="space-y-4">
      <PageTitle emoji="🧾" title="Raport de închidere" sub="Se face după raportul Z. Diferențele se calculează singure." />
      {sv && <Card tone="leaf">Trimis azi de {av(sv.avatar).emoji} {av(sv.avatar).nume} la {sv.ora}.</Card>}

      <Card><h2 className="mb-3 font-extrabold">Casa de marcat (raport Z)</h2><div className="grid gap-3 sm:grid-cols-2">{r.campuri_casa.map(field)}</div>
        {!calc.z_ok && d.v.z_total && <p className="mt-3 font-bold text-clay">Numerar + card nu dă totalul Z. Verifică cifrele.</p>}</Card>
      <Card><h2 className="mb-3 font-extrabold">Card</h2><div className="grid gap-3 sm:grid-cols-2">{r.campuri_card.map(field)}</div></Card>

      <Card>
        <h2 className="mb-1 font-extrabold">Numărătoarea banilor</h2>
        <p className="mb-3 text-sm text-muted">Câte bancnote de fiecare. La „monede” scrii suma în lei.</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {r.bancnote.map(b => (
            <Field key={b} label={b === 'monede' ? 'monede (lei)' : `${b} lei × `}>
              <input inputMode="decimal" value={d.bancnote[b] ?? ''} onChange={e => setD(p => ({ ...p, bancnote: { ...p.bancnote, [b]: e.target.value.replace(/[^\d,.]/g, '') } }))} className={inputCls} />
            </Field>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-cream px-4 py-3">
          <span className="font-bold">Total numărat: {numarat.toFixed(2)} lei</span>
          <Button variant="ghost" onClick={() => set('numerar', String(numarat))}>Pune la „Numerar numărat”</Button>
        </div>
      </Card>

      <Card><h2 className="mb-3 font-extrabold">Numerar</h2><div className="grid gap-3 sm:grid-cols-2">{r.campuri_numerar.map(field)}</div></Card>

      {table('pierderi', 'Pierderi (aruncate)')}
      {table('de_comandat', 'De comandat')}
      {table('petreceri', 'Petreceri și ateliere azi')}

      <Card>
        <Field label={r.copii_loc_joaca}><input inputMode="numeric" value={d.copii} onChange={e => setD(p => ({ ...p, copii: e.target.value.replace(/\D/g, '') }))} className={`${inputCls} max-w-40`} /></Field>
        <div className="mt-4"><Field label="Probleme și incidente" hint={r.probleme.indiciu}>
          <textarea rows={3} value={d.probleme} onChange={e => setD(p => ({ ...p, probleme: e.target.value }))} className={inputCls} />
        </Field></div>
      </Card>

      <Card>
        <h2 className="mb-2 font-extrabold">Poze: Z, bonul de la terminal, plicul</h2>
        <div className="flex flex-wrap gap-3">
          {poze.map((p, i) => (
            <div key={p.key} className="relative grid size-24 place-items-center overflow-hidden rounded-2xl border border-line bg-cream">
              {p.b64 ? <img src={`data:image/jpeg;base64,${p.b64}`} alt="" className="size-full object-cover" /> : <span className="text-sm text-muted">se pregătește…</span>}
              <button onClick={() => setPoze(x => x.filter((_, j) => j !== i))} className="absolute top-1 right-1 rounded-full bg-white/90 p-1" aria-label="Scoate poza"><X className="size-4" /></button>
            </div>
          ))}
          <label className="grid size-24 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-jungle/40 text-jungle">
            <Camera className="size-8" />
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { addPhoto(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 font-extrabold">Verificări la plecare</h2>
        <div className="space-y-2">
          {r.verificari.map(v => (
            <CheckRow key={v} checked={!!d.verificari[v]} onToggle={() => setD(p => ({ ...p, verificari: { ...p.verificari, [v]: !p.verificari[v] } }))}>{v}</CheckRow>
          ))}
        </div>
      </Card>

      <SaveBar>
        {(calc.dif_card !== 0 || calc.dif_numerar !== 0) && <span className="mr-auto font-bold text-clay">Există diferențe. Mai numără o dată; dacă rămân, salvează și sună-l pe Andrei.</span>}
        <Button onClick={submit} busy={busy || poze.some(p => !p.b64)}>Trimite raportul</Button>
      </SaveBar>
    </div>
  );
}
