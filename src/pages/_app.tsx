import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import '../utils/chartSetup';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
