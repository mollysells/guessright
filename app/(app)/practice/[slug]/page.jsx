import { Suspense } from "react";
import PracticeSession from "@/components/PracticeSession";
import { INDEX } from "@/lib/data";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return INDEX.courses.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }) {
  const c = INDEX.courses.find((x) => x.slug === params.slug);
  return { title: c ? `Practice · ${c.name} — GuessRight` : "GuessRight" };
}

function Loading() {
  return (
    <div className="course-loading">
      <div>
        <div className="spinner" />
        <p>Loading questions…</p>
      </div>
    </div>
  );
}

export default function Page({ params }) {
  const c = INDEX.courses.find((x) => x.slug === params.slug);
  if (!c) notFound();
  return (
    <Suspense fallback={<Loading />}>
      <PracticeSession slug={params.slug} />
    </Suspense>
  );
}
