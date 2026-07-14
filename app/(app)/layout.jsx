import TopBar from "@/components/TopBar";

export default function AppLayout({ children }) {
  return (
    <>
      <TopBar />
      <main id="app">{children}</main>
    </>
  );
}
