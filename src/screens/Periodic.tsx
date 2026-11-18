import { CloudUpload } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, PageTitle, Progress } from '../components/ui';
import { useOutbox } from '../lib/outbox';
import { newId } from '../lib/session';
import { useAvatare } from '../lib/status';
import type { Continut, Periodic as Item, Stare } from '../lib/types';
import { useSave } from '../lib/useSave';

// Weekly and monthly cleaning (DSP programme). Each task is saved on its own, the moment it is done,
// so the whole team sees it on every device.
export default function Periodic({ c, stare }: { c: Continut; stare?: Stare }) {
  return (
    <div className="space-y-6">
      <PageTitle emoji="🧽" title="Curățenia săptămânii" sub="Din Programul de curățenie DSP. Apasă „Făcut” când ai terminat o sarcină." backTo={false} />
      <Lista tip="saptamanal" titlu="Săptămâna aceasta" items={c.saptamanal} done={stare?.saptamanal ?? {}} />
      <Lista tip="lunar" titlu="Luna aceasta" items={c.lunar} done={stare?.lunar ?? {}} />
    </div>
  );
}

function Lista({ tip, titlu, items, done }: { tip: 'saptamanal' | 'lunar'; titlu: string; items: Item[]; done: Record<string, { avatar: string; data: string }> }) {
  const pending = useOutbox(s => s.pending);
  const av = useAvatare();
  const { save } = useSave();
  const [busyId, setBusyId] = useState<string | null>(null);
  const waiting = new Set(pending.filter(p => p.inregistrare.tip === tip).flatMap(p => (p.inregistrare.continut.facute as string[]) ?? []));
  const count = items.filter(i => done[i.id] || waiting.has(i.id)).length;
  const zone = [...new Set(items.map(i => i.zona))];

  const mark = async (i: Item) => {
    setBusyId(i.id);
    await save({
      id: newId(tip), tip, titlu: `${tip === 'lunar' ? 'Lunar' : 'Săptămânal'}: ${i.zona}`,
      continut: { total: 1, facute: [i.id], liste: [{ nume: i.zona, itemi: [{ text: i.text, facut: true, ora: new Date().toTimeString().slice(0, 5) }] }] },
    });
    setBusyId(null);
  };

  const fmt = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}`;
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="font-display text-2xl text-jungle">{titlu}</h2>
        <div className="min-w-48 flex-1"><Progress done={count} total={items.length} /></div>
      </div>
      <div className="space-y-4">
        {zone.map(z => (
          <div key={z}>
            <h3 className="mb-2 text-sm font-extrabold tracking-wider text-muted uppercase">{z}</h3>
            <div className="space-y-2">
              {items.filter(i => i.zona === z).map(i => {
                const d = done[i.id];
                const w = waiting.has(i.id);
                return (
                  <Card key={i.id} tone={d || w ? 'leaf' : undefined} className="flex flex-wrap items-center gap-3 !p-3">
                    <div className="min-w-0 flex-1">
                      <div className="leading-snug">{i.text}</div>
                      {i.produs && <div className="text-sm text-muted">Produs: {i.produs}</div>}
                    </div>
                    {d ? <span className="font-bold text-jungle">✔ {av(d.avatar).emoji} {fmt(d.data)}</span>
                      : w ? <span className="flex items-center gap-1 font-bold text-jungle"><CloudUpload className="size-4 text-sun" /> se trimite</span>
                        : <Button variant="ghost" onClick={() => mark(i)} busy={busyId === i.id}>Făcut</Button>}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
