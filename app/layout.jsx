import { Hanken_Grotesk, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});
const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-disp",
  display: "swap",
});

export const metadata = {
  title: "GuessRight — AP Question Bank",
  description:
    "31,592 real AP-style questions across 21 courses, automatically ordered the way you actually learn: an easy-to-hard ramp with topics interleaved for retention.",
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${hanken.variable} ${schibsted.variable}`}>
      <body>{children}</body>
    </html>
  );
}
