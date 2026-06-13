import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MatchMarket | The Premium Prediction Platform',
  description: 'Predict FIFA match outcomes, earn tokens, and compete on the global leaderboard.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen flex flex-col">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
