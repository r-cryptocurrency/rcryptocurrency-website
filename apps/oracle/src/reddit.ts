import axios from 'axios';

export async function fetchRedditStats() {
  console.log('Fetching Reddit stats...');
  try {
    const response = await axios.get('https://www.reddit.com/r/cryptocurrency/about.json');
    const data = response.data.data;
    console.log('Subscribers:', data.subscribers);
    console.log('Active Users:', data.active_user_count);
    // TODO: Save to database
    return {
      subscribers: data.subscribers,
      activeUsers: data.active_user_count
    };
  } catch (error) {
    console.error('Error fetching Reddit stats:', error);
  }
}
