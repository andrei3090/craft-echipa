// Dev-only stand-in for the Apps Script backend (npm run dev). Never part of the build.
// It serves the real content from ../backend/continut.json when that file exists locally,
// so the public repository never contains the team manual or the checklists.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

const AVATARE = [
  { id: 'girafa', emoji: '🦒', nume: 'Girafa' },
  { id: 'maimuta', emoji: '🐒', nume: 'Maimuța' },
  { id: 'papagal', emoji: '🦜', nume: 'Papagal' },
  { id: 'elefant', emoji: '🐘', nume: 'Elefant' },
];
const PIN = '2580';

type Row = { id: string; data: string; ora: string; avatar: string; tip: string; titlu: string; rezumat: string; alerta: string; json: unknown };

// Runs the real backend/Scor.gs against the mock rows, so local tests check the real scoring.
function scorFromBackend(rows: Row[], avatar: string, today: string, now: string) {
  const p = resolve(__dirname, '../../backend/Scor.gs');
  if (!existsSync(p)) return { ok: false, error: 'Scor.gs lipsă' };
  const fn = new Function('rows', 'azi', 'ora', 'AVATARE', 'Utilities', 'TZ', 'esc', 'props', 'TRIMITE_EMAIL', 'a',
    readFileSync(p, 'utf8') + '\nreturn scorAvatar(a);');
  const U = { formatString: (_f: string, h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` };
  return fn(() => rows, () => today, () => now, AVATARE, U, 'Europe/Bucharest', (x: string) => x, () => ({}), false, avatar);
}

// Runs the real backend/Program.gs (schedule + swaps) against an in-memory store.
type ProgRow = { data: string; tura: string; avatar: string; nota: string };
type Cerere = { id: string; [k: string]: string };
const progMem = { ture: [] as ProgRow[], cereri: [] as Cerere[] };
const progStore = {
  ture: () => progMem.ture.map(r => ({ ...r })),
  cereri: () => progMem.cereri.map(r => ({ ...r })),
  salveazaTure: (list: ProgRow[]) => list.forEach(r => {
    const i = progMem.ture.findIndex(x => x.data === r.data && x.tura === r.tura);
    if (i >= 0) progMem.ture[i] = { ...r }; else progMem.ture.push({ ...r });
  }),
  salveazaCerere: (c: Cerere) => { const i = progMem.cereri.findIndex(x => x.id === c.id); if (i >= 0) progMem.cereri[i] = { ...c }; else progMem.cereri.push({ ...c }); },
  dupaSchimbare: () => {},
  anunta: (subiect: string) => console.log('[mock e-mail]', subiect),
};
function program(fn: string, ...args: unknown[]) {
  const p = resolve(__dirname, '../../backend/Program.gs');
  const t = new Date(), today = new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const now = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  const f = new Function('azi', 'ora', 'AVATARE', 'Utilities', 'esc', 'STORE', 'ARGS',
    readFileSync(p, 'utf8') + `\nPROG_STORE = STORE; return ${fn}(...ARGS);`);
  return f(() => today, () => now, AVATARE, { getUuid: () => crypto.randomUUID() }, (x: string) => x, progStore, args);
}

export function mockApi(): Plugin {
  const rows: Row[] = [];
  const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const content = () => {
    const p = resolve(__dirname, '../../backend/continut.json');
    return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
  };
  return {
    name: 'mock-api',
    configureServer(server) {
      server.middlewares.use('/mock-api', (req, res) => {
        let body = '';
        req.on('data', c => (body += c));
        req.on('end', () => {
          const d = JSON.parse(body || '{}');
          const send = (o: unknown) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(o)); };
          setTimeout(() => {
            if (d.action === 'avatare') return send({ ok: true, avatare: AVATARE });
            if (d.action === 'program') return send(program('programPublic', d.saptamani));
            if (d.action === 'login') return d.pin === PIN ? send({ ok: true, token: `${d.avatar}.${today()}.x`, data: today() }) : send({ ok: false, error: 'PIN greșit' });
            const [avatar, day] = String(d.token || '').split('.');
            if (day !== today()) return send({ ok: false, error: 'sesiune expirată' });
            try {
              if (d.action === 'cereri') return send(program('cereriPentru', avatar));
              if (d.action === 'cere_schimb') return send(program('cereSchimb', avatar, d));
              if (d.action === 'raspunde') return send(program('raspundeCerere', avatar, d));
              if (d.action === 'anuleaza') return send(program('anuleazaCerere', avatar, d));
            } catch (e) { return send({ ok: false, error: String(e) }); }
            if (d.action === 'continut') return send({ ok: true, continut: content() });
            if (d.action === 'scor') { const t = new Date(); return send(scorFromBackend(rows, avatar, today(), `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`)); }
            if (d.action === 'azi') {
              const zi = rows.filter(r => r.data === today()).map(({ json: _j, ...r }) => r);
              const done = (tip: string) => Object.fromEntries(rows.filter(r => r.tip === tip).flatMap(r => ((r.json as { facute?: string[] }).facute ?? []).map(id => [id, { avatar: r.avatar, data: r.data }])));
              return send({ ok: true, data: today(), saptamana: 'W', zi, saptamanal: done('saptamanal'), lunar: done('lunar') });
            }
            if (d.action === 'salveaza') {
              const i = d.inregistrare;
              if (!rows.some(r => r.id === i.id)) {
                const t = new Date();
                rows.push({ id: i.id, data: today(), ora: `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`, avatar, tip: i.tip, titlu: i.titlu, rezumat: i.tip === 'tura' ? i.continut.tura : '', alerta: i.tip === 'raport' && (Number(i.continut.dif_card) || Number(i.continut.dif_numerar)) ? 'diferență' : '', json: i.continut });
              }
              return send({ ok: true, id: i.id, pdf: '#' });
            }
            send({ ok: false, error: 'acțiune necunoscută' });
          }, 250);
        });
      });
    },
  };
}
