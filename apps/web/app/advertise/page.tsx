import { Title, Text, Card } from "@tremor/react";
import Background from '../../components/Background';
import Link from 'next/link';

export default function AdvertisePage() {
  return (
    <Background>
      <main className="p-10 pt-24 min-h-screen flex flex-col items-center">
        <div className="container mx-auto max-w-3xl">
          <Title className="text-slate-900 dark:text-white mb-8 text-3xl font-bold text-center">
            Advertise on r/CryptoCurrency
          </Title>
          
          <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-orange-100 dark:border-slate-800 p-8 rounded-xl shadow-xl">
            <div className="space-y-8 text-center">
              
              {/* Pricing Section */}
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

              {/* Contact Section */}
              <div>
                <Text className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                  Please contact us with any questions on Telegram, including scheduling:
                </Text>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  <TelegramLink username="TwoCentTimmy" />
                  <TelegramLink username="jwinterm" />
                  <TelegramLink username="u_mvea" />
                </div>
              </div>

              <div className="h-px bg-slate-200 dark:bg-slate-700 w-full my-6" />

              {/* Pitch Deck Section */}
              <div>
                <Text className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                  See our highlights and further info in our pitch deck:
                </Text>
                <a 
                  href="https://docs.google.com/presentation/d/12H6v7I4yfgF26S3RdzmPwszXduYWx4X47W9MhM6DIac/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-md"
                >
                  View Pitch Deck
                </a>
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
