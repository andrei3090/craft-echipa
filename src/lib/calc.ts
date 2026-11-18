// Closing-report arithmetic, the same formulas as the paper form.
//   card:    C − B = 0
//   numerar: N + P − F − A = 0
//   plic:    N − fond lăsat

export const num = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = parseFloat(String(v ?? '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
const r2 = (n: number) => Math.round(n * 100) / 100;

export type Valori = Record<string, string>;

/** Cash counted from the banknote table; "monede" is entered as a lei amount. */
export function totalBancnote(b: Record<string, string>): number {
  return r2(Object.entries(b).reduce((s, [k, v]) => s + (k === 'monede' ? num(v) : num(k) * num(v)), 0));
}

export function calculeaza(v: Valori) {
  const A = num(v.z_numerar), B = num(v.z_card), C = num(v.pos_total);
  const F = num(v.fond_start), P = num(v.plati), N = num(v.numerar);
  return {
    dif_card: r2(C - B),
    dif_numerar: r2(N + P - F - A),
    plic: r2(N - num(v.fond_ramas)),
    z_ok: Math.abs(num(v.z_total) - (A + B)) < 0.005,
  };
}

/** Temperature check against the limits of the DSP register. */
export function inAfaraLimitei(valoare: string, min: number | null, max: number | null): boolean {
  if (valoare.trim() === '') return false;
  const t = num(valoare);
  return (min !== null && t < min) || (max !== null && t > max);
}

export function textLimita(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `${min > 0 ? '+' : ''}${min} … +${max} °C`;
  if (max !== null) return `${max} °C sau mai rece`;
  if (min !== null) return `minim ${min} °C`;
  return '—';
}
