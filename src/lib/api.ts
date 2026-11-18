import { get, set } from 'idb-keyval';
import { Avatar, Continut, Stare, type Inregistrare } from './types';
import { z } from 'zod';

let apiUrl: string | null = null;

export class SessionExpired extends Error {}

async function endpoint(): Promise<string> {
  if (apiUrl !== null) return apiUrl;
  if (import.meta.env.DEV) return (apiUrl = '/mock-api');
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}config.json`, { cache: 'no-store' });
    apiUrl = ((await r.json()) as { api?: string }).api ?? '';
    await set('cfg.api', apiUrl);
  } catch {
    apiUrl = ((await get('cfg.api')) as string | undefined) ?? '';
  }
  return apiUrl;
}

// Apps Script web apps accept a "simple" POST (text/plain), which avoids a CORS preflight.
export async function call<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const url = await endpoint();
  if (!url) throw new Error('Aplicația nu e legată încă de Google (lipsește adresa în config.json).');
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, ...payload }) });
  const j = (await r.json()) as { ok: boolean; error?: string } & T;
  if (!j.ok) {
    if (/sesiune/i.test(j.error ?? '')) throw new SessionExpired(j.error);
    throw new Error(j.error ?? 'eroare');
  }
  return j;
}

export async function getAvatare(): Promise<Avatar[]> {
  try {
    const r = await call<{ avatare: unknown }>('avatare');
    const list = z.array(Avatar).parse(r.avatare);
    await set('avatare', list);
    return list;
  } catch (e) {
    const cached = (await get('avatare')) as Avatar[] | undefined;
    if (cached) return cached;
    throw e;
  }
}

export async function login(avatar: string, pin: string) {
  return call<{ token: string; data: string }>('login', { avatar, pin });
}

export async function getContinut(token: string): Promise<Continut> {
  try {
    const r = await call<{ continut: unknown }>('continut', { token });
    const c = Continut.parse(r.continut);
    await set('continut', c);
    return c;
  } catch (e) {
    if (e instanceof SessionExpired) throw e;
    const cached = (await get('continut')) as Continut | undefined;
    if (cached) return cached;
    throw e;
  }
}

export async function getStare(token: string): Promise<Stare> {
  const r = await call<unknown>('azi', { token });
  return Stare.parse(r);
}

export async function salveaza(token: string, inregistrare: Inregistrare) {
  return call<{ id: string; pdf: string }>('salveaza', { token, inregistrare });
}
