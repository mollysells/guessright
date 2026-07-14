import index from "@/data/index.json";

export const INDEX = index;

// Course accent colors (GuessRight palette: teal-led + a few complements).
export const PALETTE = [
  "#10b9a6", "#e0533d", "#2a9df4", "#f5a623", "#8b5cf6", "#16a34a",
  "#ec4899", "#0ea5e9", "#f97316", "#14b8a6",
];

export function colorFor(i) {
  return PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length];
}

export function initials(name) {
  const m = name.replace(/^AP\s+/, "");
  const parts = m.split(/[\s:]+/).filter(Boolean);
  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
}

export function courseBySlug(slug) {
  return INDEX.courses.find((c) => c.slug === slug);
}

export function courseIndex(slug) {
  return INDEX.courses.findIndex((c) => c.slug === slug);
}
