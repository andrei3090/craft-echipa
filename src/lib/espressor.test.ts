import { describe, expect, it } from 'vitest';
import { verdict } from './calc';

const timp = { id: 'timp', nume: 'Timp', unit: 's', min: 25, max: 30, text: '25–30 s' };

describe('espresso dial-in', () => {
  it('says too fast, good or too slow', () => {
    expect(verdict(timp, '21')).toBe('jos');
    expect(verdict(timp, '27,5')).toBe('ok');
    expect(verdict(timp, '33')).toBe('sus');
    expect(verdict(timp, '')).toBeNull();
  });
});
