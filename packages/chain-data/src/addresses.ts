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
    sushiSwapV2: "0xd6c821b282531868721b41badca1f1ce471f43c5", // MOON/ETH
    rcpSwap: "0x722E8BDD2CE80A4422E880164F2079488E115365"
  },
  one: {
    camelotV3: "0x5e27a422ec06a57567a843fd65a1bbb06ac19fc0", // MOON/ETH
    uniswapV3: "0x285b461B3d233ab24C665E9FbAF5B96352E3ED07", // MOON/USDC
    uniswapV4Manager: "0x360E68faCcca8cA495c1B759Fd9EEe466db9FB32"
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
