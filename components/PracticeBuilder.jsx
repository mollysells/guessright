"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadFacets, prefetchUnits } from "@/lib/questions";
import {
  emptyFilter, isEmpty, toggle, encode, count,
  LENGTH_BANDS, TYPES, IMAGE,
} from "@/lib/filters";

function Chip({ on, onClick, children }) {
  return (
    <button type="button" className={`pb-chip${on ? " on" : ""}`} onClick={onClick} aria-pressed={on}>
      {children}
    </button>
  );
}

function Group({ label, hint, children }) {
  return (
    <div className="pb-group">
      <div className="pb-group-label">
        {label}
        {hint ? <span className="pb-hint">{hint}</span> : null}
      </div>
      <div className="pb-chips">{children}</div>
    </div>
  );
}

export default function PracticeBuilder({ course }) {
  const slug = course.slug;
  const F = course.facets || {};
  const [rows, setRows] = useState(null); // light facet index
  const [f, setF] = useState(emptyFilter);

  useEffect(() => {
    let alive = true;
    setRows(null);
    loadFacets(slug)
      .then((r) => alive && setRows(r))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [slug]);

  // Topics are scoped to the selected units so we never dump 100+ chips at once.
  const topics = useMemo(() => {
    if (!F.topic) return [];
    const scope = f.u.length
      ? course.units.filter((u) => f.u.includes(u.id))
      : course.units;
    const m = new Map();
    for (const u of scope) for (const ct of u.cats) m.set(ct.id, (m.get(ct.id) || 0) + ct.count);
    return [...m.entries()].sort((a, b) =>
      a[0].localeCompare(b[0], undefined, { numeric: true })
    );
  }, [F.topic, f.u, course.units]);

  const liveN = rows ? count(rows, f) : null;
  const shownN = liveN != null ? liveN : isEmpty(f) ? course.count : null;

  const setKey = (k, v) => setF((p) => ({ ...p, [k]: toggle(p[k], v) }));

  // Toggling a unit re-scopes topics; drop any selected topic no longer in scope.
  const toggleUnit = (id) =>
    setF((p) => {
      const u = toggle(p.u, id);
      const scope = u.length ? course.units.filter((x) => u.includes(x.id)) : course.units;
      const allowed = new Set();
      scope.forEach((x) => x.cats.forEach((c) => allowed.add(c.id)));
      return { ...p, u, tg: p.tg.filter((t) => allowed.has(t)) };
    });

  const reset = () => setF(emptyFilter());

  const warm = () =>
    prefetchUnits(slug, f.u.length ? f.u : course.units.map((u) => u.id));

  const href = `/practice/${slug}${encode(f) ? "?" + encode(f) : ""}`;
  const canGo = shownN == null || shownN > 0;

  return (
    <div className="pb">
      <div className="pb-head">
        <h2>Build a practice set</h2>
        <p>Combine any filters — questions still come out in the right order (easy → hard, interleaved).</p>
      </div>

      <Group label="Units">
        {course.units.map((u) => (
          <Chip key={u.id} on={f.u.includes(u.id)} onClick={() => toggleUnit(u.id)}>
            {u.name} <span className="pb-n">{u.count}</span>
          </Chip>
        ))}
      </Group>

      {F.topic && topics.length ? (
        <Group label="Topics" hint={f.u.length ? "in selected units" : "pick a unit to narrow"}>
          <div className="pb-topics">
            {topics.map(([id, n]) => (
              <Chip key={id} on={f.tg.includes(id)} onClick={() => setKey("tg", id)}>
                {id} <span className="pb-n">{n}</span>
              </Chip>
            ))}
          </div>
        </Group>
      ) : null}

      <div className="pb-row">
        {F.type ? (
          <Group label="Type">
            {TYPES.map((o) => (
              <Chip key={o.v} on={f.t.includes(o.v)} onClick={() => setKey("t", o.v)}>
                {o.label}
              </Chip>
            ))}
          </Group>
        ) : null}

        {F.length && F.length.length ? (
          <Group label="Length">
            {LENGTH_BANDS.filter((o) => F.length.includes(o.v)).map((o) => (
              <Chip key={o.v} on={f.lb.includes(o.v)} onClick={() => setKey("lb", o.v)}>
                {o.label}
              </Chip>
            ))}
          </Group>
        ) : null}

        {F.image ? (
          <Group label="Diagram">
            {IMAGE.map((o) => (
              <Chip key={o.v} on={f.im.includes(o.v)} onClick={() => setKey("im", o.v)}>
                {o.label}
              </Chip>
            ))}
          </Group>
        ) : null}

        {F.options && F.options.length ? (
          <Group label="Answer choices">
            {F.options.map((n) => (
              <Chip key={n} on={f.no.includes(n)} onClick={() => setKey("no", n)}>
                {n} options
              </Chip>
            ))}
          </Group>
        ) : null}
      </div>

      <div className="pb-foot">
        {!isEmpty(f) ? (
          <button type="button" className="pb-reset" onClick={reset}>
            Reset filters
          </button>
        ) : (
          <span className="pb-allnote">No filters — all questions</span>
        )}
        {canGo ? (
          <Link className="btn primary pb-go" href={href} onMouseEnter={warm} onFocus={warm}>
            Practice {shownN == null ? "…" : shownN.toLocaleString()} question{shownN === 1 ? "" : "s"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        ) : (
          <button type="button" className="btn primary pb-go" disabled>
            No questions match
          </button>
        )}
      </div>
    </div>
  );
}
