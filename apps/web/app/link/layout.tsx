import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Link Wallet',
  description: 'Link your Ethereum wallet to your Reddit account on r/CryptoCurrency to receive MOON tokens.',
};

export default function LinkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
