import { Title, Text, Card } from "@tremor/react";
import Background from '../../components/Background';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Become a Partner',
  description: 'Partner with the world\'s largest cryptocurrency community. Collaborate with the rCryptoCurrency Foundation on sponsorships, research, and community initiatives.',
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
            Collaborate with the world's largest crypto community through the rCryptoCurrency Foundation (CCMOON DAO)
          </p>

          <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-orange-100 dark:border-slate-800 p-8 rounded-xl shadow-xl">
            <div className="space-y-8 text-center">

              {/* Mission Statement */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Partnership Opportunities</h2>
                <Text className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                  The rCryptoCurrency Foundation (CCMOON DAO) is dedicated to fostering meaningful partnerships that advance our community's mission of education, transparency, and innovation in cryptocurrency. We collaborate with organizations that share our values and commitment to ethical practices.
                </Text>
                <Text className="text-sm text-slate-600 dark:text-slate-400">
                  All partnerships are conducted in full compliance with Reddit's Terms of Service and all applicable regulations.
                </Text>
              </div>

              <div className="h-px bg-slate-200 dark:bg-slate-700 w-full my-6" />

              {/* About the Community */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">About r/CryptoCurrency</h2>
                <Text className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                  r/CryptoCurrency is the world's largest cryptocurrency community with over 10 million members. Our community is built on principles of education, critical thinking, and community governance through the MOON token.
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

              {/* Partnership Models */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Partnership Models</h2>
                <Text className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                  We offer flexible partnership structures tailored to your organization's goals and values alignment. Whether you're interested in sponsorships, research collaboration, or community initiatives, let's discuss how we can work together.
                </Text>
              </div>

              <div className="h-px bg-slate-200 dark:bg-slate-700 w-full my-6" />

              {/* Pricing Section - COMMENTED FOR NOW */}
              {/*
              <div>
                <Text className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                  Interested in advertising in r/CryptoCurrency? You can view pricing here:
                </Text>
                <a
                  href="https://docs.google.com/spreadsheets/d/1lx9w3PJaCbFwfhFyOg82-E_8oEU8iOllu0ohOVbbgiQ/htmlview#gid=779643328"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-rcc-orange hover:bg-orange-600 text-white font-bold rounded-lg transition-colors shadow-md"
                >
                  View Pricing Sheet
                </a>
              </div>
              <div className="h-px bg-slate-200 dark:bg-slate-700 w-full my-6" />
              */}

              {/* Contact Section */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Interested in Partnering?</h2>
                <Text className="text-lg text-slate-700 dark:text-slate-300 mb-6">
                  Reach out to discuss partnership opportunities and how your organization can collaborate with our foundation:
                </Text>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  <TelegramLink username="TwoCentTimmy" />
                  <TelegramLink username="jwinterm" />
                  <TelegramLink username="u_mvea" />
                </div>
                <Text className="text-sm text-slate-600 dark:text-slate-400 mt-6">
                  We're happy to discuss your specific needs and explore how a partnership can benefit both your organization and our community.
                </Text>
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

              <div className="h-px bg-slate-200 dark:bg-slate-700 w-full my-6" />

              {/* Compliance Footer */}
              <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-xs text-blue-900 dark:text-blue-200">
                  <span className="font-semibold">Important Note:</span> All partnerships follow Reddit's Terms of Service and our Foundation's commitment to ethical community practices. We do not engage in pay-to-promote schemes or misleading practices.
                </p>
              </div>

            </div>
          </Card>
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
