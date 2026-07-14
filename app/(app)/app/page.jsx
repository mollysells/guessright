import { Suspense } from "react";
import Home from "@/components/Home";

export const metadata = { title: "Courses — GuessRight" };

export default function Page() {
  return (
    <Suspense fallback={<div className="wrap pagepad" />}>
      <Home />
    </Suspense>
  );
}
