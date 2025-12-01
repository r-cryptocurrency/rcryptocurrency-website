import React from 'react';

type TimelineEvent = {
  date: string;
  title: string;
  description: string;
  link?: string;
  linkText?: string;
};

const TIMELINE_DATA: TimelineEvent[] = [
  {
    date: "Sept 2025",
    title: "Ratify Updated Constitution",
    description: "CCMOON DAO members vote to ratify updates to the DAO constitution to improve governance processes.",
    link: "/2025_Constitution",
    linkText: "Read Current Constitution"
  },
  {
    date: "Nov 2024",
    title: "Unstoppable Domains",
    description: "Partnered with Unstoppable Domains to launch .MOON domains."
  },
  {
    date: "June 2024",
    title: "Moonrise",
    description: "MOON holders vote to adopt the first DAO constitution and establish the CCMOON DAO.",
    link: "/2024_Constitution",
    linkText: "Read Constitution"
  },
  {
    date: "March 2024",
    title: "Arbitrum One",
    description: "Moons can now be bridged to Arbitrum One, a much more active chain than Nova."
  },
  {
    date: "Jan 2024",
    title: "Restart MOON distributions",
    description: "The proto-DAO voted to restart Moon distribution.",
    link: "https://snapshot.box/#/s:cryptomods.eth/proposals",
    linkText: "View Proposals"
  },
  {
    date: "October 2023",
    title: "Sunsetting of Community Points",
    description: "Reddit Admins ends their involvement in Moons. They renounced the Moons contract and burned their ~40M Moons."
  },
  {
    date: "July-August 2023",
    title: "Major CEX Listings",
    description: "Crypto.com and Kraken become the first major exchanges to list Moons for trading."
  },
  {
    date: "February 2023",
    title: "Major Moon Burn",
    description: "The bridge from Rinkeby testnet to Arbitrum nova was deprecated. 4.7M Moons were effectively burned in the process."
  },
  {
    date: "August 2022",
    title: "Arbitrum Nova Mainnet",
    description: "Moons are migrated from Arbitrum Nova testnet to Arbitrum Nova mainnet."
  },
  {
    date: "July 2021",
    title: "Arbitrum Nova Testnet",
    description: "Moons are migrated from Rinkeby testnet to the Arbitrum Nova testnet."
  },
  {
    date: "June 2020",
    title: "The First Moon Landing",
    description: "Moons were first distributed to users in June 2020. Each user earned 8.8 Moons per karma on r/CryptoCurrency."
  }
];

export default function Timeline() {
  return (
    <section id="timeline" className="py-20 bg-white/50 dark:bg-slate-950/50 relative">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-16">MOON History</h2>
        <div className="relative space-y-12">
          {/* Central Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-rcc-orange/50 md:-ml-[1px]"></div>
          
          {TIMELINE_DATA.map((event, index) => {
            const isLeft = index % 2 === 0;
            return (
              <div key={index} className="relative pl-8 md:pl-0">
                {/* Dot */}
                <div className="absolute left-[-5px] md:left-1/2 top-0 w-4 h-4 rounded-full bg-rcc-orange shadow-[0_0_10px_rgba(227,97,57,0.8)] md:-ml-[8px] z-10"></div>
                
                <div className={`md:flex md:justify-between md:items-center ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                  {/* Date Side */}
                  <div className={`md:w-[45%] mb-2 md:mb-0 ${!isLeft ? 'md:text-right' : ''}`}>
                    <span className="text-rcc-orange font-bold">{event.date}</span>
                  </div>
                  
                  {/* Content Side */}
                  <div className="md:w-[45%] bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm p-6 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-rcc-orange/50 transition-colors shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{event.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {event.description}
                    </p>
                    {event.link && (
                      <a 
                        href={event.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-rcc-orange hover:underline block mt-2"
                      >
                        {event.linkText || 'Read more'}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
