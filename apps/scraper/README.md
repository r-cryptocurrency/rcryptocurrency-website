# Reddit Scraper (`apps/scraper`)

A service that scrapes r/CryptoCurrency for sentiment analysis and project mentions.

## Features
- **Public JSON Scraping**: Uses `https://www.reddit.com/r/CryptoCurrency/new.json` to avoid OAuth complexity and rate limits.
- **Sentiment Analysis**: Uses `natural` (NLP library) to score post titles and comments.
- **Mention Tracking**: Identifies mentions of BTC, ETH, MOON, and other top projects.

## Configuration
Configuration is handled via the **root** `.env` file. Currently, no specific environment variables are required for the scraper, but it shares the database configuration.

## Schedule
The scraper runs 4 times per hour to capture both breaking news and trending discussions:
- **00:00**: Scrapes `new` posts (Catch breaking news).
- **00:15**: Scrapes `top` posts (Update scores for daily best).
- **00:30**: Scrapes `new` posts.
- **00:45**: Scrapes `hot` posts (Track trending topics).

## How it Works
1.  Polls the public JSON endpoints (`new.json`, `hot.json`, `top.json`).
2.  Upserts `Submission` and `RedditUser` records in the database.
3.  Fetches comments for each new post.
4.  Analyzes text and stores `RedditComment` and `Mention` records.
5.  **Robustness**: Implements retry logic with exponential backoff to handle database concurrency issues.

## Database Schema

The Scraper app stores data in the following tables:

### `RedditPost`
| Column | Type | Description |
|--------|------|-------------|
| `id` | String (PK) | Reddit Post ID (e.g., "t3_xyz"). |
| `title` | String | Post title. |
| `author` | String | Reddit username of the author. |
| `score` | Int | Net upvotes. |
| `sentiment` | Float? | Calculated sentiment score (-1.0 to 1.0). |
| `createdUtc` | DateTime | When the post was created on Reddit. |

### `RedditComment`
| Column | Type | Description |
|--------|------|-------------|
| `id` | String (PK) | Reddit Comment ID. |
| `postId` | String (FK) | ID of the parent post. |
| `body` | String | The comment text. |
| `sentiment` | Float? | Calculated sentiment score. |

### `ProjectMention`
| Column | Type | Description |
|--------|------|-------------|
| `id` | Int (PK) | Auto-incrementing ID. |
| `projectId` | String | The ticker/name mentioned (e.g., "BTC", "MOON"). |
| `sentiment` | Float? | Sentiment context of the specific mention. |
| `postId` | String? | Linked Post ID (if mentioned in a post). |
| `commentId` | String? | Linked Comment ID (if mentioned in a comment). |

## Configuration
No environment variables are currently required. See `.env.example`.

## Development

```bash
pnpm dev --filter=scraper
```
