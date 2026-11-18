import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BalanceMath Tutor | Class 8 Linear Equations (24B1292)",
  description:
    "Low-bandwidth adaptive tutor for Class 8 linear equations in one variable — ET617 End-Sem (Roll No: 24B1292).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
