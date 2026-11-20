import { z } from 'zod';

export const Avatar = z.object({ id: z.string(), emoji: z.string(), nume: z.string() });
export type Avatar = z.infer<typeof Avatar>;

const Item = z.object({ id: z.string(), text: z.string() });
export type Item = z.infer<typeof Item>;

const SectiuneLista = z.object({
  id: z.string(), emoji: z.string(), titlu: z.string(), cand: z.string(), tip: z.literal('lista'),
  grupuri: z.array(z.object({ nume: z.string(), itemi: z.array(Item) })),
});
const SectiuneRunde = z.object({
  id: z.string(), emoji: z.string(), titlu: z.string(), cand: z.string(), tip: z.literal('runde'),
  ore: z.array(z.string()), itemi: z.array(Item), reguli: z.array(z.string()),
});
export const Sectiune = z.discriminatedUnion('tip', [SectiuneLista, SectiuneRunde]);
export type Sectiune = z.infer<typeof Sectiune>;
export type SectiuneLista = z.infer<typeof SectiuneLista>;
export type SectiuneRunde = z.infer<typeof SectiuneRunde>;

export const Aparat = z.object({ id: z.string(), nume: z.string(), min: z.number().nullable(), max: z.number().nullable() });
export type Aparat = z.infer<typeof Aparat>;

const Periodic = z.object({ id: z.string(), zona: z.string(), text: z.string(), produs: z.string() });
export type Periodic = z.infer<typeof Periodic>;

const Camp = z.tuple([z.string(), z.string(), z.string()]);   // [label, unit, key]
const Tabel = z.object({ coloane: z.array(z.string()), randuri: z.number(), motive: z.array(z.string()).optional() });
export const Raport = z.object({
  campuri_casa: z.array(Camp), campuri_card: z.array(Camp), campuri_numerar: z.array(Camp),
  bancnote: z.array(z.string()), pierderi: Tabel, de_comandat: Tabel, petreceri: Tabel,
  copii_loc_joaca: z.string(), probleme: z.object({ indiciu: z.string() }), verificari: z.array(z.string()), fond_casa: z.number().optional(),
});
export type Raport = z.infer<typeof Raport>;

export const CampFormular = z.object({ id: z.string(), label: z.string(), tip: z.enum(['text', 'textarea', 'ora', 'numar', 'bifa']) });
export type CampFormular = z.infer<typeof CampFormular>;
export const Formular = z.object({
  titlu: z.string(), emoji: z.string(), tipuri: z.array(z.string()).optional(), campuri: z.array(CampFormular), nota: z.string(),
});
export type Formular = z.infer<typeof Formular>;

export const Reteta = z.object({
  id: z.string(), nume: z.string(), cat: z.string(), sub: z.string(),
  ingrediente: z.array(z.object({ n: z.string(), q: z.string() })), pasi: z.array(z.string()),
  pahar: z.string(), alergeni: z.array(z.string()), nota: z.string(),
});
export type Reteta = z.infer<typeof Reteta>;
export const Categorie = z.object({ id: z.string(), nume: z.string(), emoji: z.string(), reguli: z.array(z.string()) });
export type Categorie = z.infer<typeof Categorie>;
export const Tinta = z.object({ id: z.string(), nume: z.string(), unit: z.string(), min: z.number(), max: z.number(), text: z.string() });
export type Tinta = z.infer<typeof Tinta>;
export const Espressor = z.object({
  tinte: z.array(Tinta),
  aparat: z.array(z.tuple([z.string(), z.string()])),
  reguli_aparat: z.array(z.string()),
  reglaj: z.array(z.string()),
  curatare: z.array(z.object({ cand: z.string(), pasi: z.array(z.string()) })),
  probleme: z.array(z.tuple([z.string(), z.string()])),
});
export type Espressor = z.infer<typeof Espressor>;

export const Continut = z.object({
  versiune: z.string(),
  zilnic: z.array(Sectiune),
  temperaturi: z.array(Aparat),
  saptamanal: z.array(Periodic),
  lunar: z.array(Periodic),
  raport: Raport,
  formulare: z.record(Formular),
  manual: z.array(z.object({ id: z.string(), capitol: z.string(), titlu: z.string(), html: z.string() })),
  categorii: z.array(Categorie),
  retete: z.array(Reteta),
  espressor: Espressor,
});
export type Continut = z.infer<typeof Continut>;

export const Inregistrata = z.object({
  id: z.string(), tip: z.string(), titlu: z.string(), avatar: z.string(), ora: z.string(), alerta: z.string().optional().default(''),
});
export type Inregistrata = z.infer<typeof Inregistrata>;
const Facut = z.record(z.object({ avatar: z.string(), data: z.string() }));
export const Stare = z.object({
  data: z.string(), saptamana: z.string(), zi: z.array(Inregistrata), saptamanal: Facut, lunar: Facut,
});
export type Stare = z.infer<typeof Stare>;

export type TipInregistrare = 'zilnic' | 'runde' | 'temperaturi' | 'saptamanal' | 'lunar' | 'raport' | 'incident' | 'receptie' | 'reglaj' | 'tura';
export type Inregistrare = {
  id: string;
  tip: TipInregistrare;
  titlu: string;
  continut: Record<string, unknown>;
  poze?: { b64: string }[];
  trimis_la?: string;
};

const SarcinaScor = z.object({ id: z.string(), nume: z.string(), max: z.number(), puncte: z.number(), stare: z.string(), ora: z.string(), pana: z.string() });
export type SarcinaScor = z.infer<typeof SarcinaScor>;
const Luna = z.object({ luna: z.string(), ture: z.number(), procent: z.number(), puncte: z.number(), max: z.number(),
  bonus: z.object({ nivel: z.string(), suma: z.number().nullable() }) });
export const Scor = z.object({
  azi: z.object({ data: z.string(), tura: z.string(), sarcini: z.array(SarcinaScor), max: z.number(), puncte: z.number(), complet: z.boolean() }).nullable(),
  luna: Luna, serie: z.number(), serieMax: z.number(), curatenie: z.number(),
  insigne: z.array(z.object({ id: z.string(), emoji: z.string(), nume: z.string(), are: z.boolean() })),
  praguri: z.object({ intreg: z.number(), jumatate: z.number(), minTure: z.number(), suma: z.number().nullable() }),
  ultimele: z.array(z.object({ data: z.string(), tura: z.string(), procent: z.number() })),
});
export type Scor = z.infer<typeof Scor>;

// ------------------------------------------------------------------ shift schedule
export const Slot = z.object({
  id: z.string(), tura: z.enum(['D', 'S', 'X', 'T']), start: z.string(), sfarsit: z.string(), avatar: z.string(),
  schimbat: z.boolean(), extra: z.boolean().optional().default(false),
});
export type Slot = z.infer<typeof Slot>;
export const Saptamana = z.object({
  luni: z.string(), eticheta: z.string(), rotatie: z.number(),
  zile: z.array(z.object({ data: z.string(), eticheta: z.string(), sloturi: z.array(Slot) })),
  ore: z.record(z.number()), oreExtra: z.record(z.number()).optional().default({}),
});
export type Saptamana = z.infer<typeof Saptamana>;
export const Program = z.object({
  azi: z.string(), ora: z.string(), saptamani: z.array(Saptamana),
  reguli: z.object({ oreMinim: z.number(), maxOre: z.number(), admin: z.string().optional(), deschidere: z.string().optional() }),
});
export type Program = z.infer<typeof Program>;
export const Cerere = z.object({
  id: z.string(), creat_la: z.string(), de: z.string(), catre: z.string(), slot: z.string(), slot2: z.string(),
  stare: z.string(), raspuns_la: z.string(), nota: z.string(), text1: z.string(), text2: z.string(),
});
export type Cerere = z.infer<typeof Cerere>;
