import { Button, Card, CheckRow, PageTitle, SaveBar, inputCls } from '../components/ui';
import { go } from '../lib/route';
import { azi, newId, oraAcum, useDraft } from '../lib/session';
import { useAvatare, useSaved } from '../lib/status';
import type { Continut, Stare } from '../lib/types';
import { useSave } from '../lib/useSave';

export default function Runde({ c, ora, stare }: { c: Continut; ora?: string; stare?: Stare }) {
  const s = c.zilnic.find(x => x.tip === 'runde');
  const key = `${azi()}:runde:${ora}`;
  const [draft, setDraft, clear] = useDraft<{ bife: Record<string, string>; obs: string }>(key, { bife: {}, obs: '' });
  const { save, busy } = useSave();
  const saved = useSaved(stare);
  const av = useAvatare();
  if (!s || s.tip !== 'runde' || !ora) return <PageTitle title="Runde" />;
  const sv = saved('runde', `Runda ${ora}`);
  const done = s.itemi.filter(i => draft.bife[i.id]).length;

  const submit = async () => {
    const ok = await save({
      id: newId('runde'), tip: 'runde', titlu: `Runda ${ora}`,
      continut: {
        ora_planificata: ora, total: s.itemi.length, facute: s.itemi.filter(i => draft.bife[i.id]).map(i => i.id), observatii: draft.obs.trim(),
        liste: [{ nume: `Runda ${ora}`, itemi: s.itemi.map(i => ({ text: i.text, facut: !!draft.bife[i.id], ora: draft.bife[i.id] ?? '' })) }],
      },
    });
    if (ok) { clear(); go('azi'); }
  };

  return (
    <div>
      <PageTitle emoji={s.emoji} title={`Runda de la ${ora}`} sub="Bifează ce ai verificat acum." />
      {sv && <Card tone="leaf" className="mb-4">Făcută de {av(sv.avatar).emoji} {av(sv.avatar).nume} la {sv.ora}.</Card>}
      <div className="space-y-2">
        {s.itemi.map(i => (
          <CheckRow key={i.id} checked={!!draft.bife[i.id]} meta={draft.bife[i.id] && `bifat la ${draft.bife[i.id]}`}
            onToggle={() => setDraft(d => { const b = { ...d.bife }; if (b[i.id]) delete b[i.id]; else b[i.id] = oraAcum(); return { ...d, bife: b }; })}>
            {i.text}
          </CheckRow>
        ))}
      </div>
      <textarea value={draft.obs} onChange={e => setDraft(d => ({ ...d, obs: e.target.value }))} rows={2} placeholder="Observații (opțional)" className={`${inputCls} mt-4`} />
      <Card tone="sun" className="mt-4">
        <h2 className="mb-1 font-extrabold">Nu uita</h2>
        <ul className="list-disc space-y-1 pl-5">{s.reguli.map(r => <li key={r}>{r}</li>)}</ul>
      </Card>
      <SaveBar>
        <span className="mr-auto text-muted">{done}/{s.itemi.length}</span>
        <Button onClick={submit} busy={busy} disabled={!done}>Salvează runda</Button>
      </SaveBar>
    </div>
  );
}
