import os
import json
import re
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta, timezone, date

import pandas as pd
import praw
from prawcore import Requestor
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# ==========================================
# GLOBALS: API CALLS
# ==========================================

CALLS = 0
RUN_START = datetime.now(timezone.utc)


class CountingRequestor(Requestor):
    def request(self, *args, **kwargs):
        global CALLS
        CALLS += 1
        return super().request(*args, **kwargs)


# ==========================================
# PRAW / REDDIT AUTH CONFIG
# ==========================================

CLIENT_ID = "9vqPC1k1ACXpn6urp-CrgA"
CLIENT_SECRET = "OG2goW64pmhAD8Ihry9zRtDetz2mMw"
USER_AGENT = "ccmoon snapshot script by /u/002_timmy"

# ==========================================
# SCRAPER CONFIG
# ==========================================

SUBREDDIT_NAME = "CryptoCurrency"

MAX_POSTS = 800
MAX_COMMENTS_PER_POST = 300

USE_FIXED_DATES = True
START_DATE_STR = "2025-11-10"
END_DATE_STR = "2025-12-08"
DAYS_BACK = 1

DB_PATH = Path("moon_data.db")

# ==========================================
# MOON EPOCH CONFIG (28-day epochs)
# ==========================================

EPOCH_LENGTH_DAYS = 28
EPOCH_REFERENCE_NUMBER = 69
EPOCH_REFERENCE_START = date(2025, 11, 10)  # start of Epoch 69
MIN_EPOCH_NUMBER = 1

# ==========================================
# PROJECT KEYWORDS (keep bare tickers like POL, SOL, ARB)
# ==========================================

PROJECT_KEYWORDS = {
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
    "Aave": ["aave", "$aave"],
    "OKX": ["okx", "okb", "$okb"],
    "Aptos": ["aptos", "apt", "$apt"],
    "Pepe": ["pepe", "$pepe"],
    "KuCoin": ["kucoin", "kcs", "$kcs"],
    "Cosmos": ["cosmos", "atom", "$atom"],
    "Algorand": ["algorand", "algo", "$algo"],
    "Filecoin": ["filecoin", "fil", "$fil"],
    "VeChain": ["vechain", "vet", "$vet"],
    "Starknet": ["starknet", "strk", "$strk"],
    "Pump.fun": ["pump.fun", "pumpfun", "$pump"],
    "Flare": ["flare", "flr", "$flr"],
    "Sei": ["sei", "$sei"],
    "Jupiter": ["jupiter", "jup", "$jup"],
    "Pudgy Penguins": ["pudgy", "pengu", "penguin", "pudgy penguins"],
    "Abstract": ["abstract"],
    "Optimism": ["optimism", "$op"],
    "Immutable": ["immutable", "imx", "$imx"],
    "Injective": ["injective", "inj", "$inj"],
    "Celestia": ["celestia", "tia", "$tia"],
    "Curve": ["curve", "crv", "$crv"],
    "Morpho": ["morpho"],
    "The Graph": ["the graph", "grt", "$grt"],
    "Tezos": ["tezos", "xtz", "$xtz"],
    "Gala Games": ["gala", "$gala", "gala games"],
    "Sonic": ["sonic", "$sonic"],
    "Raydium": ["raydium", "ray", "$ray"],
    "Katana": ["katana", "kat", "$kat", "vkat", "avkat"],
}

# ==========================================
# PROJECT CATEGORIES
# ==========================================

PROJECT_CATEGORIES = {
    # Layer 1 blockchains
    "Bitcoin": "L1",
    "Ethereum": "L1",
    "Ripple": "L1",
    "Solana": "L1",
    "Cardano": "L1",
    "Avalanche": "L1",
    "Near Protocol": "L1",
    "Polkadot": "L1",
    "Algorand": "L1",
    "Internet Computer": "L1",
    "Aptos": "L1",
    "Sui": "L1",
    "Tezos": "L1",
    "Flow": "L1",
    "Hedera": "L1",
    "Stellar": "L1",
    "Cosmos": "L1",
    "Algorand": "L1",
    "Tron": "L1",
    "Filecoin": "L1",
    "VeChain": "L1",
    "Zcash": "L1",
    "Monero": "L1",
    "Toncoin": "L1",
    "Litecoin": "L1",
    "Sei": "L1",

    # Layer 2 / Rollups
    "Polygon": "L2",
    "Arbitrum": "L2",
    "Base chain": "L2",
    "Optimism": "L2",
    "Immutable": "L2",
    "Base": "L2",
    "Starknet": "L2",
    "Mantle": "L2",
    "Celestia": "L2",
    "Abstract": "L2",
    "Astar": "L2",
    "Katana": "L2",

    # Stablecoins
    "USDT": "Stablecoin",
    "USDC": "Stablecoin",
    "DAI": "Stablecoin",

    # Exchanges + CEX tokens
    "Binance": "Exchange",
    "Coinbase": "Exchange",
    "Cronos": "Exchange",
    "KuCoin": "Exchange",
    "OKX": "Exchange",

    # Meme coins
    "BONK": "Meme",
    "Dogecoin": "Meme",
    "Shiba Inu": "Meme",
    "Pepe": "Meme",
    "Sonic": "Meme",
    "Pudgy Penguins": "Meme",

    # DeFi / Infrastructure
    "Chainlink": "Infrastructure",
    "The Graph": "Infrastructure",
    "Filecoin": "Storage",
    "Uniswap": "DeFi",
    "Curve": "DeFi",
    "Aave": "DeFi",
    "Injective": "DeFi",
    "Morpho": "DeFi",
    "Hyperliquid": "DeFi",
    "Pump.fun": "DeFi",
    "Jupiter": "DeFi",
    "Raydium": "DeFi",
    "Flare": "DeFi",

    # Storage / Compute
    "Internet Computer": "Compute",

    # Other Protocols / Ecosystems
    "Gala Games": "Gaming",
    "World Liberty Finance": "L2",  # Cutting edge rollup ecosystem
}


# ==========================================
# SENTIMENT ENGINE
# ==========================================

POSITIVE_WORDS = {
    "bull", "bullish", "bullrun", "bull run",
    "mooning", "moon", "pump", "pumping",
    "rip", "ripping", "spike", "spiking", "breakout",
    "ath", "all time high", "undervalued", "blue chip",
    "strong fundamentals", "green day", "squeeze", "short squeeze",
    "bear trap", "bears getting rekt", "bears getting wrecked",
    "bears running out of crypto", "pump soon", "going parabolic",
}

NEGATIVE_WORDS = {
    "crash", "crashing", "dump", "dumping",
    "rug", "rugged", "rugpull", "rug pull",
    "scam", "ponzi", "trash", "dead", "worthless",
    "exit liquidity", "red day", "selloff", "sell-off",
    "nuked", "going down", "bleeding", "down only",
    "bear market",
}

VADER = SentimentIntensityAnalyzer()


def clean_text(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"\[.*?\]\(.*?\)", "", text)  # markdown links
    return text.strip()


def tokenize(text: str):
    # This gives tokens like ["sol", "is", "good"], ["i", "sold", "sol"] etc.
    return re.findall(r"[A-Za-z0-9$#@']+", text.lower())


def compute_sentiment_raw(text: str) -> int:
    text = clean_text(text)
    if not text:
        return 50

    compound = VADER.polarity_scores(text)["compound"]  # [-1, 1]

    base = 50 + 50 * compound

    pos_hits = sum(1 for w in POSITIVE_WORDS if w in text)
    neg_hits = sum(1 for w in NEGATIVE_WORDS if w in text)
    lex_nudge = (pos_hits * 5) - (neg_hits * 5)
    lex_nudge = max(-10, min(10, lex_nudge))

    raw = base + lex_nudge
    return int(max(0, min(100, raw)))


def compute_sentiment_adjusted(sentiment_raw: int, adjusted_score: int) -> int:
    centered = sentiment_raw - 50
    s = adjusted_score

    if s >= 50:
        m = 1.5
    elif s >= 10:
        m = 1.3
    elif s >= 3:
        m = 1.1
    elif s > -3:
        m = 1.0
    elif s > -10:
        m = 1.2
    else:
        m = 1.4

    if s <= -5:
        sign_factor = -1.0
    elif s < 0:
        sign_factor = 0.5
    else:
        sign_factor = 1.0

    adj_centered = centered * m * sign_factor
    adjusted = 50 + adj_centered
    return int(max(0, min(100, adjusted)))


def compute_sentiment_label(sentiment_raw: int) -> str:
    if sentiment_raw >= 62:
        return "positive"
    elif sentiment_raw <= 38:
        return "negative"
    else:
        return "neutral"


# ==========================================
# PROJECT SENTIMENT HELPERS (STRICT TOKEN/Phrase MATCHING)
# ==========================================

def _count_keyword_hits_in_tokens(kw: str, tokens, text_clean: str) -> int:
    """
    Strict matching:
      - For single-word keywords (e.g. 'pol', 'sol', 'arb'):
            count occurrences where token == kw
      - For multi-word phrases ('justin sun', 'charlie lee'):
            count occurrences where token sequence == phrase tokens

    This guarantees:
      - 'pol' does NOT match 'police'
      - 'sol' does NOT match 'sold'
      - 'arb' does NOT match 'garbage'
    """
    kw = kw.lower()

    if " " in kw:
        # Phrase match on token sequences
        phrase_tokens = kw.split()
        n = len(phrase_tokens)
        if n == 0:
            return 0
        count = 0
        for i in range(len(tokens) - n + 1):
            if tokens[i:i + n] == phrase_tokens:
                count += 1
        return count
    else:
        # Single-token keyword: strict equality with token
        return sum(1 for t in tokens if t == kw)


def compute_project_sentiments(full_text: str, adjusted_score: int, project_keywords):
    """
    Return:
      projects_mentioned: list[str]
      project_scores: dict[project -> karma share]
      project_sentiments: dict[project -> sentiment_adjusted (0–100)]
    """
    text_clean = clean_text(full_text)
    if not text_clean:
        return [], {}, {}

    tokens = tokenize(text_clean)

    # Count per-project hits using strict matching
    proj_counts = {}
    for project, kw_list in project_keywords.items():
        project_count = 0
        for kw in kw_list:
            project_count += _count_keyword_hits_in_tokens(kw, tokens, text_clean)
        if project_count > 0:
            proj_counts[project] = project_count

    if not proj_counts:
        return [], {}, {}

    projects_mentioned = list(proj_counts.keys())
    total_mentions = sum(proj_counts.values())

    project_scores = {
        p: adjusted_score * (proj_counts[p] / total_mentions)
        for p in projects_mentioned
    }

    global_raw = compute_sentiment_raw(text_clean)
    global_adj = compute_sentiment_adjusted(global_raw, adjusted_score)

    if len(projects_mentioned) == 1:
        p = projects_mentioned[0]
        return projects_mentioned, project_scores, {p: global_adj}

    project_sentiments = {}
    for p in projects_mentioned:
        weight = proj_counts[p] / total_mentions
        project_sentiments[p] = int(
            max(0, min(100, 50 + (global_adj - 50) * (0.8 + 0.2 * weight)))
        )

    return projects_mentioned, project_scores, project_sentiments


# ==========================================
# TIME WINDOW & MOON EPOCH
# ==========================================

def get_time_window():
    now_utc = datetime.now(timezone.utc)

    if USE_FIXED_DATES:
        start_dt = datetime.strptime(
            START_DATE_STR + " 00:00:00", "%Y-%m-%d %H:%M:%S"
        ).replace(tzinfo=timezone.utc)
        end_dt = datetime.strptime(
            END_DATE_STR + " 23:59:59", "%Y-%m-%d %H:%M:%S"
        ).replace(tzinfo=timezone.utc)
        label = f"{START_DATE_STR}_to_{END_DATE_STR}"
    else:
        end_dt = now_utc
        start_dt = now_utc - timedelta(days=DAYS_BACK)
        label = f"last{DAYS_BACK}d"

    return start_dt, end_dt, label


def get_moon_epoch_for_datetime(dt: datetime):
    d = dt.date()
    delta_days = (d - EPOCH_REFERENCE_START).days
    epoch_offset = delta_days // EPOCH_LENGTH_DAYS
    epoch_number = EPOCH_REFERENCE_NUMBER + epoch_offset

    if epoch_number < MIN_EPOCH_NUMBER:
        return None

    return str(epoch_number)


# ==========================================
# BASIC HELPERS
# ==========================================

def classify_content_type(submission_or_comment):
    if hasattr(submission_or_comment, "is_self"):
        if submission_or_comment.is_self:
            return "text"
        url = getattr(submission_or_comment, "url", "") or ""
        if any(
            url.lower().endswith(ext)
            for ext in [".jpg", ".jpeg", ".png", ".gif", ".webp"]
        ):
            return "image"
        return "link"
    return "text"


def is_rewards_exempt(author_name):
    if author_name is None:
        return True
    name = str(author_name).lower()
    if name in ("[deleted]", "coinfeeds-bot", "iowxss6_bot"):
        return True
    return False


def adjusted_post_score(raw_score, flair_text):
    if not flair_text:
        return raw_score
    flair_lower = flair_text.lower()
    if "meme" in flair_lower:
        return int(round(raw_score * 0.0025))
    return raw_score


# ==========================================
# REDDIT FETCHING
# ==========================================

def fetch_reddit_data():
    start_utc, end_utc, range_label = get_time_window()

    reddit = praw.Reddit(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        user_agent=USER_AGENT,
        requestor_class=CountingRequestor,
    )
    reddit.read_only = True
    subreddit = reddit.subreddit(SUBREDDIT_NAME)

    print(f"Collecting from r/{SUBREDDIT_NAME} between {start_utc} and {end_utc} (UTC)")
    if MAX_POSTS:
        print(f"Limit: {MAX_POSTS} posts via .new()")
    else:
        print("Limit: Reddit default (~1000) posts via .new()")

    rows = []
    count_posts = 0
    count_comments = 0

    for submission in subreddit.new(limit=MAX_POSTS):
        created_utc = datetime.fromtimestamp(submission.created_utc, tz=timezone.utc)
        if not (start_utc <= created_utc <= end_utc):
            continue

        author_name = str(submission.author) if submission.author else "[deleted]"
        if author_name.lower() == "iowxss6_bot":
            continue  # ignore this bot entirely

        count_posts += 1

        post_link = f"https://reddit.com{submission.permalink}"
        flair_text = submission.link_flair_text or ""
        content_type = classify_content_type(submission)
        mod_flag = 1 if submission.distinguished == "moderator" else 0
        rewards_exempt_flag = 1 if is_rewards_exempt(author_name) else 0

        adjusted_score_val = adjusted_post_score(submission.score, flair_text)
        epoch_str = get_moon_epoch_for_datetime(created_utc)

        post_text_full = f"{submission.title} {(submission.selftext or '')}"
        s_raw = compute_sentiment_raw(post_text_full)
        s_adj = compute_sentiment_adjusted(s_raw, adjusted_score_val)
        s_label = compute_sentiment_label(s_raw)

        proj_mentions, proj_scores, proj_sentiments = compute_project_sentiments(
            post_text_full, adjusted_score_val, PROJECT_KEYWORDS
        )

        rows.append({
            "author": author_name,
            "post_link": post_link,
            "comment_link": "",
            "id": submission.id,
            "parent_post_id": "",
            "created_date": created_utc.strftime("%Y-%m-%d"),
            "moon_week": epoch_str,
            "score": submission.score,
            "Adjusted Score": adjusted_score_val,
            "post_flair_type": flair_text,
            "subreddit": submission.subreddit.display_name,
            "post_type": "post",
            "title_comment": submission.title,
            "content_type": content_type,
            "mod_distinguished": mod_flag,
            "Rewards Exempt": rewards_exempt_flag,
            "sentiment_raw": s_raw,
            "sentiment_adjusted": s_adj,
            "sentiment_label": s_label,
            "project_mentions": json.dumps(proj_mentions),
            "project_scores": json.dumps(proj_scores),
            "project_sentiments": json.dumps(proj_sentiments),
        })

        submission.comments.replace_more(limit=8)

        comment_count_for_post = 0
        for comment in submission.comments.list():
            if comment_count_for_post >= MAX_COMMENTS_PER_POST:
                break

            c_created_utc = datetime.fromtimestamp(comment.created_utc, tz=timezone.utc)
            if not (start_utc <= c_created_utc <= end_utc):
                continue

            c_author_name = str(comment.author) if comment.author else "[deleted]"
            if c_author_name.lower() == "iowxss6_bot":
                continue  # skip this bot

            comment_count_for_post += 1
            count_comments += 1

            comment_link = f"https://reddit.com{comment.permalink}"
            c_mod_flag = 1 if comment.distinguished == "moderator" else 0
            c_rewards_exempt_flag = 1 if is_rewards_exempt(c_author_name) else 0

            adjusted_comment_score = comment.score
            c_epoch_str = get_moon_epoch_for_datetime(c_created_utc)

            comment_text_full = comment.body or ""
            c_raw = compute_sentiment_raw(comment_text_full)
            c_adj = compute_sentiment_adjusted(c_raw, adjusted_comment_score)
            c_label = compute_sentiment_label(c_raw)

            c_proj_mentions, c_proj_scores, c_proj_sentiments = compute_project_sentiments(
                comment_text_full, adjusted_comment_score, PROJECT_KEYWORDS
            )

            rows.append({
                "author": c_author_name,
                "post_link": post_link,
                "comment_link": comment_link,
                "id": comment.id,
                "parent_post_id": submission.id,
                "created_date": c_created_utc.strftime("%Y-%m-%d"),
                "moon_week": c_epoch_str,
                "score": comment.score,
                "Adjusted Score": adjusted_comment_score,
                "post_flair_type": flair_text,
                "subreddit": submission.subreddit.display_name,
                "post_type": "comment",
                "title_comment": comment.body,
                "content_type": "text",
                "mod_distinguished": c_mod_flag,
                "Rewards Exempt": c_rewards_exempt_flag,
                "sentiment_raw": c_raw,
                "sentiment_adjusted": c_adj,
                "sentiment_label": c_label,
                "project_mentions": json.dumps(c_proj_mentions),
                "project_scores": json.dumps(c_proj_scores),
                "project_sentiments": json.dumps(c_proj_sentiments),
            })

    print(f"Collected {count_posts} posts and {count_comments} comments.")
    df = pd.DataFrame(rows)
    if df.empty:
        print("WARNING: No data collected for the given time window.")
    return df, range_label


# ==========================================
# USER SUMMARY
# ==========================================

def build_user_summary(df):
    if df.empty:
        return pd.DataFrame(
            columns=["Username", "comment_score", "post_score", "Total Score"]
        )

    posts = df[df["post_type"] == "post"]
    comments = df[df["post_type"] == "comment"]

    post_scores = posts.groupby("author")["Adjusted Score"].sum().rename("post_score")
    comment_scores = comments.groupby("author")["Adjusted Score"].sum().rename("comment_score")

    summary = pd.concat([post_scores, comment_scores], axis=1).fillna(0).reset_index()
    summary["Total Score"] = summary["post_score"] + summary["comment_score"]
    summary = summary.rename(columns={"author": "Username"})
    summary = summary.sort_values("Total Score", ascending=False).reset_index(drop=True)
    return summary


# ==========================================
# DB HELPERS: PROJECTS & MENTIONS
# ==========================================

def upsert_projects_and_keywords(cur):
    for project_name, keyword_list in PROJECT_KEYWORDS.items():
        slug = project_name.lower().replace(" ", "_")
        cur.execute(
            """
            INSERT INTO projects (name, slug)
            VALUES (?, ?)
            ON CONFLICT(slug) DO UPDATE SET name = excluded.name
            """,
            (project_name, slug),
        )

    cur.execute("SELECT id, slug FROM projects")
    project_id_by_slug = {slug: pid for (pid, slug) in cur.fetchall()}

    for project_name, keyword_list in PROJECT_KEYWORDS.items():
        slug = project_name.lower().replace(" ", "_")
        project_id = project_id_by_slug[slug]
        for kw in keyword_list:
            kw_lower = kw.lower()
            cur.execute(
                """
                INSERT INTO project_keywords (project_id, keyword, is_active)
                VALUES (?, ?, 1)
                ON CONFLICT(project_id, keyword) DO UPDATE SET is_active = 1
                """,
                (project_id, kw_lower),
            )


def record_project_mentions(cur, df):
    """
    Strict matching for database-level project_mentions as well.
    Uses same logic as compute_project_sentiments to avoid
    'police' -> POL, 'sold' -> SOL, 'garbage' -> ARB.
    """
    if df.empty:
        return

    cur.execute(
        """
        SELECT pk.project_id, pk.keyword
        FROM project_keywords pk
        WHERE pk.is_active = 1
        """
    )
    rows = cur.fetchall()
    if not rows:
        return

    keywords_by_project = {}
    for project_id, keyword in rows:
        keywords_by_project.setdefault(project_id, []).append(keyword.lower())

    mention_rows = []

    for _, row in df.iterrows():
        author = str(row.get("author") or "").lower()
        if author == "iowxss6_bot":
            continue

        raw_text = row.get("title_comment") or ""
        if not raw_text:
            continue

        text_clean = clean_text(raw_text)
        tokens = tokenize(text_clean)

        reddit_id = row["id"]
        created_date = row["created_date"]
        karma_score = int(row["score"])
        post_type = row["post_type"]

        proj_counts = {}
        total_hits = 0

        for project_id, kw_list in keywords_by_project.items():
            count_for_project = 0
            for kw in kw_list:
                count_for_project += _count_keyword_hits_in_tokens(kw, tokens, text_clean)
            if count_for_project > 0:
                proj_counts[project_id] = count_for_project
                total_hits += count_for_project

        if total_hits == 0:
            continue

        for project_id, cnt in proj_counts.items():
            share = cnt / total_hits
            weighted_karma = int(round(karma_score * share))
            mention_rows.append(
                (project_id, reddit_id, created_date, weighted_karma, post_type)
            )

    if not mention_rows:
        return

    cur.executemany(
        """
        INSERT INTO project_mentions (project_id, reddit_id, created_date, karma_score, post_type)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(project_id, reddit_id) DO UPDATE SET
            created_date = excluded.created_date,
            karma_score = excluded.karma_score,
            post_type = excluded.post_type
        """,
        mention_rows,
    )


# ==========================================
# SAVE SNAPSHOT TO DB
# ==========================================

def save_snapshot_to_db(df, db_path=DB_PATH):
    db_df = df.copy()
    db_df = db_df.rename(columns={
        "Adjusted Score": "adjusted_score",
        "Rewards Exempt": "rewards_exempt",
    })

    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS reddit_activity (
            id TEXT PRIMARY KEY,
            author TEXT,
            post_link TEXT,
            comment_link TEXT,
            parent_post_id TEXT,
            created_date TEXT,
            moon_week TEXT,
            score INTEGER,
            adjusted_score INTEGER,
            post_flair_type TEXT,
            subreddit TEXT,
            post_type TEXT,
            title_comment TEXT,
            content_type TEXT,
            mod_distinguished INTEGER,
            rewards_exempt INTEGER,
            sentiment_raw INTEGER,
            sentiment_adjusted INTEGER,
            sentiment_label TEXT,
            project_mentions TEXT,
            project_scores TEXT,
            project_sentiments TEXT
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS project_keywords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            keyword TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (project_id) REFERENCES projects(id),
            UNIQUE (project_id, keyword)
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS project_mentions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            reddit_id TEXT NOT NULL,
            created_date TEXT NOT NULL,
            karma_score INTEGER NOT NULL,
            post_type TEXT NOT NULL,
            FOREIGN KEY (reddit_id) REFERENCES reddit_activity(id),
            FOREIGN KEY (project_id) REFERENCES projects(id),
            UNIQUE (project_id, reddit_id)
        )
    """)

    rows = db_df.to_dict("records")

    cur.executemany("""
        INSERT INTO reddit_activity (
            id, author, post_link, comment_link, parent_post_id,
            created_date, moon_week, score, adjusted_score,
            post_flair_type, subreddit, post_type, title_comment,
            content_type, mod_distinguished, rewards_exempt,
            sentiment_raw, sentiment_adjusted, sentiment_label,
            project_mentions, project_scores, project_sentiments
        ) VALUES (
            :id, :author, :post_link, :comment_link, :parent_post_id,
            :created_date, :moon_week, :score, :adjusted_score,
            :post_flair_type, :subreddit, :post_type, :title_comment,
            :content_type, :mod_distinguished, :rewards_exempt,
            :sentiment_raw, :sentiment_adjusted, :sentiment_label,
            :project_mentions, :project_scores, :project_sentiments
        )
        ON CONFLICT(id) DO UPDATE SET
            score = excluded.score,
            adjusted_score = excluded.adjusted_score,
            created_date = excluded.created_date,
            moon_week = excluded.moon_week,
            sentiment_raw = excluded.sentiment_raw,
            sentiment_adjusted = excluded.sentiment_adjusted,
            sentiment_label = excluded.sentiment_label,
            project_mentions = excluded.project_mentions,
            project_scores = excluded.project_scores,
            project_sentiments = excluded.project_sentiments
    """, rows)

    upsert_projects_and_keywords(cur)
    record_project_mentions(cur, df)

    conn.commit()
    conn.close()


# ==========================================
# CSV HELPERS
# ==========================================

def snapshot_to_csv(df, filename):
    os.makedirs(Path(filename).parent, exist_ok=True)
    df.to_csv(filename, index=False)


def user_summary_to_csv(df, filename):
    os.makedirs(Path(filename).parent, exist_ok=True)
    df.to_csv(filename, index=False)


# ==========================================
# MAIN
# ==========================================

def main():
    global RUN_START
    RUN_START = datetime.now(timezone.utc)

    snapshot_df, range_label = fetch_reddit_data()
    user_summary_df = build_user_summary(snapshot_df)

    save_snapshot_to_db(snapshot_df)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M")
    snapshot_filename = f"rcc_snapshot_data_{range_label}_{stamp}.csv"
    summary_filename = f"rcc_user_summary_{range_label}_{stamp}.csv"

    snapshot_to_csv(snapshot_df, snapshot_filename)
    user_summary_to_csv(user_summary_df, summary_filename)

    print(f"Saved snapshot data to: {snapshot_filename}")
    print(f"Saved user summary to: {summary_filename}")
    print("Saved/updated rows in SQLite database: moon_data.db")

    elapsed_sec = (datetime.now(timezone.utc) - RUN_START).total_seconds()
    elapsed_min = elapsed_sec / 60 if elapsed_sec > 0 else 0
    calls_per_min = CALLS / elapsed_min if elapsed_min > 0 else 0

    print(f"\nTotal Reddit API calls: {CALLS}")
    print(f"Elapsed time: {elapsed_min:.2f} minutes")
    print(f"Average calls per minute: {calls_per_min:.2f}")
    print("\nDone. You can run this daily and everything will accumulate in the DB.")


if __name__ == "__main__":
    main()
