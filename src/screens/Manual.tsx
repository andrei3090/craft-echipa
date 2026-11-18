import DOMPurify from 'dompurify';
import { ChevronRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageTitle, inputCls } from '../components/ui';
import { go } from '../lib/route';
import type { Continut } from '../lib/types';

const plain = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Manual({ c }: { c: Continut }) {
  const [q, setQ] = useState('');
  const hits = useMemo(() => {
    const k = fold(q.trim());
    if (!k) return c.manual.map(m => ({ m, snip: '' }));
    return c.manual.flatMap(m => {
      const t = plain(m.html), i = fold(t).indexOf(k);
      if (i < 0 && !fold(m.titlu).includes(k)) return [];
      return [{ m, snip: i >= 0 ? '…' + t.slice(Math.max(0, i - 50), i + 90) + '…' : '' }];
    });
  }, [q, c.manual]);

  return (
    <div>
      <PageTitle emoji="📖" title="Manualul echipei" sub="Tot ce scrie în manualul tipărit. Caută după un cuvânt: alergeni, fond, incident…" backTo={false} />
      <div className="relative mb-4">
        <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Caută în manual" className={`${inputCls} pl-12`} />
      </div>
      <div className="space-y-2">
        {hits.map(({ m, snip }) => (
          <button key={m.id} onClick={() => go(`manual/${m.id}`)} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-card p-4 text-left active:scale-[.99]">
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-extrabold tracking-wider text-muted uppercase">{m.capitol}</span>
              <span className="block text-lg font-extrabold">{m.titlu}</span>
              {snip && <span className="mt-1 block text-sm text-muted">{snip}</span>}
            </span>
            <ChevronRight className="text-muted" />
          </button>
        ))}
        {!hits.length && <p className="text-muted">Nimic găsit. Încearcă alt cuvânt.</p>}
      </div>
    </div>
  );
}

export function ManualPage({ c, id }: { c: Continut; id: string }) {
  const i = c.manual.findIndex(m => m.id === id);
  const m = c.manual[i];
  if (!m) return <PageTitle title="Pagina nu există" />;
  const html = DOMPurify.sanitize(m.html, { ALLOWED_TAGS: ['p', 'b', 'strong', 'i', 'em', 'br', 'ul', 'ol', 'li', 'h2', 'h3', 'div', 'span', 'table', 'tr', 'td', 'th', 'thead', 'tbody'], ALLOWED_ATTR: ['class'] });
  const next = c.manual[i + 1];
  return (
    <div>
      <PageTitle title={m.titlu} sub={m.capitol} />
      <article className="manual" dangerouslySetInnerHTML={{ __html: html }} />
      {next && (
        <button onClick={() => go(`manual/${next.id}`)} className="mt-6 flex w-full items-center justify-between rounded-2xl border border-line bg-card p-4 font-bold">
          <span>Următorul: {next.titlu}</span><ChevronRight />
        </button>
      )}
    </div>
  );
}
