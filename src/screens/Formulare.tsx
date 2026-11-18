import { clsx } from 'clsx';
import { ChevronRight, Info } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, CheckRow, Field, PageTitle, SaveBar, inputCls } from '../components/ui';
import { go } from '../lib/route';
import { azi, newId, oraAcum, useDraft } from '../lib/session';
import type { Continut } from '../lib/types';
import { useSave } from '../lib/useSave';

export default function Formulare({ c }: { c: Continut }) {
  return (
    <div>
      <PageTitle emoji="📋" title="Formulare" sub="Le completezi când se întâmplă ceva. Fiecare salvare ajunge la Andrei în Drive." backTo={false} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Object.entries(c.formulare).map(([id, f]) => (
          <button key={id} onClick={() => go(`form/${id}`)} className="flex items-center gap-4 rounded-3xl border border-line bg-card p-4 text-left shadow-sm active:scale-[.99]">
            <span className="grid size-14 place-items-center rounded-2xl bg-cream text-3xl">{f.emoji}</span>
            <span className="flex-1 text-lg font-extrabold">{f.titlu}</span>
            <ChevronRight className="text-muted" />
          </button>
        ))}
        <button onClick={() => go('raport')} className="flex items-center gap-4 rounded-3xl border border-line bg-card p-4 text-left shadow-sm active:scale-[.99]">
          <span className="grid size-14 place-items-center rounded-2xl bg-cream text-3xl">🧾</span>
          <span className="flex-1 text-lg font-extrabold">Raport de închidere</span>
          <ChevronRight className="text-muted" />
        </button>
      </div>
    </div>
  );
}

export function FormularScreen({ c, id }: { c: Continut; id?: string }) {
  const f = id ? c.formulare[id] : undefined;
  const [d, setD, clear] = useDraft<{ tip: string; v: Record<string, string | boolean> }>(`${azi()}:form:${id}`, { tip: '', v: { ora: oraAcum() } });
  const { save, busy } = useSave();
  const [tried, setTried] = useState(false);
  if (!f || !id) return <PageTitle title="Formular" />;

  const empty = !Object.entries(d.v).some(([k, v]) => k !== 'ora' && (typeof v === 'string' ? v.trim() : v)) || (f.tipuri && !d.tip);

  const submit = async () => {
    setTried(true);
    if (empty) return;
    const ok = await save({
      id: newId(id), tip: id as 'incident' | 'receptie', titlu: f.titlu,
      continut: { tip: d.tip, valori: d.v, etichete: Object.fromEntries(f.campuri.map(x => [x.id, x.label])) },
    });
    if (ok) { clear(); go('formulare'); }
  };

  return (
    <div>
      <PageTitle emoji={f.emoji} title={f.titlu} />
      <Card tone="sun" className="mb-4 flex gap-3"><Info className="mt-0.5 size-5 flex-none" /><span>{f.nota}</span></Card>
      <div className="space-y-4">
        {f.tipuri && (
          <div>
            <span className="mb-2 block font-bold">Ce fel de incident</span>
            <div className="flex flex-wrap gap-2">
              {f.tipuri.map(t => (
                <button key={t} onClick={() => setD(p => ({ ...p, tip: t }))}
                  className={clsx('rounded-full border px-4 py-2 font-bold', d.tip === t ? 'border-jungle bg-jungle text-white' : 'border-line bg-card',
                    tried && !d.tip && 'border-clay')}>{t}</button>
              ))}
            </div>
          </div>
        )}
        {f.campuri.map(x => {
          const v = d.v[x.id];
          const set = (val: string | boolean) => setD(p => ({ ...p, v: { ...p.v, [x.id]: val } }));
          if (x.tip === 'bifa') return <CheckRow key={x.id} checked={!!v} onToggle={() => set(!v)}>{x.label}</CheckRow>;
          if (x.tip === 'textarea') return <Field key={x.id} label={x.label}><textarea rows={3} value={String(v ?? '')} onChange={e => set(e.target.value)} className={inputCls} /></Field>;
          return (
            <Field key={x.id} label={x.label}>
              <input type={x.tip === 'ora' ? 'time' : 'text'} inputMode={x.tip === 'numar' ? 'decimal' : undefined} value={String(v ?? '')}
                onChange={e => set(e.target.value)} className={clsx(inputCls, x.tip === 'ora' || x.tip === 'numar' ? 'max-w-48' : '')} />
            </Field>
          );
        })}
        {tried && empty && <p className="font-bold text-clay">{f.tipuri && !d.tip ? 'Alege ce fel de incident a fost și completează cel puțin un câmp.' : 'Completează cel puțin un câmp.'}</p>}
      </div>
      <SaveBar><Button onClick={submit} busy={busy}>Salvează</Button></SaveBar>
    </div>
  );
}
