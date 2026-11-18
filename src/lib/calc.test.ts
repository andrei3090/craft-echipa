import { describe, expect, it } from 'vitest';
import { calculeaza, inAfaraLimitei, num, textLimita, totalBancnote } from './calc';

describe('closing report', () => {
  it('balances when cash and card match', () => {
    const r = calculeaza({ z_total: '1250', z_numerar: '450', z_card: '800', pos_total: '800', fond_start: '500', plati: '35', numerar: '915', fond_ramas: '500' });
    expect(r).toEqual({ dif_card: 0, dif_numerar: 0, plic: 415, z_ok: true });
  });
  it('shows the difference when cash is short', () => {
    const r = calculeaza({ z_numerar: '450', fond_start: '500', plati: '0', numerar: '940' });
    expect(r.dif_numerar).toBe(-10);
  });
  it('accepts comma decimals and blanks', () => {
    expect(num('12,5')).toBe(12.5);
    expect(num('')).toBe(0);
    expect(calculeaza({ pos_total: '100,10', z_card: '100,1' }).dif_card).toBe(0);
  });
  it('counts banknotes and coins', () => {
    expect(totalBancnote({ '200': '2', '50': '3', '1': '7', monede: '4,30' })).toBe(561.3);
  });
});

describe('temperatures', () => {
  it('flags values outside the DSP limits', () => {
    expect(inAfaraLimitei('5', 0, 4)).toBe(true);
    expect(inAfaraLimitei('3,5', 0, 4)).toBe(false);
    expect(inAfaraLimitei('-15', null, -18)).toBe(true);
    expect(inAfaraLimitei('-20', null, -18)).toBe(false);
    expect(inAfaraLimitei('', 0, 4)).toBe(false);
  });
  it('writes limits the way the register does', () => {
    expect(textLimita(2, 8)).toBe('+2 … +8 °C');
    expect(textLimita(0, 4)).toBe('0 … +4 °C');
    expect(textLimita(null, -18)).toBe('-18 °C sau mai rece');
  });
});
