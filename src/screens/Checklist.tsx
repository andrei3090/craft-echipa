import { useRef, useState } from 'react';
import { Button, Card, CheckRow, PageTitle, Progress, SaveBar, inputCls } from '../components/ui';
import { go } from '../lib/route';
import { azi, newId, oraAcum, useDraft } from '../lib/session';
import { useAvatare, useSaved } from '../lib/status';
import type { Continut, Stare } from '../lib/types';
import { useSave } from '../lib/useSave';

type Draft = { bife: Record<string, string>; obs: string };

export default function Checklist({ c, id, stare }: { c: Continut; id: string; stare?: Stare }) {
  const s = c.zilnic.find(x => x.id === id);
  const [draft, setDraft, clear] = useDraft<Draft>(`${azi()}:zilnic:${id}`, { bife: {}, obs: '' });
  const { save, busy } = useSave();
  const saved = useSaved(stare);
  const av = useAvatare();
  const [tried, setTried] = useState(false);
  const obsRef = useRef<HTMLTextAreaElement>(null);
  if (!s || s.tip !== 'lista') return <PageTitle title="Nu am găsit lista" />;

  const all = s.grupuri.flatMap(g => g.itemi);
  const done = all.filter(i => draft.bife[i.id]).length;
  const missing = all.length - done;
  const sv = saved('zilnic', s.titlu);

  const toggle = (itemId: string) =>
    setDraft(d => {
      const bife = { ...d.bife };
      if (bife[itemId]) delete bife[itemId]; else bife[itemId] = oraAcum();
      return { ...d, bife };
    });

  const submit = async () => {
    setTried(true);
    if (missing > 0 && !draft.obs.trim()) {
      obsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      obsRef.current?.focus({ preventScroll: true });
      return;
    }
    const ok = await save({
      id: newId('zilnic'),
      tip: 'zilnic',
      titlu: s.titlu,
      continut: {
        sectiune: s.id,
        total: all.length,
        facute: all.filter(i => draft.bife[i.id]).map(i => i.id),
        observatii: draft.obs.trim(),
        liste: s.grupuri.map(g => ({ nume: g.nume || s.titlu, itemi: g.itemi.map(i => ({ text: i.text, facut: !!draft.bife[i.id], ora: draft.bife[i.id] ?? '' })) })),
      },
    });
    if (ok) { clear(); go('azi'); }
  };

  return (
    <div>
      <PageTitle emoji={s.emoji} title={s.titlu} sub={s.cand} />
      {sv && (
        <Card tone="leaf" className="mb-4">
          Salvat azi de {av(sv.avatar).emoji} {av(sv.avatar).nume} la {sv.ora}{sv.pending ? ' (se trimite)' : ''}. Dacă mai completezi ceva, poți salva din nou.
        </Card>
      )}
      <div className="sticky top-[3.6rem] z-10 -mx-4 mb-4 bg-cream/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <Progress done={done} total={all.length} />
      </div>
      <div className="space-y-6">
        {s.grupuri.map(g => (
          <section key={g.nume}>
            {g.nume && <h2 className="mb-2 text-sm font-extrabold tracking-wider text-muted uppercase">{g.nume}</h2>}
            <div className="space-y-2">
              {g.itemi.map(i => (
                <CheckRow key={i.id} checked={!!draft.bife[i.id]} onToggle={() => toggle(i.id)} meta={draft.bife[i.id] ? `bifat la ${draft.bife[i.id]}` : undefined}>
                  {i.text}
                </CheckRow>
              ))}
            </div>
          </section>
        ))}
        <section>
          <h2 className="mb-2 font-extrabold">Observații</h2>
          <textarea ref={obsRef} value={draft.obs} onChange={e => setDraft(d => ({ ...d, obs: e.target.value }))} rows={3}
            placeholder={missing ? 'Ce n-ai putut face și de ce' : 'Opțional'} className={inputCls} />
          {tried && missing > 0 && !draft.obs.trim() && (
            <p className="mt-2 font-bold text-clay">Ai {missing} nebifate. Scrie la observații de ce n-ai putut, apoi salvează.</p>
          )}
        </section>
      </div>
      <SaveBar>
        <span className="mr-auto text-muted">{missing ? `${missing} nebifate` : 'Totul bifat 👏'}</span>
        <Button onClick={submit} busy={busy}>Salvează {s.titlu.toLowerCase()}</Button>
      </SaveBar>
    </div>
  );
}
