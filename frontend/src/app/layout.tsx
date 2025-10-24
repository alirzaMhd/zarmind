import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google"; // Import the Persian font
import "../styles/globals.css";

// Configure the font
const vazirmatn = Vazirmatn({ subsets: ["arabic"] }); // 'arabic' subset includes Persian characters

export const metadata: Metadata = {
  title: "سیستم جامع زرمند",
  description: "مدیریت یکپارچه حسابداری و انبارداری فروشگاه طلا و جواهر",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Set language to Farsi and direction to Right-to-Left
    <html lang="fa" dir="rtl">
      <body className={vazirmatn.className}>{children}</body>
    </html>
  );
}