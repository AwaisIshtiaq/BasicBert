import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Noto_Nastaliq_Urdu } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400"],
  variable: "--font-urdu",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BasicBERT — A From-Scratch BERT Implementation",
  description:
    "BasicBERT is a BERT-style Transformer encoder built from scratch in PyTorch, with Masked Language Modeling, sentiment classification, and English + Urdu support, served by a FastAPI backend.",
  keywords: [
    "BERT",
    "Transformer",
    "PyTorch",
    "from scratch",
    "MLM",
    "masked language modeling",
    "sentiment analysis",
    "Urdu NLP",
    "FastAPI",
    "Next.js",
  ],
  authors: [{ name: "BasicBERT" }],
  openGraph: {
    title: "BasicBERT — A From-Scratch BERT Implementation",
    description:
      "Encoder-only Transformer built from scratch with PyTorch. MLM playground, sentiment classification, English + Urdu.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BasicBERT — A From-Scratch BERT Implementation",
    description:
      "Encoder-only Transformer built from scratch with PyTorch. MLM playground, sentiment classification, English + Urdu.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0C" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${nastaliq.variable}`}
    >
      <body className="min-h-screen overflow-x-hidden font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
