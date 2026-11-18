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
            if (d.action === 'login') return d.pin === PIN ? send({ ok: true, token: `${d.avatar}.${today()}.x`, data: today() }) : send({ ok: false, error: 'PIN greșit' });
            const [avatar, day] = String(d.token || '').split('.');
            if (day !== today()) return send({ ok: false, error: 'sesiune expirată' });
            if (d.action === 'continut') return send({ ok: true, continut: content() });
            if (d.action === 'azi') {
              const zi = rows.filter(r => r.data === today()).map(({ json: _j, ...r }) => r);
              const done = (tip: string) => Object.fromEntries(rows.filter(r => r.tip === tip).flatMap(r => ((r.json as { facute?: string[] }).facute ?? []).map(id => [id, { avatar: r.avatar, data: r.data }])));
              return send({ ok: true, data: today(), saptamana: 'W', zi, saptamanal: done('saptamanal'), lunar: done('lunar') });
            }
            if (d.action === 'salveaza') {
              const i = d.inregistrare;
              if (!rows.some(r => r.id === i.id)) {
                const t = new Date();
                rows.push({ id: i.id, data: today(), ora: `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`, avatar, tip: i.tip, titlu: i.titlu, rezumat: '', alerta: '', json: i.continut });
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
