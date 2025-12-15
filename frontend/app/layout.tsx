import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/common/Providers";
import Header from "@/components/layout/Header";
import VisitorIdProvider from "@/components/common/VisitorIdProvider";

export const metadata: Metadata = {
  title: "Snuggle",
  description: "Snuggle - Your cozy community",
};

const themeScript = `
  (function() {
    const theme = localStorage.getItem('theme') || 'dark';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          <VisitorIdProvider>
            <Header />
            {children}
          </VisitorIdProvider>
        </Providers>
      </body>
    </html>
  );
}
