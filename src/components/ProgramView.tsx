import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { useState } from 'react';
import { getProgram } from '../lib/api';
import type { Avatar, Program, Saptamana, Slot } from '../lib/types';

export const TURA_INFO: Record<string, { nume: string; emoji: string; bg: string }> = {
  D: { nume: 'Dimineață', emoji: '🌅', bg: 'bg-sun-soft border-[#f1dca8]' },
  S: { nume: 'Seară', emoji: '🌙', bg: 'bg-leaf border-[#cfe0d3]' },
  X: { nume: 'Extra', emoji: '➕', bg: 'bg-white border-dashed border-[#cbbfae]' },
};

export function useProgram() {
  return useQuery({ queryKey: ['program'], queryFn: getProgram, refetchInterval: 5 * 60_000, retry: 1 });
}

const toMin = (hm: string) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
export const acumInTura = (p: Program, data: string, s: Slot) =>
  data === p.azi && toMin(p.ora) >= toMin(s.start) && toMin(p.ora) < toMin(s.sfarsit);

/** Week tabs + the schedule grid. Shows avatars only (it is also on the public login screen). */
export function ProgramView({ program, avatare, me, onSlot, pending = [] }: {
  program: Program; avatare: Avatar[]; me?: string; onSlot?: (s: Slot, data: string) => void; pending?: string[];
}) {
  const [k, setK] = useState(0);
  const w = program.saptamani[Math.min(k, program.saptamani.length - 1)];
  return (
    <div>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {program.saptamani.map((s, i) => (
          <button key={s.luni} onClick={() => setK(i)}
            className={clsx('flex-none rounded-full border px-4 py-2 text-sm font-bold', i === k ? 'border-jungle bg-jungle text-white' : 'border-line bg-card')}>
            {i === 0 ? 'Săptămâna asta' : i === 1 ? 'Săptămâna viitoare' : s.eticheta.split(' – ')[0].replace(/^\S+ /, 'de la ')}
          </button>
        ))}
      </div>
      <p className="mb-3 text-sm text-muted">{w.eticheta}</p>
      <WeekGrid w={w} program={program} avatare={avatare} me={me} onSlot={onSlot} pending={pending} />
      <Ore w={w} avatare={avatare} />
    </div>
  );
}

function WeekGrid({ w, program, avatare, me, onSlot, pending }: {
  w: Saptamana; program: Program; avatare: Avatar[]; me?: string; onSlot?: (s: Slot, data: string) => void; pending: string[];
}) {
  const av = (id: string) => avatare.find(a => a.id === id) ?? { id, emoji: '❔', nume: id || 'liber' };
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
      {w.zile.map(z => {
        const today = z.data === program.azi, trecut = z.data < program.azi;
        return (
          <div key={z.data} className={clsx('flex gap-2 rounded-2xl border p-2 sm:flex-col', today ? 'border-jungle bg-leaf/60' : 'border-line bg-card', trecut && 'opacity-55')}>
            <div className={clsx('w-16 flex-none text-sm font-extrabold sm:w-auto sm:text-center', today && 'text-jungle')}>
              {z.eticheta.split(' ').slice(0, 2).join(' ')}{today && <span className="block text-xs">azi</span>}
            </div>
            <div className="grid flex-1 grid-cols-3 gap-1.5 sm:grid-cols-1">
              {z.sloturi.map(s => {
                const a = av(s.avatar), mine = !!me && s.avatar === me, acum = acumInTura(program, z.data, s);
                const Tag = onSlot ? 'button' : 'div';
                return (
                  <Tag key={s.id} {...(onSlot ? { onClick: () => onSlot(s, z.data) } : {})}
                    className={clsx('relative rounded-xl border px-1.5 py-2 text-center', TURA_INFO[s.tura].bg,
                      mine && 'ring-2 ring-jungle', onSlot && 'active:scale-95', acum && 'shadow-[0_0_0_3px_var(--color-sun)]')}>
                    <div className="text-[11px] font-bold text-muted">{TURA_INFO[s.tura].emoji} {s.start}–{s.sfarsit}</div>
                    <div className="text-2xl leading-tight" aria-hidden>{a.emoji}</div>
                    <div className="truncate text-xs font-extrabold">{a.nume}{s.extra && <span className="font-normal text-muted"> · extra</span>}</div>
                    {acum && <div className="mt-0.5 text-[10px] font-extrabold text-jungle uppercase">acum</div>}
                    {(s.schimbat || pending.includes(s.id)) && (
                      <span className="absolute -top-1.5 -right-1 rounded-full bg-white px-1 text-xs shadow-sm" title={pending.includes(s.id) ? 'cerere în așteptare' : 'schimbată'}>
                        {pending.includes(s.id) ? '⏳' : '🔁'}
                      </span>
                    )}
                  </Tag>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Ore({ w, avatare }: { w: Saptamana; avatare: Avatar[] }) {
  const av = (id: string) => avatare.find(a => a.id === id);
  const list = Object.entries(w.ore);
  if (!list.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2 text-sm">
      {list.map(([id, h]) => (
        <span key={id} className="rounded-full border border-line bg-card px-3 py-1 font-bold">{av(id)?.emoji} {av(id)?.nume ?? id}: {h} h</span>
      ))}
      {Object.entries(w.oreExtra).map(([id, h]) => (
        <span key={id + 'x'} className="rounded-full border border-dashed border-[#cbbfae] bg-card px-3 py-1 font-bold">➕ extra weekend: {h} h</span>
      ))}
    </div>
  );
}

/** Small box for the login screen: who is on shift now + the week. */
export function ProgramLogin({ avatare }: { avatare: Avatar[] }) {
  const q = useProgram();
  if (q.isLoading) return <div className="h-64 animate-pulse rounded-3xl bg-line/60" />;
  if (!q.data) return null;
  const p = q.data, z = p.saptamani[0]?.zile.find(x => x.data === p.azi);
  const acum = z?.sloturi.filter(s => acumInTura(p, z.data, s) && s.avatar) ?? [];
  return (
    <section className="w-full rounded-3xl border border-line bg-card/80 p-4 text-left shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl text-jungle">📅 Programul</h2>
        {acum.length > 0 && (
          <span className="rounded-full bg-sun-soft px-3 py-1 text-sm font-bold">
            Acum în tură: {acum.map(s => avatare.find(a => a.id === s.avatar)?.emoji).join(' ')}
          </span>
        )}
      </div>
      <ProgramView program={p} avatare={avatare} />
      <p className="mt-3 text-sm text-muted">Vrei să schimbi o tură? Intră cu PIN-ul, apoi <b>Program</b>.</p>
    </section>
  );
}
