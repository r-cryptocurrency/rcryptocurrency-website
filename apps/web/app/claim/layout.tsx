import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Claim MOONs',
  description: 'Claim your earned MOON tokens from r/CryptoCurrency. Connect your wallet to claim pending rewards.',
};

export default function ClaimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
