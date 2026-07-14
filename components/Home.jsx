"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { INDEX, colorFor, initials } from "@/lib/data";

function Watermark() {
  return (
    <svg className="wm" aria-hidden="true">
      <defs>
        <pattern
          id="wm"
          width="340"
          height="128"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-9)"
        >
          <text
            x="0"
            y="64"
            fontFamily="var(--font-disp), sans-serif"
            fontWeight="800"
            fontSize="52"
            fill="#101013"
          >
            GuessRight
          </text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wm)" />
    </svg>
  );
}

export default function Home() {
  const q = (useSearchParams().get("q") || "").toLowerCase();
  const courses = INDEX.courses;
  const totalQ = courses.reduce((a, c) => a + c.count, 0);
  const totalU = courses.reduce((a, c) => a + c.units.length, 0);
  const list = courses.filter((c) => !q || c.name.toLowerCase().includes(q));

  return (
    <>
      <section className="hero">
        <Watermark />
        <h1>Master every AP exam.</h1>
        <p>
          {totalQ.toLocaleString()} real AP-style questions across {courses.length}{" "}
          courses. Filter by unit and topic, work through them at your pace, and
          track what you’ve covered.
        </p>
        <div className="hero-stats">
          <div>
            <b>{totalQ.toLocaleString()}</b>
            <span>Questions</span>
          </div>
          <div>
            <b>{courses.length}</b>
            <span>AP Courses</span>
          </div>
          <div>
            <b>{totalU}</b>
            <span>Units</span>
          </div>
        </div>
      </section>

      <div className="wrap pagepad" style={{ paddingTop: 20 }}>
        <div className="sec-head">
          <h2>{q ? "Search results" : "Choose a course"}</h2>
          <span className="count">
            {list.length} course{list.length === 1 ? "" : "s"}
          </span>
        </div>

        {list.length ? (
          <div className="grid">
            {list.map((c) => {
              const i = courses.indexOf(c);
              return (
                <Link className="course-card" href={`/course/${c.slug}`} key={c.slug}>
                  <span className="swatch" style={{ background: colorFor(i) }}>
                    {initials(c.name)}
                  </span>
                  <h3>{c.name}</h3>
                  <div className="meta">
                    <span className="pill teal">
                      {c.count.toLocaleString()} questions
                    </span>
                    <span className="pill">{c.units.length} units</span>
                    {c.frq ? <span className="pill purple">{c.frq} FRQ</span> : null}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty">
            <p>No courses match “{q}”.</p>
          </div>
        )}
      </div>
    </>
  );
}
