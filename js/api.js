document.addEventListener("DOMContentLoaded", function() {
        $.getJSON('https://www.reddit.com/r/cryptocurrency/about.json', function(data) {
                document.getElementById('usersActive').innerHTML = data.data.accounts_active.toLocaleString('en-US');
                document.getElementById('currentSubscribers').innerHTML += data.data.subscribers.toLocaleString('en-US');
        });
        $.getJSON('https://api.coingecko.com/api/v3/coins/moon?market_data=true&community_data=false&developer_data=false&sparkline=false', function(data) {
                document.getElementById('volume-moon').innerHTML += data.tickers[0].converted_volume.usd.toLocaleString('en-US');
                document.getElementById('price-moon').innerHTML += data.market_data.current_price.usd.toLocaleString('en-US');
                document.getElementById('circulatingsupply-moon').innerHTML += data.market_data.circulating_supply.toLocaleString('en-US');
                document.getElementById('marketcap-moon').innerHTML += data.market_data.market_cap.usd.toLocaleString('en-US');
        });
});