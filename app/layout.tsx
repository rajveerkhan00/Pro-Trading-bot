import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PerfectBot - 58-Strategy Trading Bot',
  description: 'Advanced Binance signals with 58 strategies',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-900">
          <header className="py-6 border-b border-gray-700">
            <div className="container">
              <h1 className="text-3xl font-bold">PerfectBot</h1>
              <p className="text-gray-400">800+ coins • 58 strategies • Real-time signals</p>
            </div>
          </header>
          <main>{children}</main>
          <footer className="py-6 border-t border-gray-700 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} PerfectBot
          </footer>
        </div>
      </body>
    </html>
  );
}