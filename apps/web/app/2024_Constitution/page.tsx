import React from 'react';
import Background from '../../components/Background';

export default function Constitution2024() {
  return (
    <Background>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-8 md:p-12 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-slate-900 dark:text-white mb-4">
            CCMOON DAO CONSTITUTION
          </h1>
          <div className="text-center text-slate-600 dark:text-slate-400 mb-12">
            <p>Version: 0.1.0</p>
            <p>Last updated: 17 Jun 2024</p>
          </div>

          <div className="prose dark:prose-invert max-w-none space-y-8 text-slate-800 dark:text-slate-200">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">PREAMBLE</h2>
              <div className="space-y-4">
                <p>WHEREAS, CryptoCurrency MOON (CCMOON) (the “Project”) is a decentralized system built on the basis of the Arbitrum Nova and Arbitrum One protocols, which comprise a number of decentralized applications, together forming one blockchain ecosystem (the “Ecosystem”);</p>
                <p>WHEREAS, the Project is a project in the field of decentralized social governance, which aims to reward users for participation in and contribution to social media communities (the “Contributors”) and afford members reputation and governance over the development of said communities;</p>
                <p>WHEREAS, the Project and the Ecosystem require a robust and effective governance model to further develop and function;</p>
                <p>WHEREAS, the exchange of value within the Ecosystem is facilitated with its native blockchain-based token, MOON (the “Token”);</p>
                <p>WHEREAS, the Project and the Ecosystem encompass a larger set of users than only the Contributors, all users of the Token (the “Tokenholders”) shall be bound by this document (the “Participants”), and</p>
                <p>WHEREAS, community members and core contributors to the Ecosystem, having a desire to further decentralize the Project and transform the Ecosystem in the Decentralised Autonomous Organisation (the “DAO”), have voted to adopt the CCMOON DAO Constitution (the “Constitution”) to read as follows.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Historical Context and Mission</h2>
              <p>The Project was launched with the Token in Spring of 2020 when Reddit Inc. released the beta of their Reddit Community Points project, and with it associated governance tokens in r/CryptoCurrency (MOON) and r/FortniteBR (BRICK) subreddits. In the summer of 2022 after several years of development and network migrations, Reddit announced that the tokens would achieve “mainnet” status on the Arbitrum Nova Layer 2 blockchain network.</p>
              <p>Approximately 15 months later in the Fall of 2023 Reddit announced that they were ending involvement with the Project, subsequently burning their token holdings, and renouncing their control of associated smart contracts, including the ‘Mint’ function which allowed for emission of additional tokens. This ended the monthly distributions of tokens by Reddit to users and moderators and terminated support and integration of the tokens in their mobile app’s crypto-wallet interface. At present, the Project and Ecosystem are being rebuilt, and there is a capped (and decreasing) supply of approximately 79.8M MOON.</p>
              <p>The supply is decreasing because the Project operates an advertising service whereby customers can burn MOON tokens in order to secure advertising to members of the Ecosystem, including the r/CryptoCurrency subreddit, Telegram, and Discord, although activity is concentrated on the subreddit to date. The advertising consists of pinned ask-me-anythings (AMAs), rental of the banner image for the subreddit, and other sponsored posts or comments. More details on operations are discussed in Article X.</p>
              <p>With this Constitution we formalize the Project as a DAO and specify the role of the Token within it. The Ecosystem has primarily been based around Reddit until this point, but logistical elements like governance have already been migrated to new services such as snapshot.org. We plan to expand the Project’s community moderation and advertising services beyond Reddit, and we see this Constitution as a necessity as well as a living document that will continue to evolve with the Project.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article I. Ratification of the Constitution.</h2>
              <p>This Constitution sets forth the basic rules of how the DAO and the Ecosystem function, are governed, and establishes the status of its governing bodies, as well as participants of the Ecosystem (the “Participants”).</p>
              <p>From the moment the Constitution is adopted, it becomes binding on any and all processes within the DAO (the “DAO”) to which it applies. The provisions of the Constitution supersede any other documents of the same scope adopted before.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article II. On-Chain Governance.</h2>
              <h3 className="text-xl font-semibold mb-2">Normative Structure of the Decentralized Governance.</h3>
              <p>The Constitution comprises a set of rules that is legally-binding for all Participants. Any person joining the DAO after the adoption of the Constitution shall automatically fall under its jurisdiction.</p>
              <p>The Constitution is a sole document that determines what governance actions are legitimate within the DAO. The DAO is governed through a set of smart contracts and off-chain governing bodies, as described below.</p>
              <p>This Constitution can only be amended through a Referendum, as defined below. No such changes shall be enforced retroactively.</p>
              <p>The effective version of the Constitution shall at all times be available at <a href="https://ccmoons.com/" className="text-rcc-orange hover:underline">https://ccmoons.com/</a></p>
              <p>Any documents linked to this Constitution shall be considered its integral parts.</p>
              <p>Governance today requires MOON tokens that are not locked in any liquidity pools or other smart contracts on either the Arbitrum One or Arbitrum Nova to vote in governance decisions.</p>
              <p>Voting occurs on <a href="https://snapshot.org" className="text-rcc-orange hover:underline">https://snapshot.org</a> and is administered by the Secretary.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article III. Native Units of the CCMOON DAO. Governance Participation.</h2>
              <p>At present each unit of Tokens is fully fungible with each other unit of Tokens. Each of the Tokens shall give the same scope of governance rights to each of the Contributors (the “Contributors”) holding the Tokens (the “Tokenholders”). Participation in governance qualifies as a Participant as a Contributor.</p>
              <p>In the future the DAO may vote to modify the Constitution to provide greater voting weight to MOON tokens earned by Contributors in the recent past: for instance Contributors who have earned MOON tokens within the last 6 months may receive double voting weight on those tokens specifically, or other algorithmic adjustments. Any such changes will require amendments to this Constitution through a Referendum, as defined below.</p>
              <p>There is currently a hard cap of Tokens. The hard cap at the time of Reddit Inc. relinquishing control of the smart contracts (Oct 2023) was equal to 82,279,600 MOON.</p>
              <p>The utility of the Tokens shall be determined by the DAO.</p>
              <p>Participation in the DAO’s governance shall be fixed with Tokens. All Tokenholders shall have the right to participate in the DAO governance, including participation in voting.</p>
              <p>In the future the DAO may vote to modify the Constitution in order to issue new tokens via new smart contracts. These tokens may or may not carry the MOON ticker, and they may or may not carry governance weight for DAO voting.Any such changes will require amendments to this Constitution through a Referendum, as defined below.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article IV. Treasury & Management of the Ecosystem Funds.</h2>
              <p>Income, expenses and disbursements of the DAO are facilitated through the DAO’s independent pool of assets, including Tokens, managed by the Treasurer, as designated below (the “Treasury”).</p>
              <p>The Treasury shall be accounted for by the Treasurer and all transactions will be available on a publicly available double-entry ledger hosted at <a href="https://ccmoons.com/" className="text-rcc-orange hover:underline">https://ccmoons.com/</a>.</p>
              <p>The Treasurer shall prepare reports on all income, expenses, and other modifications to the treasury quarterly.</p>
              <p>The Treasury shall be controlled by the Guardian and all expenditures will require multisignature approval from a threshold of Multisignature Key Holders (“MKH”) defined in Article V Section 5.5.</p>
              <p>The following expenses from the Treasury shall require an additional approval of the Tokenholders before they are implemented by the Treasurer and approved by the MKH:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Any strategic distribution for the purposes of developing the Ecosystem;</li>
                <li>Giving grants to the Contributors for the development of the Ecosystem;</li>
                <li>Organizing any off-chain events for the development of the Ecosystem;</li>
                <li>Purchase of any off- or on-chain goods or services in an amount equal or exceeding $1,000 or equivalent in any other fiat or cryptocurrency;</li>
                <li>Any Giveaways or Special Events for the community where the cumulative prize is over 2,000 Moons</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article V. Institutional Structure of the Decentralised Governance.</h2>
              
              <h3 className="text-xl font-semibold mb-2">Decentralized Structure and Efficient Governance:</h3>
              <p>The DAO operates as a decentralized structure, ensuring transparency and inclusivity in decision-making. However, to maintain efficient governance, certain functions are vested in a select group of managing bodies.</p>
              <p>These managing bodies are tasked with acting in the best interests of both the Contributors and Participants, promoting the growth of the DAO and its ecosystem, and maintaining the underlying protocol and its execution.</p>

              <h3 className="text-xl font-semibold mt-6 mb-2">Protocol for Officer Nominations, Selections, Terms, and Compensation</h3>
              
              <h4 className="text-lg font-medium mt-4 mb-2">Nominations</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Officer nominations shall be open to all members of the DAO who have continuously been Tokenholders with a minimum balance of 50,000 MOON for the six months preceding nominations.</li>
                <li>Nominations shall be submitted to the community on <a href="https://reddit.com/r/cryptocurrencymeta" className="text-rcc-orange hover:underline">https://reddit.com/r/cryptocurrencymeta</a> or other forums for discussion specified by the Project.</li>
                <li>Nominees may present co-parties they intend to work with, plans and general vision for the term of the position, and terms of compensation in their nomination.</li>
              </ul>

              <h4 className="text-lg font-medium mt-4 mb-2">Selections</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>The DAO shall vote on officers from the slate of candidates using ranked choice voting on snapshot.org.</li>
              </ul>

              <h4 className="text-lg font-medium mt-4 mb-2">Terms</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>The term of office for all officers shall be one year.</li>
                <li>Officers may be re-elected for additional terms.</li>
              </ul>

              <h4 className="text-lg font-medium mt-4 mb-2">Compensation</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Officers may be compensated for their services.</li>
                <li>The compensation of officers shall be determined in their nomination - this will be a factor for voters to consider.</li>
                <li>The annual compensation of officers shall be reasonable and in line with industry standards and shall not exceed $1M USD in value at the time of nomination.</li>
              </ul>

              <h4 className="text-lg font-medium mt-4 mb-2">Additional Provisions</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Officers shall be subject to the DAO's code of conduct.</li>
                <li>Officers shall be removed from office for cause by a super majority vote (66+%).</li>
                <li>Officers shall be indemnified by the DAO for any liabilities incurred in the performance of their duties.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-2">Creation of New Managing Bodies:</h3>
              <p>In addition to the predefined managing bodies, the DAO reserves the right to establish new managing bodies and fill their positions through a referendum process.</p>
              <p>This provision allows the DAO to adapt to changing circumstances and address emerging needs, ensuring ongoing effectiveness and adaptability.</p>

              <h3 className="text-xl font-semibold mt-6 mb-2">The Secretary:</h3>
              <p>The Secretary plays a crucial role in overseeing the governance and referendum processes. They are responsible for managing votes during MOON week on snapshot.org, as well as organizing the discussion that precedes those votes on <a href="https://reddit.com/r/CryptoCurrencyMeta" className="text-rcc-orange hover:underline">https://reddit.com/r/CryptoCurrencyMeta</a> or other forums where such discussion may take place.</p>
              <p>They serve as a liaison between all managing bodies, ensuring timely execution of their duties and facilitating smooth communication and coordination.</p>

              <h3 className="text-xl font-semibold mt-6 mb-2">The Executive Manager:</h3>
              <p>The Executive Manager functions as the executive managing body of the DAO.</p>
              <p>They are responsible for implementing proposals supported by the referendum that require manual execution.</p>
              <p>This includes tasks such as executing smart contracts, managing partnerships, and overseeing day-to-day operations.</p>

              <h3 className="text-xl font-semibold mt-6 mb-2">The Guardian:</h3>
              <p>The Guardian serves as the controlling managing body of the DAO.</p>
              <p>They are tasked with ensuring that the other officers act in the best interests of the Contributors and in accordance with the will of the Participants.</p>
              <p>The Guardian plays a vital role in maintaining accountability and ensuring that the DAO operates in accordance with its core principles and objectives.</p>
              <p>The Guardian is composed of the Multisignature Key Holders (MKH) which control access to the treasury.</p>
              <p>These MKH are required to use a newly generated and dedicated private key solely for this purpose and are expected to follow best practices for maintaining integrity and security.</p>

              <h3 className="text-xl font-semibold mt-6 mb-2">The Treasurer:</h3>
              <p>The Treasurer bears responsibility for managing the DAO's treasury.</p>
              <p>Their duties encompass tasks such as safeguarding funds, managing financial transactions, advising on the proper allocation of resources to support the DAO's initiatives and operations, and managing a public set of books that will be available at all times on <a href="https://ccmoons.com/" className="text-rcc-orange hover:underline">https://ccmoons.com/</a>.</p>
              <p>The Treasurer plays a crucial role in maintaining the financial health and stability of the DAO.</p>

              <h3 className="text-xl font-semibold mt-6 mb-2">Sales Officer</h3>
              <p>The Sales Officer is the main point of contact for all advertising sales issues and inquiries.</p>
              <p>The Sales Officer is responsible for managing the linking or stickying of AMAs, modifying banner images, and other advertising-related responsibilities.</p>

              <h3 className="text-xl font-semibold mt-6 mb-2">Moderation Officer</h3>
              <p>The Moderation Officer shall serve as the lead on moderation issues.</p>
              <p>They will be responsible for managing discussion of issues related to moderation and communicating about issues and changes related to moderation with the Contributors of the Ecosystem.</p>

              <h3 className="text-xl font-semibold mt-6 mb-4">Inaugural Officers (Term ending July 2025)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <span className="font-bold block">Secretary</span>
                  <a href="https://reddit.com/u/Cintre" className="text-rcc-orange hover:underline">u/Cintre</a>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <span className="font-bold block">Executive Manager</span>
                  <a href="https://reddit.com/u/nanooverbtc" className="text-rcc-orange hover:underline">u/nanooverbtc</a>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <span className="font-bold block">Guardian</span>
                  <span>MKH</span>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <span className="font-bold block">Treasurer</span>
                  <a href="https://reddit.com/u/jwinterm" className="text-rcc-orange hover:underline">u/jwinterm</a>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <span className="font-bold block">Sales Officer</span>
                  <a href="https://reddit.com/u/mvea" className="text-rcc-orange hover:underline">u/mvea</a>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <span className="font-bold block">Moderation Officer</span>
                  <a href="https://reddit.com/u/Cryptomaximalist" className="text-rcc-orange hover:underline">u/Cryptomaximalist</a>
                </div>
              </div>
              <p className="text-sm mt-2 italic">*The inaugural officers will not receive compensation.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article VI. Referendum & Voting.</h2>
              <p>Each Tokenholder shall have the right to propose changes to the Constitution (the “Proposal”) to be voted on by the Tokenholders participating in the decentralized governance (the “Referendum”), provided that the Tokenholder submitting the Proposal has [we need to figure out some way to prevent DoS attack here I think, min holding for 6 months at least maybe].</p>
              <p>To submit a Proposal and initiate the Referendum, the Tokenholder has to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Publish a Draft Proposal, containing the proposed changes, the reasoning behind the Proposal, the importance of making changes to the Constitution, proposed implementation (including technical, financial, and governance implications), and other information that is specified in the requirements at <a href="https://reddit.com/r/CryptoCurrencyMeta" className="text-rcc-orange hover:underline">https://reddit.com/r/CryptoCurrencyMeta</a>;</li>
              </ul>
              <p>Each Token shall bear the voting weight as specified in Article III. Each Tokenholder shall have the right to vote on the submitted Proposal by casting one of the following votes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>For, in which case the Tokenholder supports the Proposal;</li>
                <li>Against, in which case the Tokenholder does not support the Proposal; or</li>
                <li>Abstain, in which case the Tokenholder neither supports nor rejects the Proposal, but their vote still counts for the required number of votes to make the Referendum binding (the “Quorum”).</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-4">Voting Thresholds</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-700">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left">Type of Changes</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left">Quorum (% of Tokens)</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left">Votes Required</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left">Voting Time (hours)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 dark:border-slate-700 p-2">Changes to the activities of the Project, approving certain expenses from the Treasury (Section 4.5), creating and appointing persons to fill out the positions within the managing bodies, making changes to documents linked to this Constitution except if it falls within another change category.</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-2">2%</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-2">≥51%</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-2">168</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 dark:border-slate-700 p-2">Changes to the utility of the Tokens, rights of the Tokenholders, creating off-chain legal entities to represent the DAO, and modifying this document.</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-2">2%</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-2">≥66%</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-2">168</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 dark:border-slate-700 p-2">Electing/Removing a Guardian (I.E. SubReddit Moderators)</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-2">2%</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-2">≥66%</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-2">168</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article VII. On-Chain and Off-Chain Implementation of Supported Proposals.</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Supported Proposals that can be implemented in an automatic way by the means of smart contacts are implemented in an autonomous manner.</li>
                <li>Supported Proposals that cannot be implemented in an automatic way and require manual implementation shall be implemented by the managing body responsible for the respective function (normally, the executive managing body).</li>
                <li>Implementation of some Proposals may require the delegation of certain functions of the DAO to third parties. In this case, the implementing managing body shall be responsible for the relations with and the conduct of those third parties.</li>
                <li>The controlling managing body shall oversee the implementation of the supported Proposals.</li>
                <li>Implementation of some Proposals may require the allocation of funds from the Treasury. In this case, the Treasurer shall oversee that the funds are spent by the implementing body in a diligent manner.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article VIII. Representation of the DAO.</h2>
              <p>While the DAO itself is a decentralized entity and enjoys a distributed structure, there might arise a need to incorporate a legal entity to shield the Contibutors from legal risks, raise capital, attract off-chain liquidity, interact with off-chain parties, or for another objective reason.</p>
              <p>Creating those legal entities and the allocation of resources to them from the Treasury shall be done by the means of the Referendum and requiring modification to the Constitution.</p>
              <p>Those legal entities shall at all times act in the interests of the DAO and only within the scope of the DAO’s functions delegated to them.</p>
              <p>If the created legal entities shall require for one or more of their own bodies to be filled, the Tokenholders shall vote on which Contributor to appoint at the vacant position on the Referendum.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article IX. Decentralized Jurisdiction. Applicable Law & Dispute Resolution.</h2>
              <p>Any relations amongst the Participants shall fall under the jurisdiction determined as per their own personal laws.</p>
              <p>Relations arising from adopting, amending, or enforcing this Constitution shall be governed by the laws of Switzerland.</p>
              <p>Any disputes about the adoption, amendment, or enforcement of the Constitution shall be attempted to be resolved by the parties to a dispute by negotiations in good faith. If the disputing parties are unable to do so in 60 days after the dispute’s commencement, it shall be resolved in Switzerland.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article X. Advertising Operations of the DAO</h2>
              <p>The DAO manages communities on social media and news aggregation platforms via moderation (see Article XI).</p>
              <p>The DAO offers advertising in the form of featured guest interviews (ask-me-anythings (AMAs)), banner or other advertising space rental, featured polls, and other similar offerings.</p>
              <p>The DAO shall elect a Sales Officer to lead and manage these efforts, as detailed in Article V Section 5.7.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article XI. Moderation Operations of the DAO</h2>
              <p>In order to foster healthy communities where there is an opportunity for Contributors to participate and for advertisers to communicate directly with Participants via AMAs and other targeted messages, the DAO provides moderation services.</p>
              <p>Moderation services are provided to ensure compliance with community guidelines, platform Terms of Service, maintain civility, and protect the integrity of the communities.</p>
              <p>The moderation team for each community will be selected by a combination of the community and the DAO. The DAO will be allowed to provide at least one moderator by vote or other agreement.</p>
              <p>For the DAO provided moderator(s) contributors may nominate and vote for potential moderators following a transparent selection process, as defined by nomination and voting processes outlined for officers in Article V Section 5.1.c.</p>
              <p>The moderation selection process for the remaining community moderators shall be at the discretion of the community.</p>
              <p>Moderators are responsible for enforcing community guidelines, addressing possible violations of the Terms of Service for the website or social media app that the community exists on, and maintaining a positive environment.</p>
              <p>Moderators must act impartially, fairly, and without bias, ensuring all actions are in the best interest of the community.</p>
              <p>The DAO will provide training and resources to moderators to ensure they are well-equipped to perform their duties effectively.</p>
              <p>Conflict resolution between moderators and community members shall adhere to the process defined in Article IX.</p>
              <p>Appeals against moderation decisions can be submitted to a designated committee within the DAO for review.</p>
              <p>Moderators provided by the DAO will serve for a one year term, while community moderator terms will be governed by their own specific community moderation team.</p>
              <p>At the end of each term, moderators may be reappointed or replaced based on community feedback and DAO assessment.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article XII. Contributor Rewards</h2>
              <p>Reddit Inc. formerly minted Tokens according to a defined emission schedule to reward Contributors to the Ecosystem based on their participation in and contributions to r/CryptoCurrency. Rewards were initially proportional to the number of upvotes that a user’s Reddit account received within the r/CryptoCurrency subreddit.</p>
              <p>The Project shall reward Contributors across all communities that it moderates.</p>
              <p>The rewards for each community will be independently determined by a vote requiring 66+% approval from Tokenholders.</p>
              <p>The rewards accorded to any community may also be rescinded by the DAO at any time by a vote requiring 66+% approval from Tokenholders.</p>
              <p>The term of any rewards schedule accorded by the DAO to any community shall not exceed 1 year.</p>
            </section>
          </div>
        </div>
      </div>
    </Background>
  );
}
