/* Learning-ordered question sequencing.
 *
 * Grounded in two robust findings from the learning-science literature:
 *   • Difficulty ramp (scaffolding): within a single topic, go easy → hard.
 *   • Interleaving (Rohrer & Taylor; discriminative-contrast): across topics,
 *     mix items rather than blocking — better retention & transfer.
 *
 * Hybrid policy that falls out of scope:
 *   • Single topic selected  → pure easy→hard ramp (BLOCKED, good for first learning).
 *   • Unit / whole course    → proportional INTERLEAVE of each topic's ramp.
 *
 * The interleave uses fractional ranking (a Van der Corput–style even spread):
 * question i of a topic with n items gets position (i+0.5)/n in [0,1]; sorting all
 * questions by that position spreads every topic evenly across the whole sequence
 * while preserving each topic's easy→hard progression, so global difficulty also
 * rises. A light anti-clumping pass avoids back-to-back same-topic items.
 *
 * `d` is an honest reading-load-based prior (0..1), NOT a measured difficulty.
 */
export function orderQuestions(questions) {
  if (!questions || questions.length <= 1) return questions ? [...questions] : [];

  const groups = new Map();
  for (const q of questions) {
    const key = (q.tg && q.tg[0]) || "_";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(q);
  }

  // Single topic → blocked easy→hard ramp.
  if (groups.size <= 1) {
    return [...questions].sort((a, b) => a.d - b.d);
  }

  // Each topic ramps easy→hard; assign an even fractional position.
  const items = [];
  for (const [key, arr] of groups) {
    arr.sort((a, b) => a.d - b.d);
    const n = arr.length;
    arr.forEach((q, i) => items.push({ q, key, d: q.d, frac: (i + 0.5) / n }));
  }

  // Global order: fractional rank first (even topic spread + rising difficulty),
  // tie-break by difficulty then topic for determinism.
  items.sort(
    (a, b) => a.frac - b.frac || a.d - b.d || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)
  );

  // Anti-clumping: if an item shares a topic with its predecessor, swap it with a
  // nearby different-topic item (small window) to keep the interleave clean.
  for (let i = 1; i < items.length; i++) {
    if (items[i].key === items[i - 1].key) {
      const end = Math.min(items.length, i + 4);
      for (let j = i + 1; j < end; j++) {
        if (items[j].key !== items[i - 1].key) {
          const tmp = items[i];
          items[i] = items[j];
          items[j] = tmp;
          break;
        }
      }
    }
  }

  return items.map((x) => x.q);
}

/** Human label for the ordering applied to a scope. */
export function orderingLabel(questions) {
  const topics = new Set();
  for (const q of questions) topics.add((q.tg && q.tg[0]) || "_");
  return topics.size <= 1 ? "Easy → hard" : "Interleaved · easy → hard";
}
