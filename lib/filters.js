// Facet filter model shared by the Practice Builder (live counts) and the
// practice session (actual question selection). A filter is six multi-select
// arrays; an empty array means "no constraint on this facet". All facets AND
// together. The same `match` runs over the light facet index and the heavy
// question records — both carry u / tg / t / lb / im / no.

export const KEYS = ["u", "tg", "t", "lb", "im", "no"];
const NUM_KEYS = new Set(["lb", "im", "no"]);

export const LENGTH_BANDS = [
  { v: 0, label: "Short" },
  { v: 1, label: "Medium" },
  { v: 2, label: "Long" },
];
export const TYPES = [
  { v: "MCQ", label: "Multiple choice" },
  { v: "FRQ", label: "Free response" },
];
export const IMAGE = [
  { v: 1, label: "With diagram" },
  { v: 0, label: "No diagram" },
];

export function emptyFilter() {
  return { u: [], tg: [], t: [], lb: [], im: [], no: [] };
}

export function isEmpty(f) {
  return KEYS.every((k) => !f[k] || f[k].length === 0);
}

export function toggle(arr, v) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

// URLSearchParams -> filter. Accepts the builder's own keys and, for backward
// compatibility, the tree's legacy `unit=` / `cat=` links.
export function decode(sp) {
  const f = emptyFilter();
  for (const k of KEYS) {
    const raw = sp.get(k);
    if (raw) {
      f[k] = raw
        .split(",")
        .filter(Boolean)
        .map((v) => (NUM_KEYS.has(k) ? Number(v) : v));
    }
  }
  const unit = sp.get("unit");
  if (unit && f.u.length === 0) f.u = [unit];
  const cat = sp.get("cat");
  if (cat && f.tg.length === 0) f.tg = [cat];
  return f;
}

export function encode(f) {
  const p = new URLSearchParams();
  for (const k of KEYS) if (f[k] && f[k].length) p.set(k, f[k].join(","));
  return p.toString();
}

export function match(q, f) {
  return (
    (!f.u.length || f.u.includes(q.u)) &&
    (!f.tg.length || (q.tg && q.tg.some((x) => f.tg.includes(x)))) &&
    (!f.t.length || f.t.includes(q.t)) &&
    (!f.lb.length || f.lb.includes(q.lb)) &&
    (!f.im.length || f.im.includes(q.im)) &&
    (!f.no.length || f.no.includes(q.no))
  );
}

export function count(rows, f) {
  let n = 0;
  for (let i = 0; i < rows.length; i++) if (match(rows[i], f)) n++;
  return n;
}
