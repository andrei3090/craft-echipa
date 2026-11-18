import { clsx } from 'clsx';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, PageTitle, SaveBar, inputCls } from '../components/ui';
import { inAfaraLimitei, textLimita } from '../lib/calc';
import { go } from '../lib/route';
import { azi, newId, useDraft } from '../lib/session';
import { useAvatare, useSaved } from '../lib/status';
import type { Continut, Stare } from '../lib/types';
import { useSave } from '../lib/useSave';

type Moment = 'dimineața' | 'seara';
type Draft = { val: Record<string, string>; act: Record<string, string> };

export default function Temperaturi({ c, stare }: { c: Continut; stare?: Stare }) {
  const [moment, setMoment] = useState<Moment>(new Date().getHours() < 14 ? 'dimineața' : 'seara');
  const [draft, setDraft, clear] = useDraft<Draft>(`${azi()}:temp:${moment}`, { val: {}, act: {} });
  const { save, busy } = useSave();
  const saved = useSaved(stare);
  const av = useAvatare();
  const [tried, setTried] = useState(false);
  const titlu = `Temperaturi ${moment}`;
  const sv = saved('temperaturi', titlu);

  const rows = c.temperaturi.map(a => {
    const v = draft.val[a.id] ?? '';
    return { a, v, afara: inAfaraLimitei(v, a.min, a.max) };
  });
  const lipsa = rows.filter(r => r.v.trim() === '');
  const faraActiune = rows.filter(r => r.afara && !(draft.act[r.a.id] ?? '').trim());

  const setVal = (id: string, v: string) => setDraft(d => ({ ...d, val: { ...d.val, [id]: v.replace(/[^\d,.\-−]/g, '').replace('−', '-') } }));
  const flip = (id: string) => setDraft(d => {
    const v = d.val[id] ?? '';
    return { ...d, val: { ...d.val, [id]: v.startsWith('-') ? v.slice(1) : '-' + v } };
  });

  const submit = async () => {
    setTried(true);
    if (lipsa.length || faraActiune.length) return;
    const ok = await save({
      id: newId('temp'), tip: 'temperaturi', titlu,
      continut: {
        moment,
        citiri: rows.map(r => ({ id: r.a.id, nume: r.a.nume, limita: textLimita(r.a.min, r.a.max), valoare: r.v.replace(',', '.'), afara: r.afara, actiune: draft.act[r.a.id] ?? '' })),
      },
    });
    if (ok) { clear(); go('azi'); }
  };

  return (
    <div>
      <PageTitle emoji="🌡️" title="Temperaturi" sub="Citești termometrul fiecărui aparat și scrii valoarea reală. Se trec și în Registrul de temperaturi de hârtie." />
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-card p-1">
        {(['dimineața', 'seara'] as Moment[]).map(m => {
          const s = saved('temperaturi', `Temperaturi ${m}`);
          return (
            <button key={m} onClick={() => { setMoment(m); setTried(false); }}
              className={clsx('rounded-xl py-3 font-extrabold capitalize', moment === m ? 'bg-jungle text-white' : 'text-muted')}>
              {m} {s && '✔'}
            </button>
          );
        })}
      </div>
      {sv && <Card tone="leaf" className="mb-4">Citite de {av(sv.avatar).emoji} {av(sv.avatar).nume} la {sv.ora}.</Card>}
      <div className="space-y-3">
        {rows.map(({ a, v, afara }) => (
          <Card key={a.id} tone={afara ? 'clay' : undefined}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-extrabold">{a.nume}</div>
                <div className="text-sm text-muted">Limita: {textLimita(a.min, a.max)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => flip(a.id)} className="grid size-12 place-items-center rounded-2xl border border-line bg-white text-2xl font-extrabold" aria-label="Schimbă semnul">±</button>
                <input inputMode="decimal" value={v} onChange={e => setVal(a.id, e.target.value)} placeholder="°C" aria-label={`Temperatura ${a.nume}`}
                  className={clsx(inputCls, 'w-28 text-center text-xl font-extrabold', afara && 'border-clay text-clay')} />
              </div>
            </div>
            {afara && (
              <div className="mt-3">
                <p className="mb-2 flex items-center gap-2 font-bold text-clay"><AlertTriangle className="size-5" /> În afara limitei. Remăsori după 30 de minute; dacă rămâne, muți produsele și îl suni pe Andrei.</p>
                <input value={draft.act[a.id] ?? ''} onChange={e => setDraft(d => ({ ...d, act: { ...d.act, [a.id]: e.target.value } }))}
                  placeholder="Ce ai făcut (ex.: ușa era deschisă, remăsurat la 10:30: 3 °C)" className={inputCls} />
              </div>
            )}
          </Card>
        ))}
      </div>
      {tried && (lipsa.length > 0 || faraActiune.length > 0) && (
        <p className="mt-4 font-bold text-clay">
          {lipsa.length > 0 && `Lipsește temperatura la ${lipsa.length} aparat(e). `}
          {faraActiune.length > 0 && 'Scrie ce ai făcut la aparatele în afara limitei.'}
        </p>
      )}
      <SaveBar>
        <Button onClick={submit} busy={busy}>Salvează temperaturile de {moment}</Button>
      </SaveBar>
    </div>
  );
}
