import 'fake-indexeddb/auto';
import { describe, expect, it, vi } from 'vitest';
import { enqueue, flush, useOutbox, type Pending } from './outbox';

const item = (id: string): Pending => ({ inregistrare: { id, tip: 'zilnic', titlu: 'Deschidere', continut: {} }, token: 't', avatar: 'girafa', t: Date.now() });

describe('offline outbox', () => {
  it('keeps saves when the network fails and sends them in order later', async () => {
    const offline = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await enqueue(item('a'), offline);
    await enqueue(item('b'), offline);
    expect(useOutbox.getState().pending.map(p => p.inregistrare.id)).toEqual(['a', 'b']);
    expect(useOutbox.getState().pending[0].error).toBe('Failed to fetch');

    const sent: string[] = [];
    const online = vi.fn(async (_t: string, i: { id: string }) => { sent.push(i.id); });
    expect(await flush(online)).toBe(2);
    expect(sent).toEqual(['a', 'b']);
    expect(useOutbox.getState().pending).toEqual([]);
  });

  it('skips a save the server refuses and still sends the others', async () => {
    const refused = (_t: string, i: { id: string }) => (i.id === 'bad' ? Promise.reject(new Error('tip necunoscut')) : Promise.resolve());
    await enqueue(item('bad'), () => Promise.reject(new TypeError('Failed to fetch')));
    await enqueue(item('good'), () => Promise.reject(new TypeError('Failed to fetch')));
    expect(await flush(refused)).toBe(1);
    const left = useOutbox.getState().pending;
    expect(left.map(p => p.inregistrare.id)).toEqual(['bad']);
    expect(left[0].error).toBe('tip necunoscut');
  });
});
