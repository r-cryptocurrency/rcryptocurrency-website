import { Title, Text, Card } from "@tremor/react";
import Background from '../../components/Background';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'rCryptoCurrency Foundation (CCMOON DAO)',
  description: 'The official non-profit organization supporting r/CryptoCurrency\'s 10M+ members through education, governance, and community initiatives.',
};

export default function FoundationPage() {
  return (
    <Background>
      <main className="p-10 pt-24 min-h-screen flex flex-col items-center">
        <div className="container mx-auto max-w-4xl">
          <Title className="text-slate-900 dark:text-white mb-2 text-4xl font-bold text-center">
            rCryptoCurrency Foundation (CCMOON DAO)
          </Title>
          <p className="text-center text-slate-600 dark:text-slate-400 mb-8 text-lg">
            Supporting the world's largest cryptocurrency community through education, governance, and innovation
          </p>

          <div className="space-y-6">
            {/* Mission Section */}
            <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-orange-100 dark:border-slate-800 p-8 rounded-xl shadow-xl">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-3xl">🎯</span>
                  Our Mission
                </h2>
                <Text className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  The rCryptoCurrency Foundation (CCMOON DAO) is dedicated to advancing cryptocurrency knowledge and fostering a vibrant, inclusive community within r/CryptoCurrency. We promote educational content, transparent governance, and sustainable community initiatives that align with Reddit's values and community guidelines.
                </Text>
              </div>
            </Card>

            {/* Core Values Section */}
            <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-orange-100 dark:border-slate-800 p-8 rounded-xl shadow-xl">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-3xl">⭐</span>
                  Core Values
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50/50 dark:bg-white/5 rounded-lg border border-orange-100/50 dark:border-white/10">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">Education First</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Advancing crypto literacy and informed decision-making across our community</p>
                  </div>
                  <div className="p-4 bg-orange-50/50 dark:bg-white/5 rounded-lg border border-orange-100/50 dark:border-white/10">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">Transparency</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Open governance and clear communication with all community members</p>
                  </div>
                  <div className="p-4 bg-orange-50/50 dark:bg-white/5 rounded-lg border border-orange-100/50 dark:border-white/10">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">Compliance</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Strict adherence to Reddit Terms of Service and applicable regulations</p>
                  </div>
                  <div className="p-4 bg-orange-50/50 dark:bg-white/5 rounded-lg border border-orange-100/50 dark:border-white/10">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">Community Focus</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Supporting initiatives that benefit the entire r/CryptoCurrency community</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Initiatives Section */}
            <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-orange-100 dark:border-slate-800 p-8 rounded-xl shadow-xl">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-3xl">🚀</span>
                  Our Initiatives
                </h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-rcc-orange font-bold mt-1">•</span>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">MOON Token Governance</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Democratic decision-making through the MOON token and community voting</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rcc-orange font-bold mt-1">•</span>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Community Analytics</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Providing transparent data and sentiment analysis to help community members make informed decisions</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rcc-orange font-bold mt-1">•</span>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Educational Resources</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Curated guides, research, and content to enhance community knowledge</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rcc-orange font-bold mt-1">•</span>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Strategic Partnerships</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Collaborating with organizations that share our values and commitment to the community</p>
                    </div>
                  </li>
                </ul>
              </div>
            </Card>

            {/* Governance Section */}
            <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-orange-100 dark:border-slate-800 p-8 rounded-xl shadow-xl">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-3xl">🏛️</span>
                  Governance & Constitution
                </h2>
                <Text className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                  Our governance structure is guided by the r/CryptoCurrency Community Constitution, which outlines principles, rules, and decision-making processes. Community members can participate in governance through voting and the democratic process.
                </Text>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/2025_Constitution"
                    className="inline-block px-6 py-3 bg-rcc-orange hover:bg-orange-600 text-white font-bold rounded-lg transition-colors shadow-md"
                  >
                    2025 Constitution
                  </Link>
                  <Link
                    href="/2024_Constitution"
                    className="inline-block px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors shadow-md"
                  >
                    2024 Constitution
                  </Link>
                  <a
                    href="https://snapshot.org/#/s:cryptomods.eth"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-md"
                  >
                    Vote on Snapshot
                  </a>
                </div>
              </div>
            </Card>

            {/* Contact Section */}
            <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-orange-100 dark:border-slate-800 p-8 rounded-xl shadow-xl">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-3xl">💬</span>
                  Get Involved
                </h2>
                <Text className="text-slate-700 dark:text-slate-300 mb-4">
                  Interested in learning more about the Foundation or exploring partnership opportunities? Connect with us on Telegram:
                </Text>
                <div className="flex flex-wrap justify-center gap-4">
                  <TelegramLink username="TwoCentTimmy" />
                  <TelegramLink username="jwinterm" />
                </div>
              </div>
            </Card>

            {/* Compliance Notice */}
            <Card className="bg-blue-50/50 dark:bg-blue-950/20 backdrop-blur-sm border border-blue-200 dark:border-blue-800/50 p-6 rounded-xl">
              <p className="text-sm text-blue-900 dark:text-blue-200 text-center">
                <span className="font-semibold">Compliance Notice:</span> The CC MOON DAO Foundation operates in full compliance with Reddit's Terms of Service and all applicable regulations. We are committed to supporting the r/CryptoCurrency community within all established guidelines.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </Background>
  );
}

function TelegramLink({ username }: { username: string }) {
  return (
    <a
      href={`https://t.me/${username}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 rounded-full transition-colors font-medium"
    >
      <i className="fab fa-telegram"></i>
      @{username}
    </a>
  );
}
