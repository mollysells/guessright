import CourseView from "@/components/CourseView";
import { INDEX } from "@/lib/data";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return INDEX.courses.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }) {
  const c = INDEX.courses.find((x) => x.slug === params.slug);
  return { title: c ? `${c.name} — GuessRight` : "GuessRight" };
}

export default function Page({ params }) {
  const c = INDEX.courses.find((x) => x.slug === params.slug);
  if (!c) notFound();
  return <CourseView slug={params.slug} />;
}
