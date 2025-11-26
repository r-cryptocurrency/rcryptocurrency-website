import natural from 'natural';

const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
const tokenizer = new natural.WordTokenizer();

export function analyzeSentiment(text: string): number {
  if (!text || !text.trim()) return 0;
  const tokens = tokenizer.tokenize(text);
  if (!tokens || tokens.length === 0) return 0;
  const score = analyzer.getSentiment(tokens);
  return isNaN(score) ? 0 : score;
}

// Keywords from ccmoon_scraper.py
const PROJECT_KEYWORDS: Record<string, string[]> = {
    "BONK": ["bonk", "$bonk", "bonkfun", "bonk.fun", "bonk dat"],
    "Polygon": ["polygon", "matic", "$matic", "pol", "$pol", "agglayer", "sandeep"],
    "Ethereum": ["ethereum", "eth", "$eth", "vitalik"],
    "Solana": ["solana", "sol", "$sol"],
    "Bitcoin": ["bitcoin", "btc", "$btc"],
    "Arbitrum": ["arbitrum", "arb", "$arb"],
    "Ripple": ["ripple", "xrp", "$xrp", "xrpl"],
    "Binance": ["binance", "bnb", "$bnb", "cz"],
    "Coinbase": ["coinbase", "$coin", "Brian armstrong"],
    "Base chain": ["base", "$base", "jesse pollak"],
    "USDC": ["usdc", "$usdc"],
    "USDT": ["usdt", "$usdt", "tether"],
    "DAI": ["dai", "$dai"],
    "Tron": ["tron", "trx", "$trx", "justin sun"],
    "Dogecoin": ["dogecoin", "doge", "$doge"],
    "Cardano": ["cardano", "ada", "$ada", "hoskinson"],
    "Hyperliquid": ["hyperliquid", "hl", "$hype"],
    "Zcash": ["zcash", "zec", "$zec"],
    "Chainlink": ["chainlink", "$link"],
    "Stellar": ["stellar", "xlm", "$xlm"],
    "Litecoin": ["litecoin", "ltc", "$ltc", "charlie lee", "charlie"],
    "Monero": ["monero", "xmr", "$xmr"],
    "Avalanche": ["avalanche", "avax", "$avax"],
    "Hedera": ["hedera", "hbar", "$hbar"],
    "Sui": ["sui", "$sui"],
    "Shiba Inu": ["shiba", "shib", "$shib", "shiba inu"],
    "Polkadot": ["polkadot", "$dot"],
    "Uniswap": ["uniswap", "uni", "$uni"],
    "Toncoin": ["toncoin", "$ton"],
    "Cronos": ["cronos", "cro", "$cro", "crypto.com"],
    "Mantle": ["mantle", "mnt", "$mnt"],
    "World Liberty Finance": ["world liberty finance", "wlf"],
    "Astar": ["astar", "astr", "$astr"],
    "Near Protocol": ["$near", "near protocol"],
    "Internet Computer": ["icp", "$icp", "internet computer"],
};

export function findProjectMentions(text: string): string[] {
  const lowerText = text.toLowerCase();
  const mentions = new Set<string>();

  for (const [project, keywords] of Object.entries(PROJECT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        mentions.add(project);
        break; // Found one keyword for this project, move to next project
      }
    }
  }

  return Array.from(mentions);
}
