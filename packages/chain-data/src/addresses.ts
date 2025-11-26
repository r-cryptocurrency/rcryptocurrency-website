export const MOON_CONTRACTS = {
  arbitrumNova: "0x0057Ac2d777797d31CD3f8f13bF5e927571D6Ad0",
  arbitrumOne: "0x24404DC041d74cd03cFE28855F555559390C931b",
  ethereum: "0xb2490e357980ce57bf5745e181e537a64eb367b1", 
} as const;

export const BRIDGE_CONTRACTS = {
  celer: {
    arbitrumOne: "0x1619DE6B6B20eD217a58d00f37B9d47C7663feca",
    arbitrumNova: "0xb3833Ecd19D4Ff964fA7bc3f8aC070ad5e360E56",
    ethereum: "0x5427FEFA711Eff984124bFBB1AB6fbf5E3DA1820" 
  }
} as const;

export const LIQUIDITY_POOLS = {
  nova: {
    sushiSwapV2: "0x04860B1B394c42d9234600BA297863698C6B8475", // MOON/ETH
    rcpSwap: "0x722E8BDD2CE80A4422E880164F2079488E115365"
  },
  one: {
    camelot: "0x...", // Needs dynamic resolution or factory lookup
  }
} as const;

export const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "from", "type": "address"},
      {"indexed": true, "name": "to", "type": "address"},
      {"indexed": false, "name": "value", "type": "uint256"}
    ],
    "name": "Transfer",
    "type": "event"
  }
] as const;
