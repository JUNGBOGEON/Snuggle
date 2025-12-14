import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/common/Providers";

export const metadata: Metadata = {
  title: "Snuggle",
  description: "Snuggle - Your cozy community",
};

const themeScript = `
  (function() {
    var theme = localStorage.getItem('theme') || 'dark';
    var d = document.documentElement;
    if (theme === 'dark') {
      d.classList.add('dark');
    } else {
      d.classList.remove('dark');
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased bg-white dark:bg-black" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
