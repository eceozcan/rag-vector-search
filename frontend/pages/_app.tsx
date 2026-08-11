import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { Space_Grotesk, Inter } from 'next/font/google';

// Display face: characterful, techy-yet-playful — fits a playable-ads studio.
const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

// Body face: highly readable for answers, citations, and UI text.
const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${display.variable} ${body.variable}`}>
      <Component {...pageProps} />
    </div>
  );
}