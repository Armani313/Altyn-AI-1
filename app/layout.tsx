import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Nurai AI Studio — ИИ-фотографии украшений",
    template: "%s | Nurai AI Studio",
  },
  description:
    "Генерируйте профессиональные лайфстайл-фотографии украшений с помощью ИИ. Для ювелирных магазинов Казахстана.",
  keywords: ["ювелирные украшения", "ИИ фото", "генерация изображений", "фотосъёмка"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${playfair.variable} ${inter.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
