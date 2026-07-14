"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function TopBar() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const t = useRef(null);

  function onChange(e) {
    const v = e.target.value;
    setValue(v);
    clearTimeout(t.current);
    t.current = setTimeout(() => {
      router.push(v ? `/app?q=${encodeURIComponent(v)}` : "/app");
    }, 140);
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" href="/app">
          <span className="brand-mark" aria-hidden="true">
            <i />
          </span>
          <span className="brand-name">GuessRight</span>
          <span className="brand-tag">AP</span>
        </Link>
        <div className="topbar-right">
          <input
            className="search"
            type="search"
            placeholder="Search courses…"
            autoComplete="off"
            value={value}
            onChange={onChange}
          />
        </div>
      </div>
    </header>
  );
}
