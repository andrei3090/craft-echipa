import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { get } from 'idb-keyval';
import { X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ProgramView, TURA_INFO, useProgram } from '../components/ProgramView';
import { Button, Card, PageTitle, inputCls } from '../components/ui';
import { anuleaza, cereSchimb, getCereri, raspunde } from '../lib/api';
import { useSession } from '../lib/session';
import type { Avatar, Cerere, Program, Slot } from '../lib/types';

const toAbs = (d: string, hm: string) => Date.parse(d + 'T00:00:00Z') / 6e4 + Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));

export function useAvatarList() {
  return useQuery({ queryKey: ['avatare-list'], queryFn: async () => ((await get('avatare')) as Avatar[] | undefined) ?? [], staleTime: Infinity }).data ?? [];
}

export function useCereri() {
  const token = useSession(s => s.session?.token ?? '');
  return useQuery({ queryKey: ['cereri', token], queryFn: () => getCereri(token), enabled: !!token, refetchInterval: 60_000, retry: 1 });
}

const STARE: Record<string, string> = {
  'așteaptă': '⏳ așteaptă răspuns', 'acceptată': '✔ acceptată', 'refuzată': '✘ refuzată', 'anulată': 'anulată',
  'expirată': 'expirată (prea aproape de tură)', 'nu se mai poate': 'nu se mai poate',
};

export default function ProgramScreen() {
  const me = useSession(s => s.session!.avatar);
  const token = useSession(s => s.session!.token);
  const avatare = useAvatarList();
  const program = useProgram();
  const cereri = useCereri();
  const qc = useQueryClient();
  const [sel, setSel] = useState<{ s: Slot; data: string } | null>(null);
  const av = (id: string) => avatare.find(a => a.id === id) ?? { id, emoji: '🙂', nume: id };
  const refresh = () => { qc.invalidateQueries({ queryKey: ['program'] }); qc.invalidateQueries({ queryKey: ['cereri'] }); };

  const answer = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) => raspunde(token, id, accept),
    onSuccess: r => { toast.success(r.stare === 'acceptată' ? 'Gata, programul s-a schimbat.' : 'Ai refuzat cererea.'); refresh(); },
    onError: e => { toast.error((e as Error).message); refresh(); },
  });
  const cancel = useMutation({
    mutationFn: (id: string) => anuleaza(token, id),
    onSuccess: () => { toast.success('Cererea e anulată.'); refresh(); },
    onError: e => toast.error((e as Error).message),
  });

  const list = cereri.data ?? [];
  const pentruMine = list.filter(c => c.catre === me.id && c.stare === 'așteaptă');
  const aleMele = list.filter(c => c.de === me.id && c.stare === 'așteaptă');
  const istoric = list.filter(c => c.stare !== 'așteaptă').slice(0, 8);
  const pending = list.filter(c => c.stare === 'așteaptă').flatMap(c => [c.slot, c.slot2]).filter(Boolean);

  const onSlot = (s: Slot, data: string) => {
    const p = program.data!;
    if (s.tura === 'T') return toast('Ziua deschiderii: suntem toți acolo, tura nu se schimbă.');
    if (s.avatar !== me.id) return toast(`Tura e a lui ${av(s.avatar).emoji} ${av(s.avatar).nume}. Dacă vrei s-o iei, ea îți trimite cererea.`);
    if (toAbs(data, s.start) - toAbs(p.azi, p.ora) < p.reguli.oreMinim * 60)
      return toast.error(`Tura începe în mai puțin de ${p.reguli.oreMinim} de ore. Pentru schimb îl suni pe Andrei.`);
    setSel({ s, data });
  };

  return (
    <div className="space-y-5">
      <PageTitle emoji="📅" title="Programul" sub="Atinge una din turele tale ca s-o dai sau s-o schimbi cu o colegă. Se schimbă doar când colega acceptă." backTo={false} />

      {pentruMine.map(c => (
        <Card key={c.id} tone="sun">
          <h2 className="font-extrabold">🔁 {av(c.de).emoji} {av(c.de).nume} îți cere {c.slot2 ? 'un schimb' : 'să-i iei o tură'}</h2>
          <ul className="mt-2 space-y-1">
            <li>Tu iei: <b>{c.text1}</b></li>
            {c.slot2 && <li>{av(c.de).nume} ia tura ta: <b>{c.text2}</b></li>}
          </ul>
          {c.nota && <p className="mt-1 text-muted">„{c.nota}”</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button busy={answer.isPending} onClick={() => answer.mutate({ id: c.id, accept: true })}>Accept</Button>
            <Button variant="ghost" busy={answer.isPending} onClick={() => answer.mutate({ id: c.id, accept: false })}>Nu pot</Button>
          </div>
        </Card>
      ))}

      {aleMele.map(c => (
        <Card key={c.id}>
          <p>⏳ Ai cerut lui <b>{av(c.catre).emoji} {av(c.catre).nume}</b>: {c.slot2 ? 'schimb' : 'să-ți ia'} <b>{c.text1}</b>{c.slot2 && <> pentru <b>{c.text2}</b></>}.</p>
          <Button variant="ghost" className="mt-2" busy={cancel.isPending} onClick={() => cancel.mutate(c.id)}>Anulează cererea</Button>
        </Card>
      ))}

      {program.isError && !program.data && <p className="rounded-2xl bg-clay-soft p-4 text-clay">Nu s-a putut încărca programul: {(program.error as Error).message}</p>}
      {program.isLoading && <div className="h-72 animate-pulse rounded-3xl bg-line/60" />}
      {program.data && <ProgramView program={program.data} avatare={avatare} me={me.id} onSlot={onSlot} pending={pending} />}

      {istoric.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-extrabold tracking-wider text-muted uppercase">Cereri recente</h2>
          <ul className="space-y-1 text-sm">
            {istoric.map(c => (
              <li key={c.id} className="rounded-2xl border border-line bg-card px-3 py-2">
                {av(c.de).emoji} → {av(c.catre).emoji} · {c.text1}{c.text2 && <> ⇄ {c.text2}</>} · <b>{STARE[c.stare] ?? c.stare}</b>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Card tone="leaf">
        <h2 className="font-extrabold">Cum merge</h2>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Atingi tura ta → alegi colega → „să mi-o ia” sau „la schimb” cu o tură de-a ei.</li>
          <li>Colega vede cererea când intră în aplicație și apasă <b>Accept</b> sau <b>Nu pot</b>.</li>
          <li>Doar după „Accept” se schimbă programul. Andrei primește e-mail, iar programul din Drive se actualizează.</li>
          <li>Cu mai puțin de {program.data?.reguli.oreMinim ?? 48} de ore înainte de tură nu se mai face din aplicație: îl suni pe Andrei.</li>
        </ul>
      </Card>

      {sel && program.data && <SwapSheet program={program.data} sel={sel} me={me} avatare={avatare} onClose={() => setSel(null)} onDone={() => { setSel(null); refresh(); }} />}
    </div>
  );
}

function SwapSheet({ program, sel, me, avatare, onClose, onDone }: {
  program: Program; sel: { s: Slot; data: string }; me: Avatar; avatare: Avatar[]; onClose: () => void; onDone: () => void;
}) {
  const token = useSession(s => s.session!.token);
  const [catre, setCatre] = useState('');
  const [mod, setMod] = useState<'preia' | 'schimb'>('preia');
  const [slot2, setSlot2] = useState('');
  const [nota, setNota] = useState('');
  const send = useMutation({
    mutationFn: () => cereSchimb(token, sel.s.id, catre, mod === 'schimb' ? slot2 : '', nota),
    onSuccess: () => { toast.success('Cererea a plecat. Programul se schimbă când colega acceptă.'); onDone(); },
    onError: e => toast.error((e as Error).message),
  });

  const inProgram = new Set(program.saptamani.flatMap(w => w.zile.flatMap(z => z.sloturi.map(s => s.avatar))));
  const colege = avatare.filter(a => a.id !== me.id && inProgram.has(a.id));
  const now = toAbs(program.azi, program.ora);
  const aleEi = program.saptamani.flatMap(w => w.zile.flatMap(z => z.sloturi.filter(s => s.avatar === catre && toAbs(z.data, s.start) - now >= program.reguli.oreMinim * 60)
    .map(s => ({ s, eticheta: z.eticheta }))));
  const zi = program.saptamani.flatMap(w => w.zile).find(z => z.data === sel.data);
  const ok = catre && (mod === 'preia' || slot2);

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-ink/40 backdrop-blur-sm sm:place-items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream p-5 sm:rounded-3xl" onClick={e => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-jungle">Tura ta</h2>
            <p className="font-bold">{TURA_INFO[sel.s.tura].emoji} {zi?.eticheta}, {TURA_INFO[sel.s.tura].nume.toLowerCase()} {sel.s.start}–{sel.s.sfarsit}</p>
          </div>
          <button onClick={onClose} aria-label="Închide" className="grid size-11 place-items-center rounded-2xl border border-line bg-card"><X /></button>
        </div>

        <p className="mb-2 font-bold">1. Cui îi ceri?</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {colege.length === 0 && <p className="text-muted">Nu mai e nimeni în program.</p>}
          {colege.map(a => (
            <button key={a.id} onClick={() => { setCatre(a.id); setSlot2(''); }}
              className={clsx('flex items-center gap-2 rounded-2xl border px-4 py-3 font-extrabold', catre === a.id ? 'border-jungle bg-jungle text-white' : 'border-line bg-card')}>
              <span className="text-2xl">{a.emoji}</span>{a.nume}
            </button>
          ))}
        </div>

        {catre && (
          <>
            <p className="mb-2 font-bold">2. Cum?</p>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {([['preia', 'Să mi-o ia', 'ea lucrează în locul tău'], ['schimb', 'La schimb', 'iei tu o tură de-a ei']] as const).map(([id, t, sub]) => (
                <button key={id} onClick={() => setMod(id)}
                  className={clsx('rounded-2xl border p-3 text-left', mod === id ? 'border-jungle bg-leaf' : 'border-line bg-card')}>
                  <span className="block font-extrabold">{t}</span><span className="text-sm text-muted">{sub}</span>
                </button>
              ))}
            </div>
            {mod === 'schimb' && (
              <>
                <p className="mb-2 font-bold">3. Ce tură de-a ei iei?</p>
                <div className="mb-4 grid gap-2">
                  {aleEi.length === 0 && <p className="text-muted">Nu are ture la peste {program.reguli.oreMinim} de ore în program.</p>}
                  {aleEi.map(({ s, eticheta }) => (
                    <button key={s.id} onClick={() => setSlot2(s.id)}
                      className={clsx('rounded-2xl border px-4 py-3 text-left font-bold', slot2 === s.id ? 'border-jungle bg-leaf' : 'border-line bg-card')}>
                      {TURA_INFO[s.tura].emoji} {eticheta}, {TURA_INFO[s.tura].nume.toLowerCase()} {s.start}–{s.sfarsit}{s.extra && ' · extra'}
                    </button>
                  ))}
                </div>
              </>
            )}
            <label className="mb-4 block">
              <span className="mb-1 block font-bold">Motiv (dacă vrei)</span>
              <input value={nota} onChange={e => setNota(e.target.value)} maxLength={200} className={inputCls} placeholder="de ex. programare la medic" />
            </label>
          </>
        )}
        <Button className="w-full" disabled={!ok} busy={send.isPending} onClick={() => send.mutate()}>Trimite cererea</Button>
      </div>
    </div>
  );
}

/** Banner for the home screen when a colleague asked for a swap. */
export function CereriBanner({ onOpen }: { onOpen: () => void }) {
  const me = useSession(s => s.session!.avatar);
  const avatare = useAvatarList();
  const n = (useCereri().data ?? []).filter((c: Cerere) => c.catre === me.id && c.stare === 'așteaptă');
  if (!n.length) return null;
  const de = avatare.find(a => a.id === n[0].de);
  return (
    <button onClick={onOpen} className="w-full rounded-3xl border border-[#f1dca8] bg-sun-soft p-4 text-left font-extrabold shadow-sm">
      🔁 {n.length === 1 ? `${de?.emoji ?? ''} ${de?.nume ?? 'O colegă'} îți cere un schimb de tură` : `Ai ${n.length} cereri de schimb de tură`} → răspunde
    </button>
  );
}
