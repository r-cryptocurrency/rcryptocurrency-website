import axios from 'axios';

export async function fetchCoinGeckoData() {
  console.log('Fetching CoinGecko data...');
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=moon&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true'
    );
    const data = response.data.moon;
    console.log('Moon Price:', data.usd);
    // TODO: Save to database or cache
    return data;
  } catch (error) {
    console.error('Error fetching CoinGecko data:', error);
  }
}
