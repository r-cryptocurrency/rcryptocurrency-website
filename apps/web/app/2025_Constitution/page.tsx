import React from 'react';
import Background from '../../components/Background';

export default function Constitution2025() {
  return (
    <Background>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-8 md:p-12 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-slate-900 dark:text-white mb-4">
            CCMOON DAO CONSTITUTION
          </h1>
          <div className="text-center text-slate-600 dark:text-slate-400 mb-12">
            <p>Version: 0.2.1</p>
            <p>Last updated: 23 October 2025</p>
          </div>

          <div className="prose dark:prose-invert max-w-none space-y-8 text-slate-800 dark:text-slate-200">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">PREAMBLE</h2>
              <div className="space-y-4 pl-4">
                <p>a. WHEREAS, CryptoCurrency MOON (CCMOON) (the “Project”) is a decentralized system built on the basis of the Arbitrum Nova and Arbitrum One protocols, which comprise a number of decentralized applications, together forming one blockchain ecosystem (the “Ecosystem”);</p>
                <p>b. WHEREAS, the Project is a project in the field of decentralized social governance, which aims to reward users for participation in and contribution to social media communities (the “Contributors”) and afford members reputation and governance over the development of said communities;</p>
                <p>c. WHEREAS, the Project and the Ecosystem require a robust and effective governance model to further develop and function;</p>
                <p>d. WHEREAS, the exchange of value within the Ecosystem is facilitated with its native blockchain-based token, MOON (the “Token”);</p>
                <p>e. WHEREAS, the Project and the Ecosystem encompass a larger set of users than only the Contributors, all users of the Token (the “Tokenholders”) shall be bound by this document (the “Participants”), and</p>
                <p>f. WHEREAS, community members and core contributors to the Ecosystem, having a desire to further decentralize the Project and transform the Ecosystem in the decentralized Autonomous Organisation (the “DAO”), have voted to adopt the CCMOON DAO Constitution (the “Constitution”) to read as follows.</p>
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
              <p>1.1. This Constitution sets forth the basic rules of how the DAO and the Ecosystem function, are governed, and establishes the status of its governing bodies, as well as participants of the Ecosystem (the “Participants”).</p>
              <p>1.2. From the moment the Constitution is adopted, it becomes binding on any and all processes within the DAO (the “DAO”) to which it applies. The provisions of the Constitution supersede any other documents of the same scope adopted before.</p>
              <p>1.3. If any provision of this Constitution is held invalid, the remaining provisions remain in force. In case of conflict between this Constitution and other CCMOON DAO documents, this Constitution prevails unless expressly stated otherwise by Referendum.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article II. Onchain Governance.</h2>
              <h3 className="text-xl font-semibold mb-2">Normative Structure of the Decentralized Governance.</h3>
              <p>2.1. The Constitution comprises a set of rules that is legally-binding for all Participants. Any person joining the DAO after the adoption of the Constitution shall automatically fall under its jurisdiction.</p>
              <p>2.2. The Constitution is a sole document that determines what governance actions are legitimate within the DAO. The DAO is governed through a set of smart contracts and off-chain governing bodies, as described below.</p>
              <p>2.3. This Constitution can only be amended through a Referendum, as defined below. No such changes shall be enforced retroactively.</p>
              <p>2.4. The effective version of the Constitution shall at all times be available at <a href="https://ccmoons.com/" className="text-rcc-orange hover:underline">https://ccmoons.com/</a></p>
              <p>2.5. Any documents linked to this Constitution shall be considered its integral parts.</p>
              <p>2.6. Governance today requires MOON tokens that are not locked in any liquidity pools or other smart contracts on either the Arbitrum One or Arbitrum Nova to vote in governance decisions.</p>
              <p>2.7. Voting occurs on <a href="https://snapshot.org" className="text-rcc-orange hover:underline">https://snapshot.org</a> and is administered by the Secretary.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article III. Native Units of the CCMOON DAO. Governance Participation.</h2>
              <p>3.1. At present each unit of Tokens is fully fungible with each other unit of Tokens. Each of the Tokens shall give the same scope of governance rights to each of the Contributors (the “Contributors”) holding the Tokens (the “Tokenholders”). Participation in governance qualifies as a Participant as a Contributor.</p>
              <p>3.2. In the future the DAO may vote to modify the Constitution to provide greater voting weight to MOON tokens earned by Contributors in the recent past: for instance Contributors who have earned MOON tokens within the last 6 months may receive double voting weight on those tokens specifically, or other algorithmic adjustments. Any such changes will require amendments to this Constitution through a Referendum, as defined below.</p>
              <p>3.3. There is currently a hard cap of Tokens. The hard cap at the time of Reddit Inc. relinquishing control of the smart contracts (Oct 2023) was equal to 82,279,600 MOON.</p>
              <p>3.4. The utility of the Tokens shall be determined by the DAO.</p>
              <p>3.5. Participation in the DAO’s governance shall be fixed with Tokens. All Tokenholders shall have the right to participate in the DAO governance, including participation in voting.</p>
              <p>3.6. In the future the DAO may vote to modify the Constitution in order to issue new tokens via new smart contracts. These tokens may or may not carry the MOON ticker, and they may or may not carry governance weight for DAO voting. Any such changes will require amendments to this Constitution through a Referendum, as defined below.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article IV. Treasury & Management of the Ecosystem Funds.</h2>
              <p>4.1. Income, expenses and disbursements of the DAO are facilitated through the DAO’s independent pool of assets, including Tokens, managed by the Treasurer, as designated below (the “Treasury”).</p>
              <p>4.2. The Treasury shall be accounted for by the Treasurer and all transactions will be available on a publicly available double-entry ledger hosted at <a href="https://ccmoons.com/" className="text-rcc-orange hover:underline">https://ccmoons.com/</a>.</p>
              <p>4.3. The Treasurer shall prepare reports on all income, expenses, and other modifications to the Treasury quarterly.</p>
              <p>4.4. The Treasury shall be controlled by the Guardians and all expenditures will require multisignature approval from a threshold of Multisignature Key Holders (“MKH”) defined in Article V Section 5.5.</p>
              <p>4.5. The following expenses from the Treasury shall require an additional approval of the Tokenholders before they are implemented by the Treasurer and approved by the MKH:</p>
              <div className="pl-6 space-y-2">
                <p>a. Any strategic distribution for the purposes of developing the Ecosystem;</p>
                <p>b. Giving grants to the Contributors for the development of the Ecosystem;</p>
                <p>c. Organizing any off-chain events for the development of the Ecosystem;</p>
                <p>d. Purchase of any off- or onchain goods or services in an amount equal or exceeding $1,000 or equivalent in any other fiat or cryptocurrency;</p>
                <p>e. Any Giveaways or Special Events for the community where the cumulative prize is over 2,000 Moons</p>
                <p>f. For clarity and limitations around section 4.5.d and 4.5.e,</p>
                <div className="pl-6 space-y-2">
                  <p>a. Non-emergency: An Officer may authorize discretionary operational expenditures up to USD $1,000 per calendar month, subject to post-facto reporting in the subsequent Moon Week report.</p>
                  <p>b. Emergency: In emergencies that threaten security or critical continuity, any two Officers may authorize an extraordinary expenditure up to USD $10,000, with a post-facto public report within seven (7) days.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article V. Institutional Structure of the Decentralized Governance.</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">5.1. Decentralized Structure and Efficient Governance:</h3>
                  <div className="pl-4 space-y-2">
                    <p>a. The DAO operates as a decentralized structure, ensuring transparency and inclusivity in decision-making. However, to maintain efficient governance, certain functions are vested in a select group of managing bodies.</p>
                    <p>b. These managing bodies are tasked with acting in the best interests of both the Contributors and Participants, promoting the growth of the DAO and its ecosystem, and maintaining the underlying protocol and its execution.</p>
                    <p>c. Protocol for Officer Nominations, Selections, Terms, and Compensation</p>
                    <div className="pl-4 space-y-2">
                      <p>i. Nominations</p>
                      <div className="pl-4 space-y-1">
                        <p>1. Officer nominations shall be open to all members of the DAO who have continuously been Tokenholders with a minimum balance of 50,000 MOON for the six months preceding nominations.</p>
                        <p>2. Nominations shall be submitted to the community on <a href="https://reddit.com/r/cryptocurrencymeta" className="text-rcc-orange hover:underline">https://reddit.com/r/cryptocurrencymeta</a> or other forums for discussion specified by the Project.</p>
                        <p>3. Nominees may present co-parties they intend to work with, plans and general vision for the term of the position, and terms of compensation in their nomination.</p>
                      </div>
                      <p>ii. Selections</p>
                      <div className="pl-4 space-y-1">
                        <p>1. The DAO shall vote on Officers from the slate of candidates using ranked choice voting on snapshot.org.</p>
                      </div>
                      <p>iii. Terms</p>
                      <div className="pl-4 space-y-1">
                        <p>1. The term of office for all Officers shall be one year. However, if no valid proposal for new elections has been submitted and approved under Article 5.9, the incumbent Officer shall continue to serve beyond the one-year period until the next election is held.</p>
                        <p>2. Officers may be re-elected for additional terms.</p>
                      </div>
                      <p>iv. Compensation</p>
                      <div className="pl-4 space-y-1">
                        <p>1. Officers may be compensated for their services.</p>
                        <p>2. The compensation of Officers shall be determined in their nomination - this will be a factor for voters to consider.</p>
                        <p>3. The annual compensation of Officers shall be reasonable and in line with industry standards and shall not exceed $1M USD in value at the time of nomination.</p>
                      </div>
                      <p>v. Additional Provisions</p>
                      <div className="pl-4 space-y-1">
                        <p>1. Officers shall be subject to the DAO's code of conduct once ratified.</p>
                        <p>2. Officers shall be removed from office for cause by a super majority vote (66+%).</p>
                        <p>3. Officers shall be indemnified by the DAO for any liabilities incurred in the performance of their duties.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">5.2. Creation of New Managing Bodies:</h3>
                  <div className="pl-4 space-y-2">
                    <p>a. In addition to the predefined managing bodies, the DAO reserves the right to establish new managing bodies and fill their positions through a Referendum process.</p>
                    <p>b. This provision allows the DAO to adapt to changing circumstances and address emerging needs, ensuring ongoing effectiveness and adaptability.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">5.3. The Secretary:</h3>
                  <div className="pl-4 space-y-2">
                    <p>a. The Secretary plays a crucial role in overseeing the governance and Referendum processes. They are responsible for managing votes during MOON week on snapshot.org, as well as organizing the discussion that precedes those votes on <a href="https://reddit.com/r/CryptoCurrencyMeta" className="text-rcc-orange hover:underline">https://reddit.com/r/CryptoCurrencyMeta</a> or other forums where such discussion may take place.</p>
                    <p>b. They serve as a liaison between all managing bodies, ensuring timely execution of their duties and facilitating smooth communication and coordination.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">5.4. The Executive Director:</h3>
                  <div className="pl-4 space-y-2">
                    <p>a. The Executive Director functions as the executive managing body of the DAO.</p>
                    <p>b. They are responsible for implementing proposals supported by the Referendum that require manual execution.</p>
                    <p>c. This includes tasks such as executing smart contracts, managing partnerships, and overseeing day-to-day operations.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">5.5. The Guardians:</h3>
                  <div className="pl-4 space-y-2">
                    <p>a. The Guardians serve as the controlling managing body of the DAO.</p>
                    <p>b. They are tasked with ensuring that the other Officers act in the best interests of the Contributors and in accordance with the will of the Participants.</p>
                    <p>c. The Guardians play a vital role in maintaining accountability and ensuring that the DAO operates in accordance with its core principles and objectives.</p>
                    <p>d. The Guardians are composed of the Multisignature Key Holders (MKH) which control access to the Treasury.</p>
                    <p>e. These MKH are required to use a newly generated and dedicated private key solely for this purpose and are expected to follow best practices for maintaining integrity and security.</p>
                    <p>f. As of September 2025, Multisignature Key is secured by seven (7) authorized signers, requiring four (4) signatures to execute any transaction.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">5.6. The Treasurer:</h3>
                  <div className="pl-4 space-y-2">
                    <p>a. The Treasurer bears responsibility for managing the DAO's Treasury.</p>
                    <p>b. Their duties encompass tasks such as safeguarding funds, managing financial transactions, advising on the proper allocation of resources to support the DAO's initiatives and operations, and managing a public set of books that will be available at all times on <a href="https://ccmoons.com/" className="text-rcc-orange hover:underline">https://ccmoons.com/</a>.</p>
                    <p>c. The Treasurer plays a crucial role in maintaining the financial health and stability of the DAO.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">5.7. Marketing Officer</h3>
                  <div className="pl-4 space-y-2">
                    <p>a. The Marketing Officer is the main point of contact for all advertising sales issues and inquiries.</p>
                    <p>b. The Marketing Officer is responsible for managing the linking or stickying of AMAs, modifying banner images, and other advertising-related responsibilities.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">5.8. Moderation Officer</h3>
                  <div className="pl-4 space-y-2">
                    <p>a. The Moderation Officer shall serve as the lead on moderation issues.</p>
                    <p>b. They will be responsible for managing discussion of issues related to moderation and communicating about issues and changes related to moderation with the Contributors of the Ecosystem.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">5.9. Technology & Infrastructure Officer</h3>
                  <div className="pl-4 space-y-2">
                    <p>a. The Technology & Infrastructure Officer shall be responsible for managing the DAO’s digital infrastructure, including governance platforms, treasury dashboards, and technical integrations required for day-to-day operations.</p>
                    <p>b. The Technology & Infrastructure Officer will ensure that multisignature key processes, smart contract tools, and other digital assets are properly maintained, secure, and accessible to the DAO.</p>
                    <p>c. The Technology & Infrastructure Officer plays a key role in safeguarding the DAO’s resilience by coordinating with Guardians and other Officers on technical matters.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">5.10. Community Engagement Officer</h3>
                  <div className="pl-4 space-y-2">
                    <p>a. The Community Engagement Officer shall lead efforts to strengthen relationships within the r/CryptoCurrency Network communities.</p>
                    <p>b. They will be responsible for coordinating events, contests, polls, and other initiatives that drive contributor participation and highlight DAO initiatives across r/CryptoCurrency, r/CryptoMarkets, r/CryptoCurrencyMeta, and related communities.</p>
                    <p>c. The Community Engagement Officer will ensure transparency and provide timely reporting on community activities, working closely with the Moderation Officer and Marketing Officer to align initiatives with both community health and DAO goals.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">5.11. Ecosystem Growth Officer</h3>
                  <div className="pl-4 space-y-2">
                    <p>a. The Ecosystem Growth Officer shall serve as the primary point of contact for strategic partnerships and collaborations that expand the DAO’s reach.</p>
                    <p>b. The Ecosystem Growth Officer will manage relationships with external projects, advertisers, token partners, and other organizations that wish to integrate with or support the DAO.</p>
                    <p>c. The Ecosystem Growth Officer shall coordinate with the Treasurer and Executive Director to ensure that new partnerships are structured to benefit the DAO and its Participants.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">5.12. Election of Officers</h3>
                  <div className="pl-4 space-y-2">
                    <p>a. Elections for DAO Officers shall not occur more than once in any twelve (12) month period. Such elections shall only be held if a DAO member submits a valid proposal for new elections and that proposal is approved through the standard Referendum process. In the absence of a successful Referendum, existing Officers shall continue to serve in their roles. Officers may voluntarily resign their position at any time by providing notice to the DAO, and their responsibilities shall be reassigned or filled through the next scheduled election process.</p>
                    <div className="pl-4">
                      <p>i. In the event of a vacancy, an interim Officer may be appointed by consensus of a majority of Officers and Guardians. A public disclosure of the appointment shall be issued no later than the Moon Week following the appointment.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">5.13. Current Officers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <span className="font-bold block">Executive Director</span>
                      <a href="https://www.reddit.com/u/002_timmy" className="text-rcc-orange hover:underline">u/002_timmy</a>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <span className="font-bold block">Treasurer</span>
                      <a href="https://reddit.com/u/jwinterm" className="text-rcc-orange hover:underline">u/jwinterm</a>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <span className="font-bold block">Secretary</span>
                      <a href="https://www.reddit.com/u/MaeronTargaryen" className="text-rcc-orange hover:underline">u/MaeronTargaryen</a>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <span className="font-bold block">Marketing Officer</span>
                      <a href="https://reddit.com/u/mvea" className="text-rcc-orange hover:underline">u/mvea</a>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <span className="font-bold block">Moderation Officer</span>
                      <a href="https://reddit.com/u/Cryptomaximalist" className="text-rcc-orange hover:underline">u/Cryptomaximalist</a>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <span className="font-bold block">Technology & Infrastructure Officer</span>
                      <a href="https://www.reddit.com/u/rickribera93" className="text-rcc-orange hover:underline">u/rickribera93</a>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <span className="font-bold block">Community Engagement Officer</span>
                      <span className="text-slate-500">vacant</span>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <span className="font-bold block">Ecosystem Growth Officer</span>
                      <span className="text-slate-500">vacant</span>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <span className="font-bold block">Guardians</span>
                      <span>MKH</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article VI. Referendum & Voting.</h2>
              <p>6.1. Each Tokenholder shall have the right to propose changes to the Constitution (the “Proposal”) to be voted on by the Tokenholders participating in the decentralized governance (the “Referendum”), provided that the Tokenholder submitting the Proposal has</p>
              <div className="pl-4 space-y-2">
                <p>a. To submit a Proposal and initiate the Referendum, the Tokenholder has to satisfy one of two options:</p>
                <div className="pl-4 space-y-1">
                  <p>i. (Option 1/2) Have held at least 10,000 Moons for a minimum of 180 days</p>
                  <p>ii. (Option 2/2) Post a refundable proposal bond of 50,000 MOON to the Treasury. The bond is returned if quorum is reached; otherwise it remains in the Treasury.</p>
                  <p>iii. Publish a Draft Proposal, containing the proposed changes, the reasoning behind the Proposal, the importance of making changes to the Constitution, proposed implementation (including technical, financial, and governance implications), and other information that is specified in the requirements at <a href="https://reddit.com/r/CryptoCurrencyMeta" className="text-rcc-orange hover:underline">https://reddit.com/r/CryptoCurrencyMeta</a>;</p>
                </div>
              </div>
              <p>6.2. Each Token shall bear the voting weight as specified in Article III. Each Tokenholder shall have the right to vote on the submitted Proposal by casting one of the following votes:</p>
              <div className="pl-4 space-y-1">
                <p>a. For, in which case the Tokenholder supports the Proposal;</p>
                <p>b. Against, in which case the Tokenholder does not support the Proposal; or</p>
                <p>c. Abstain, in which case the Tokenholder neither supports nor rejects the Proposal, but their vote still counts for the required number of votes to make the Referendum binding (the “Quorum”).</p>
              </div>
              
              <h3 className="text-xl font-semibold mt-6 mb-4">6.3. Voting Thresholds</h3>
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
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article VII. Onchain and Off-Chain Implementation of Supported Proposals.</h2>
              <div className="space-y-2">
                <p>7.1. Supported Proposals that can be implemented in an automatic way by the means of smart contacts are implemented in an autonomous manner.</p>
                <p>7.2. Supported Proposals that cannot be implemented in an automatic way and require manual implementation shall be implemented by the managing body responsible for the respective function (normally, the executive managing body).</p>
                <p>7.3. Implementation of some Proposals may require the delegation of certain functions of the DAO to third parties. In this case, the implementing managing body shall be responsible for the relations with and the conduct of those third parties.</p>
                <p>7.4. The controlling managing body shall oversee the implementation of the supported Proposals.</p>
                <p>7.5. Implementation of some Proposals may require the allocation of funds from the Treasury. In this case, the Treasurer shall oversee that the funds are spent by the implementing body in a diligent manner.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article VIII. Representation of the DAO.</h2>
              <div className="space-y-2">
                <p>8.1. While the DAO itself is a decentralized entity and enjoys a distributed structure, there might arise a need to incorporate a legal entity to shield the Contributors from legal risks, raise capital, attract off-chain liquidity, interact with off-chain parties, or for another objective reason.</p>
                <div className="pl-4 space-y-1">
                  <p>a. In circumstances where incorporation requires Know-Your-Customer (KYC) compliance, the Executive Director of the DAO shall serve as the primary party responsible for completing any such requirements. Other Officers may voluntarily submit to KYC if they so choose. However, the Executive Director shall be obligated to fulfill the requirement to ensure that incorporation can proceed without delay.</p>
                  <p>b. KYC documentation shall be handled confidentially and retained only as required by applicable law and counterparties; the DAO shall not publicly disclose personal information.</p>
                </div>
                <p>8.2. Creating those legal entities and the allocation of resources to them from the Treasury shall be done by the means of the Referendum and requiring modification to the Constitution.</p>
                <div className="pl-4 space-y-1">
                  <p>a. In the event that the DAO Treasury does not hold sufficient funds to meet its operational or contractual obligations, the DAO may initiate a community raise or seek loans from individual DAO members to cover the shortfall. The terms and conditions of such loans, including any applicable interest rates and fees, shall be determined and approved through a DAO Referendum.</p>
                </div>
                <p>8.3. Those legal entities shall at all times act in the interests of the DAO and only within the scope of the DAO’s functions delegated to them.</p>
                <p>8.4. If the created legal entities shall require for one or more of their own bodies to be filled, the Tokenholders shall vote on which Contributor to appoint at the vacant position on the Referendum.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article IX. Decentralized Jurisdiction. Applicable Law & Dispute Resolution.</h2>
              <div className="space-y-2">
                <p>9.1. Any relations amongst the Participants shall fall under the jurisdiction determined as per their own personal laws.</p>
                <p>9.2. Relations arising from adopting, amending, or enforcing this Constitution shall be governed by the laws of the Marshall Islands.</p>
                <p>9.3. Any disputes about the adoption, amendment, or enforcement of the Constitution shall be attempted to be resolved by the parties to a dispute by negotiations in good faith. If the disputing parties are unable to do so in 60 days after the dispute’s commencement, it shall be resolved in the Marshall Islands.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article X. Advertising Operations of the DAO</h2>
              <div className="space-y-2">
                <p>10.1. The DAO manages communities on social media and news aggregation platforms via moderation (see Article XI).</p>
                <p>10.2. The DAO offers advertising in the form of featured guest interviews (ask-me-anythings (AMAs)), community spotlights (banners) and other advertising space rental, featured announcements, featured polls, community sponsorship and other offerings.</p>
                <p>10.3. The DAO shall elect a Marketing Officer to lead and manage these efforts, as detailed in Article V Section 5.7. Other Officers are encouraged to support these efforts.</p>
                <p>10.4. The advertising and governance services described herein apply across the full r/CryptoCurrency network, including but not limited to r/CryptoCurrency, r/CryptoMarkets, r/CryptoCurrencyMoons, r/CryptoCurrencyMeta, r/CryptoTechnology, r/CryptoHelp, and any other subreddits recognized by the DAO.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article XI. Moderation Operations of the DAO</h2>
              <div className="space-y-2">
                <p>11.1. In order to foster healthy communities where there is an opportunity for Contributors to participate and for advertisers to communicate directly with Participants via AMAs and other targeted messages, the DAO provides moderation services.</p>
                <p>11.2. Moderation services are provided to ensure compliance with community guidelines, platform Terms of Service, maintain civility, and protect the integrity of the communities.</p>
                <p>11.3. The moderation team for each community will be selected by a combination of the community and the DAO. The DAO will be allowed to provide at least one moderator by vote or other agreement.</p>
                <p>11.4. For the DAO provided moderator(s), Contributors may nominate and vote for potential moderators following a transparent selection process, as defined by nomination and voting processes outlined for Officers in Article V Section 5.1.c.</p>
                <p>11.5. The moderation selection process for the remaining community moderators shall be at the discretion of the community.</p>
                <p>11.6. Moderators are responsible for enforcing community guidelines, addressing possible violations of the Terms of Service for the website or social media app that the community exists on, and maintaining a positive environment.</p>
                <p>11.7. Moderators must act impartially, fairly, and without bias, ensuring all actions are in the best interest of the community.</p>
                <p>11.8. The DAO will provide training and resources to moderators to ensure they are well-equipped to perform their duties effectively.</p>
                <p>11.9. Conflict resolution between moderators and community members shall adhere to the process defined in Article IX.</p>
                <p>11.10. Appeals against moderation decisions can be submitted to a designated committee within the DAO for review.</p>
                <p>11.11. Moderators provided by the DAO will serve for a one year term, while community moderator terms will be governed by their own specific community moderation team.</p>
                <p>11.12. At the end of each term, moderators may be reappointed or replaced based on community feedback and DAO assessment.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article XII. Contributor Rewards</h2>
              <div className="space-y-2">
                <p>12.1. Reddit Inc. formerly minted Tokens according to a defined emission schedule to reward Contributors to the Ecosystem based on their participation in and contributions to r/CryptoCurrency. Rewards were initially proportional to the number of upvotes that a user’s Reddit account received within the r/CryptoCurrency subreddit.</p>
                <p>12.2. The Project shall reward Contributors across all communities that it moderates.</p>
                <p>12.3. The rewards for each community will be independently determined by a vote requiring 66+% approval from Tokenholders.</p>
                <p>12.4. The rewards accorded to any community may also be rescinded by the DAO at any time by a vote requiring 66+% approval from Tokenholders.</p>
                <p>12.5. Contributor rewards shall continue for at least one (1) year once established. Rewards will not be altered or discontinued during this period except by DAO Referendum. Thereafter, any changes to Contributor Rewards shall only take effect following a successful DAO vote.</p>
                <p>12.6. External projects may provide their own tokens as rewards to members of CCMOON DAO.</p>
                <div className="pl-4 space-y-1">
                  <p>a. Eligibility: Only projects that have conducted their Token Generation Event (TGE) at least six (6) months prior will be eligible to offer rewards, ensuring that tokens have an established track record.</p>
                  <p>b. Execution: The specific terms of distribution will be arranged directly with DAO Officers in coordination with the Moderators. This approach allows agreements to be finalized quickly and efficiently, minimizing friction for partners while ensuring the DAO can capture value in real time.</p>
                  <p>c. Governance: Because these rewards are entirely additive and do not expose members to risk, they will not require a DAO-wide Referendum. Instead, they will be implemented by consensus among Officers and Moderators, with transparency to the community.</p>
                  <p>d. Community Safeguards: Officers and Moderators will continue to prioritize community safety and alignment, with the understanding that these programs represent pure value-add opportunities for DAO members.</p>
                  <p>e. DAO Compensation: The DAO shall retain twenty percent (20%) of the total tokens provided by the partner project as compensation. These tokens will be directed into the DAO Treasury and allocated through governance proposals and community vote.</p>
                  <p>f. Disclosure: A public post shall specify token amount, schedule, eligibility, and the DAO’s 20% Treasury allocation before distribution commences.</p>
                  <p>g. Vesting: The DAO shall self-impose a 90-day vesting cliff before tokens can be used from the Treasury. Partners are welcome to subject DAO reward tranches to a linear vesting should they wish to do so.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-rcc-orange">Article XIII. Intellectual Property</h2>
              <div className="space-y-2">
                <p>12.7. Trademarks, logos, and other distinctive assets used by the DAO are community assets. Use by third parties requires written permission from the Officers (in consultation with Moderators) and must adhere to brand guidelines.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Background>
  );
}
