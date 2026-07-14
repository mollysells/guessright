"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { courseBySlug } from "@/lib/data";
import { loadUnits } from "@/lib/questions";
import { decode, match } from "@/lib/filters";
import { orderQuestions, orderingLabel } from "@/lib/ordering";

const BAND = ["Short", "Medium", "Long"];

// Human-readable summary of the active filter for the crumb / header.
function scopeLabelFor(course, f) {
  const parts = [];
  if (f.u.length) {
    const names = f.u.map((id) => course.units.find((u) => u.id === id)?.name || id);
    parts.push(names.length <= 2 ? names.join(" + ") : `${names.length} units`);
  }
  if (f.tg.length) parts.push(f.tg.length <= 2 ? `Topic ${f.tg.join(", ")}` : `${f.tg.length} topics`);
  if (f.t.length === 1) parts.push(f.t[0] === "FRQ" ? "Free response" : "Multiple choice");
  if (f.lb.length) parts.push(f.lb.map((b) => BAND[b]).join("/"));
  if (f.im.length === 1) parts.push(f.im[0] ? "With diagram" : "No diagram");
  if (f.no.length) parts.push(f.no.map((n) => `${n}-option`).join("/"));
  return parts.length ? parts.join(" · ") : "All questions";
}

/* Render question text: treat a short first line as a bold title. */
function QuestionText({ text }) {
  const t = String(text || "");
  const nl = t.indexOf("\n");
  if (nl > 0 && nl <= 90) {
    const title = t.slice(0, nl).trim();
    const rest = t.slice(nl + 1).trim();
    if (title && rest) {
      return (
        <div className="qtext">
          <span className="qtitle">{title}</span>
          {rest}
        </div>
      );
    }
  }
  return <div className="qtext">{t}</div>;
}

export default function PracticeSession({ slug }) {
  const course = courseBySlug(slug);
  const sp = useSearchParams();
  const qstr = sp.toString();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filter = useMemo(() => decode(sp), [qstr]);

  const [all, setAll] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setAll(null);
    setError(false);
    // Download only the unit files the filter can touch: the selected units, or
    // every unit of the course when no unit is chosen. loadUnits is cached, so a
    // hover-prefetched unit resolves instantly here.
    const unitIds = filter.u.length ? filter.u : (course?.units || []).map((u) => u.id);
    loadUnits(slug, unitIds)
      .then((flat) => {
        if (alive) setAll(flat);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, qstr]);

  const questions = useMemo(() => {
    if (!all) return null;
    const filtered = all.filter((q) => match(q, filter));
    return orderQuestions(filtered); // learning-ordered: ramp + interleave
  }, [all, filter]);

  const ordLabel = useMemo(
    () => (questions && questions.length ? orderingLabel(questions) : ""),
    [questions]
  );

  const scopeLabel = course ? scopeLabelFor(course, filter) : "";

  if (!course) return null;

  if (error) {
    return (
      <Shell course={course}>
        <div className="empty">
          <p>Could not load questions for {course.name}.</p>
        </div>
      </Shell>
    );
  }

  if (!questions) {
    return (
      <div className="course-loading">
        <div>
          <div className="spinner" />
          <p>Loading {course.name}…</p>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <Shell course={course}>
        <div className="empty">
          <p>No questions found for this selection.</p>
        </div>
      </Shell>
    );
  }

  return (
    <Session
      key={`${slug}|${qstr}`}
      course={course}
      questions={questions}
      scopeLabel={scopeLabel}
      ordLabel={ordLabel}
    />
  );
}

function Shell({ course, children }) {
  return (
    <div className="session">
      <div className="crumbs">
        <Link href="/app">Courses</Link>
        <span className="sep">/</span>
        <Link href={`/course/${course.slug}`}>{course.name}</Link>
      </div>
      {children}
    </div>
  );
}

function Session({ course, questions, scopeLabel, ordLabel }) {
  const storeKey = "guessright:" + course.id;
  const [prog, setProg] = useState({});
  const [i, setI] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const loaded = useRef(false);

  // Load saved progress + resume at first unanswered.
  useEffect(() => {
    let data = {};
    try {
      data = JSON.parse(localStorage.getItem(storeKey) || "{}");
    } catch (e) {}
    setProg(data);
    let start = 0;
    for (let k = 0; k < questions.length; k++) {
      const st = data[questions[k].id] || {};
      const answered =
        st.sel != null ||
        (questions[k].t === "FRQ" && st.note && st.note.trim());
      if (!answered) {
        start = k;
        break;
      }
    }
    setI(start);
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeKey, questions]);

  // Persist progress.
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(storeKey, JSON.stringify(prog));
    } catch (e) {}
  }, [prog, storeKey]);

  const q = questions[i];
  const st = prog[q.id] || {};

  const patch = useCallback(
    (qid, p) => setProg((prev) => ({ ...prev, [qid]: { ...prev[qid], ...p } })),
    []
  );

  const select = useCallback(
    (idx) => {
      const cur = (prog[q.id] || {}).sel;
      patch(q.id, { sel: cur === idx ? null : idx });
    },
    [prog, q, patch]
  );

  const crossOut = useCallback(
    (idx) => {
      const cur = prog[q.id] || {};
      const crossed = (cur.crossed || []).slice();
      const p = crossed.indexOf(idx);
      const next = { crossed };
      if (p >= 0) crossed.splice(p, 1);
      else {
        crossed.push(idx);
        if (cur.sel === idx) next.sel = null;
      }
      patch(q.id, next);
    },
    [prog, q, patch]
  );

  const toggleMark = useCallback(
    () => patch(q.id, { marked: !(prog[q.id] || {}).marked }),
    [prog, q, patch]
  );

  const move = useCallback(
    (d) => setI((v) => Math.min(questions.length - 1, Math.max(0, v + d))),
    [questions.length]
  );

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowLeft") move(-1);
      else if (/^[1-9]$/.test(e.key)) {
        const idx = +e.key - 1;
        if (q.t === "MCQ" && idx < q.o.length) select(idx);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [move, select, q]);

  const answered = useCallback(
    (qq) => {
      const s = prog[qq.id] || {};
      return s.sel != null || (qq.t === "FRQ" && s.note && s.note.trim());
    },
    [prog]
  );

  const doneCount = questions.reduce((a, qq) => a + (answered(qq) ? 1 : 0), 0);
  const isFRQ = q.t === "FRQ";
  const crossed = st.crossed || [];

  return (
    <>
      <div className="session">
        <div className="crumbs">
          <Link href="/app">Courses</Link>
          <span className="sep">/</span>
          <Link href={`/course/${course.slug}`}>{course.name}</Link>
          <span className="sep">/</span>
          <span>{scopeLabel}</span>
        </div>

        <div className="session-top">
          <div className="ctx">
            Question <b>{i + 1}</b> of {questions.length}
            {ordLabel ? <span className="ord-pill" title="Questions are ordered for learning">{ordLabel}</span> : null}
          </div>
          <button
            className={`iconbtn${st.marked ? " active" : ""}`}
            title="Mark for review"
            onClick={toggleMark}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
            </svg>
          </button>
        </div>

        <div className="progress">
          <i style={{ width: `${(doneCount / questions.length) * 100}%` }} />
        </div>

        <div className="qcard">
          <span className={`qbadge${isFRQ ? " frq" : ""}`}>
            {isFRQ ? "Free Response" : "Multiple Choice"}
            {(() => {
              const codes = (q.tg || []).filter((t) => /^\d+\.\d+$/.test(t));
              return codes.length ? ` · Topic ${codes.join(", ")}` : "";
            })()}
          </span>

          <QuestionText text={q.q} />

          {(q.img || []).map((im, k) => (
            <figure className="qfig" key={k}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.src} alt="" loading="lazy" />
              {im.alt ? <figcaption>{im.alt}</figcaption> : null}
            </figure>
          ))}

          {isFRQ ? (
            <div className="frq-note">
              This is a free-response question — draft your response below (saved on
              this device).
              <textarea
                placeholder="Type your response…"
                value={st.note || ""}
                onChange={(e) => patch(q.id, { note: e.target.value })}
              />
            </div>
          ) : (
            <ul className="options">
              {q.o.map((o, idx) => {
                const label = (q.l && q.l[idx]) || String.fromCharCode(65 + idx);
                const cls =
                  "opt" +
                  (st.sel === idx ? " selected" : "") +
                  (crossed.includes(idx) ? " crossed" : "");
                return (
                  <li className={cls} key={idx} onClick={() => select(idx)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      crossOut(idx);
                    }}
                  >
                    <span className="letter">{label}</span>
                    <span className="otext">{o}</span>
                    <button
                      className="cross"
                      title="Cross out"
                      onClick={(e) => {
                        e.stopPropagation();
                        crossOut(idx);
                      }}
                    >
                      strike
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className={`qnav${navOpen ? " open" : ""}`}>
        <h4>JUMP TO QUESTION</h4>
        <div className="qnav-grid">
          {questions.map((qq, n) => {
            const s = prog[qq.id] || {};
            const cls =
              (answered(qq) ? "answered " : "") +
              (s.marked ? "marked " : "") +
              (n === i ? "current" : "");
            return (
              <button
                key={qq.id}
                className={cls.trim()}
                onClick={() => {
                  setI(n);
                  setNavOpen(false);
                }}
              >
                {n + 1}
              </button>
            );
          })}
        </div>
        <div className="qnav-legend">
          <span>
            <i style={{ background: "var(--teal-l)", border: "1.5px solid var(--teal)" }} />{" "}
            Answered
          </span>
          <span>
            <i style={{ background: "var(--amber)" }} /> Marked
          </span>
          <span>
            <i style={{ background: "var(--teal)" }} /> Current
          </span>
        </div>
      </div>

      <div className="session-nav">
        <button className="nav-btn prev" disabled={i === 0} onClick={() => move(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 6l-6 6 6 6" />
          </svg>{" "}
          Previous
        </button>
        <div className="mid">
          <button className="qnav-toggle" onClick={() => setNavOpen((v) => !v)}>
            Question navigator
          </button>
        </div>
        <button
          className={`nav-btn next${i === questions.length - 1 ? "" : " primary"}`}
          disabled={i === questions.length - 1}
          onClick={() => move(1)}
        >
          Next{" "}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </>
  );
}
