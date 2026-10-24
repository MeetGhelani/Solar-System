import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solar System",
  description: "Interactive 3D Solar System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ width: "100%", height: "100%" }}>
      <body style={{ width: "100%", height: "100%", overflow: "hidden", background: "#000" }}>
        {children}
      </body>
    </html>
  );
}
