"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { courseBySlug, courseIndex, colorFor, initials } from "@/lib/data";
import { prefetchUnits } from "@/lib/questions";
import PracticeBuilder from "@/components/PracticeBuilder";

export default function CourseView({ slug }) {
  const c = courseBySlug(slug);
  const i = courseIndex(slug);
  // first unit expanded by default
  const [open, setOpen] = useState(() => ({ 0: true }));

  // Warm the most likely first click: the opened unit's question file.
  useEffect(() => {
    if (c?.units?.length) prefetchUnits(slug, [c.units[0].id]);
  }, [slug, c]);

  if (!c) return null;
  const toggle = (idx) => setOpen((o) => ({ ...o, [idx]: !o[idx] }));
  const warm = (id) => prefetchUnits(slug, [id]);

  return (
    <div className="wrap pagepad">
      <div className="crumbs">
        <Link href="/app">Courses</Link>
        <span className="sep">/</span>
        <span>{c.name}</span>
      </div>

      <div className="course-head">
        <span className="swatch" style={{ background: colorFor(i) }}>
          {initials(c.name)}
        </span>
        <div>
          <h1>{c.name}</h1>
          <div className="sub">
            {c.count.toLocaleString()} questions · {c.mcq.toLocaleString()} MCQ ·{" "}
            {c.frq} FRQ · {c.units.length} units
          </div>
        </div>
      </div>

      <div className="notice">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v5M12 16.5v.5" />
        </svg>
        <div>
          This is a <b>self-study viewer</b> — answer keys and explanations aren’t
          included in this question set. Pick your answer, cross out choices, and
          mark questions for review; your selections are saved on this device.
        </div>
      </div>

      <PracticeBuilder course={c} />

      <div className="sec-head">
        <h2>Or browse by unit</h2>
        <span className="count">Tap a unit or topic to practice it</span>
      </div>

      <div className="units">
        {c.units.map((u, ui) => (
          <div className={`unit${open[ui] ? " open" : ""}`} key={u.id}>
            <div
              className="unit-head"
              onClick={() => toggle(ui)}
              onMouseEnter={() => warm(u.id)}
            >
              <span className="unit-idx">{ui + 1}</span>
              <h3>{u.name}</h3>
              <span className="u-count">{u.count} Q</span>
              <Link
                className="unit-practice"
                href={`/practice/${c.slug}?unit=${encodeURIComponent(u.id)}`}
                onClick={(e) => e.stopPropagation()}
                onFocus={() => warm(u.id)}
              >
                Practice unit →
              </Link>
              <svg
                className="chev"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
            {u.cats.length ? (
              <div className="cats">
                {u.cats.map((ct) => (
                  <Link
                    className="cat"
                    key={ct.id}
                    href={`/practice/${c.slug}?unit=${encodeURIComponent(
                      u.id
                    )}&cat=${encodeURIComponent(ct.id)}`}
                  >
                    {ct.id}
                    <span className="n">{ct.count}</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
