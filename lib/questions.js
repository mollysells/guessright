// Client-side loader + cache for per-unit question files.
//
// Each unit's questions live in /public/data/<slug>--<unitId>.json. We cache the
// in-flight Promise per file so (a) revisiting a unit is instant and (b) hovering
// a practice link can WARM the cache before the click — by the time the practice
// route mounts, the data is usually already resolved, so there's no spinner.

const cache = new Map(); // url -> Promise<json>

function loadJson(url) {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("load");
        return r.json();
      })
      .catch((err) => {
        cache.delete(url); // let a later attempt retry instead of caching the failure
        throw err;
      });
    cache.set(url, p);
  }
  return p;
}

export function unitUrl(slug, id) {
  return `/data/${slug}--${id}.json`;
}

export function loadUnit(slug, id) {
  return loadJson(unitUrl(slug, id));
}

// Light per-course facet index (no question text) — drives the builder's live
// match counts.
export function loadFacets(slug) {
  return loadJson(`/data/${slug}--facets.json`);
}

export function loadUnits(slug, ids) {
  return Promise.all(ids.map((id) => loadUnit(slug, id))).then((parts) => parts.flat());
}

// Fire-and-forget warm-up used on hover/focus of practice links.
export function prefetchUnits(slug, ids) {
  ids.forEach((id) => {
    loadUnit(slug, id).catch(() => {}); // swallow — this is opportunistic
  });
}
