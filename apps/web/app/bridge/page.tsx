import { Title } from "@tremor/react";
import Background from '../../components/Background';

export default function BridgePage() {
  return (
    <Background>
      <main className="pt-16 min-h-screen flex flex-col">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-orange-100 dark:border-slate-800 px-4 py-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-center justify-between">
              <div>
                <Title className="text-slate-900 dark:text-white text-2xl font-bold">
                  MOON Bridge
                </Title>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Bridge MOONs between Arbitrum One and Arbitrum Nova
                </p>
              </div>
              <a
                href="https://www.moonbridge.cc/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                Open in new tab
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="flex-1 relative">
          <iframe
            src="https://www.moonbridge.cc/"
            className="absolute inset-0 w-full h-full border-0"
            allow="clipboard-write; web-share"
            title="MoonBridge - Cross-chain bridge for MOON tokens"
          />
        </div>

        <div className="bg-blue-50/90 dark:bg-blue-950/50 backdrop-blur-sm border-t border-blue-200 dark:border-blue-800 px-4 py-3">
          <div className="container mx-auto max-w-6xl">
            <p className="text-xs text-blue-900 dark:text-blue-200 text-center">
              <span className="font-semibold">Note:</span> MoonBridge is operated by CCMOON DAO. A 1% fee applies on fulfilled amounts and refunds. Make sure you're connected to the correct network before bridging.
            </p>
          </div>
        </div>
      </main>
    </Background>
  );
}
