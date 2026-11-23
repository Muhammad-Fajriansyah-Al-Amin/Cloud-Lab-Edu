import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloudLab Edu — Cloud-Native Laboratory Practicum Management System",
  description: "Platform manajemen kelas praktikum, pengumpulan tugas, dan penilaian laboratorium komputer berbasis cloud.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#F8FAFC] text-[#0F172A]">{children}</body>
    </html>
  );
}
