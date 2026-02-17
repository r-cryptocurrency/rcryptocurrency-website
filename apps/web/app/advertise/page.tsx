import { Title, Text, Card } from "@tremor/react";
import Background from '../../components/Background';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Become a Partner',
  description: 'Partner with the world\'s largest cryptocurrency community. Collaborate with the CC MOON DAO Foundation on sponsorships, research, and community initiatives.',
};

export default function AdvertisePage() {
  return (
    <Background>
      <main className="p-10 pt-24 min-h-screen flex flex-col items-center">
        <div className="container mx-auto max-w-3xl">
          <Title className="text-slate-900 dark:text-white mb-2 text-4xl font-bold text-center">
            Become a Partner
          </Title>
          <p className="text-center text-slate-600 dark:text-slate-400 mb-8 text-lg">
            Collaborate with the world&apos;s largest crypto community through the CC MOON DAO Foundation
          </p>

          <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-orange-100 dark:border-slate-800 p-8 rounded-xl shadow-xl">
            <div className="space-y-8 text-center">

              {/* About the Community */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">About r/CryptoCurrency</h2>
                <Text className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                  r/CryptoCurrency is the world&apos;s largest cryptocurrency community with over 10 million members. Our community is built on principles of education, critical thinking, and community governance through the MOON token.
                </Text>
                <div className="grid grid-cols-2 gap-4 mb-4 text-slate-900 dark:text-white">
                  <div className="bg-orange-50/50 dark:bg-white/5 p-4 rounded-lg border border-orange-100/50 dark:border-white/10">
                    <p className="font-bold text-rcc-orange">10M+</p>
                    <p className="text-sm">Community Members</p>
                  </div>
                  <div className="bg-orange-50/50 dark:bg-white/5 p-4 rounded-lg border border-orange-100/50 dark:border-white/10">
                    <p className="font-bold text-rcc-orange">Global</p>
                    <p className="text-sm">Reach & Impact</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-200 dark:bg-slate-700 w-full my-6" />

              {/* Contact Section */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Interested in Partnering?</h2>
                <Text className="text-lg text-slate-700 dark:text-slate-300 mb-6">
                  Reach out to get details on partnership opportunities:
                </Text>
                <a
                  href="mailto:team@rcryptocurrency.com"
                  className="inline-block px-6 py-3 bg-rcc-orange hover:bg-orange-600 text-white font-bold rounded-lg transition-colors shadow-md"
                >
                  team@rcryptocurrency.com
                </a>
              </div>

              <div className="h-px bg-slate-200 dark:bg-slate-700 w-full my-6" />

              {/* Pitch Deck Section */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Our Pitch Deck</h2>
                <Text className="text-lg text-slate-700 dark:text-slate-300 mb-6">
                  Learn more about our community and partnership highlights:
                </Text>
                <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700" style={{ height: '600px' }}>
                  <iframe
                    src="https://docs.google.com/presentation/d/12H6v7I4yfgF26S3RdzmPwszXduYWx4X47W9MhM6DIac/embed?start=false&loop=false&delayms=3000"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay"
                  ></iframe>
                </div>
              </div>

            </div>
          </Card>
        </div>
      </main>
    </Background>
  );
}
