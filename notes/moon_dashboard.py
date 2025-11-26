import sqlite3
from pathlib import Path

import pandas as pd
import streamlit as st

import altair as alt
import datetime

DB_PATH = Path("moon_data.db")

# ---------------------------
# Helper: DB query with cache
# ---------------------------

@st.cache_data(ttl=300)
def run_query(sql, params=()):
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query(sql, conn, params=params)
    conn.close()
    return df


def get_moon_epochs():
    # Column is 'moon_week' in DB, but we present as "Moon Epoch" in UI
    df = run_query(
        """
        SELECT DISTINCT moon_week
        FROM reddit_activity
        WHERE moon_week IS NOT NULL
        ORDER BY moon_week
        """
    )
    return df["moon_week"].dropna().tolist()

# ---------------------------
# Fear / Greed helpers
# ---------------------------

def fear_greed_label(score: float) -> str:
    if score is None:
        return "No data"
    if score >= 81:
        return "Extreme Greed"
    elif score >= 61:
        return "Greed"
    elif score >= 41:
        return "Neutral"
    elif score >= 21:
        return "Fear"
    else:
        return "Extreme Fear"


def build_gauge_chart(value: float, title: str):
    """Simple horizontal gauge using Altair (0–100)."""
    if value is None:
        st.write(f"{title}: No data")
        return

    # Clamp
    v = max(0, min(100, float(value)))
    label = fear_greed_label(v)

    df_bg = pd.DataFrame({"value": [100]})
    df_fg = pd.DataFrame({"value": [v]})

    # Choose a color by bucket
    if v >= 81:
        color = "#00b894"  # strong green
    elif v >= 61:
        color = "#55efc4"
    elif v >= 41:
        color = "#dfe6e9"
    elif v >= 21:
        color = "#ffeaa7"
    else:
        color = "#ff7675"

    base = alt.Chart(df_bg).mark_bar(color="#dfe6e9").encode(
        x=alt.X("value:Q", scale=alt.Scale(domain=[0, 100])),
    ).properties(height=30, width=250)

    fg = alt.Chart(df_fg).mark_bar(color=color).encode(
        x=alt.X("value:Q", scale=alt.Scale(domain=[0, 100])),
    )

    chart = (base + fg).configure_axis(
        labels=False,
        ticks=False,
        grid=False
    ).configure_view(
        strokeWidth=0
    )

    st.markdown(f"**{title}**")
    st.altair_chart(chart, use_container_width=False)
    st.caption(f"{v:.1f} / 100 • {label}")


# ---------------------------
# Streamlit page config
# ---------------------------

st.set_page_config(
    page_title="r/CryptoCurrency Moon Dashboard",
    layout="wide",
)

st.title("🌕 r/CryptoCurrency Moon Dashboard")
st.caption("Backed by local SQLite DB: moon_data.db")

# ---------------------------
# Last Updated Timestamp (UTC + Friendly)
# ---------------------------
import datetime
import pytz

# Query latest timestamp from DB
last_update_df = run_query(
    """
    SELECT created_date
    FROM reddit_activity
    ORDER BY created_date DESC
    LIMIT 1;
    """
)

if last_update_df.empty:
    st.warning("No data found yet — scraper may not have run.")
else:
    raw_ts = last_update_df["created_date"].iloc[0]

    # Convert DB string → datetime
    try:
        utc_dt = datetime.datetime.fromisoformat(raw_ts)
    except:
        utc_dt = datetime.datetime.strptime(raw_ts, "%Y-%m-%d %H:%M:%S")

    # Ensure timestamp is explicitly UTC
    utc_dt = utc_dt.replace(tzinfo=datetime.timezone.utc)

    # Friendly time ago (computed in UTC)
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    diff = now_utc - utc_dt
    seconds = diff.total_seconds()

    if seconds < 60:
        friendly = "Updated just now"
    elif seconds < 3600:
        minutes = int(seconds // 60)
        friendly = f"Updated {minutes} minute{'s' if minutes != 1 else ''} ago"
    elif seconds < 86400:
        hours = int(seconds // 3600)
        friendly = f"Updated {hours} hour{'s' if hours != 1 else ''} ago"
    else:
        days = int(seconds // 86400)
        friendly = f"Updated {days} day{'s' if days != 1 else ''} ago"

    # Format timestamp in clean UTC format
    pretty_ts = utc_dt.strftime("%b %d, %Y • %H:%M UTC")

    # Display cleanly
    st.markdown(
        f"### 🕒 Last updated\n"
        f"**{pretty_ts}**  \n"
        f"_{friendly}_"
    )



if not DB_PATH.exists():
    st.error(f"Database file {DB_PATH} not found in current directory.")
    st.stop()

# ---------------------------
# Sidebar controls
# ---------------------------

epochs = get_moon_epochs()
if not epochs:
    st.warning("No Moon Epochs found in the database yet.")
    st.stop()

default_epoch = epochs[-1]

selected_epoch = st.sidebar.selectbox(
    "Select Moon Epoch",
    epochs,
    index=epochs.index(default_epoch),
)

st.sidebar.markdown("---")

# ---------------------------
# Fear / Greed Index
# ---------------------------

# 1) Epoch average fear/greed (use sentiment_adjusted if present)
try:
    epoch_sent_df = run_query(
        """
        SELECT AVG(sentiment_adjusted) AS avg_sent
        FROM reddit_activity
        WHERE moon_week = ?;
        """,
        (selected_epoch,),
    )
    if epoch_sent_df.empty or pd.isna(epoch_sent_df["avg_sent"].iloc[0]):
        epoch_fear_greed = None
    else:
        epoch_fear_greed = float(epoch_sent_df["avg_sent"].iloc[0])
except Exception:
    # If the column doesn't exist yet, just skip
    epoch_fear_greed = None

# 2) Current fear/greed: last 72 hours (approx as last 3 dates)
# created_date is stored as 'YYYY-MM-DD', so we use SQLite date math.
try:
    recent_sent_df = run_query(
        """
        SELECT AVG(sentiment_adjusted) AS avg_sent
        FROM reddit_activity
        WHERE created_date >= date('now', '-2 day');
        """
    )
    if recent_sent_df.empty or pd.isna(recent_sent_df["avg_sent"].iloc[0]):
        recent_fear_greed = None
    else:
        recent_fear_greed = float(recent_sent_df["avg_sent"].iloc[0])
except Exception:
    recent_fear_greed = None

st.markdown("## 🧠 Fear / Greed Index")

col_fg1, col_fg2 = st.columns(2)
with col_fg1:
    build_gauge_chart(epoch_fear_greed, "Moon Epoch Average Fear/Greed")
with col_fg2:
    build_gauge_chart(recent_fear_greed, "Current Fear/Greed (Last 72h)")

st.markdown("---")


search_user = st.sidebar.text_input(
    "Search username", value="", placeholder="e.g. 002_timmy"
)

st.sidebar.markdown(
    "Scores are based on **Adjusted Score** (meme penalty + rewards exemptions)."
)

# ---------------------------
# Epoch totals (used in multiple places)
# ---------------------------

epoch_total_score_df = run_query(
    """
    SELECT COALESCE(SUM(adjusted_score), 0) AS total_score
    FROM reddit_activity
    WHERE moon_week = ?;
    """,
    (selected_epoch,),
)
epoch_total_score = int(epoch_total_score_df["total_score"].iloc[0])

# ---------------------------
# Top 50 earners in epoch (+ % of epoch total)
# ---------------------------

top50_df = run_query(
    """
    SELECT author,
           SUM(adjusted_score) AS total_score
    FROM reddit_activity
    WHERE moon_week = ?
    GROUP BY author
    ORDER BY total_score DESC
    LIMIT 50;
    """,
    (selected_epoch,),
)

st.subheader(f"Top 50 Adjusted Score Earners – Moon Epoch {selected_epoch}")

if top50_df.empty:
    st.info("No data for this Moon Epoch yet.")
else:
    top50_df = top50_df.rename(columns={"author": "Username", "total_score": "Total Score"})
    denom = epoch_total_score if epoch_total_score != 0 else 1
    top50_df["% of Epoch Total"] = (top50_df["Total Score"] / denom * 100).round(2)

    # INSERT THESE NEW LINES BELOW
    top50_df.insert(0, "Rank", range(1, len(top50_df) + 1))
    st.dataframe(top50_df.set_index("Rank"), width="stretch")


# --- New bar chart: total score by date within the selected epoch
score_by_date_df = run_query(
    """
    SELECT created_date,
           SUM(adjusted_score) AS total_score
    FROM reddit_activity
    WHERE moon_week = ?
    GROUP BY created_date
    ORDER BY created_date;
    """,
    (selected_epoch,),
)
st.subheader(f"Total Score by Date – Moon Epoch {selected_epoch}")
if score_by_date_df.empty:
    st.info("No score data for this Moon Epoch.")
else:
    chart_df = score_by_date_df.set_index("created_date")["total_score"]
    st.bar_chart(chart_df)

# ---------------------------
# Daily activity for epoch (add Total Score metric)
# ---------------------------

st.subheader(f"Daily Activity – Moon Epoch {selected_epoch}")

daily_df = run_query(
    """
    SELECT created_date,
           COUNT(*) AS total_items,
           SUM(CASE WHEN post_type = 'post' THEN 1 ELSE 0 END) AS posts,
           SUM(CASE WHEN post_type = 'comment' THEN 1 ELSE 0 END) AS comments,
           SUM(adjusted_score) AS total_score
    FROM reddit_activity
    WHERE moon_week = ?
    GROUP BY created_date
    ORDER BY created_date;
    """,
    (selected_epoch,),
)

if daily_df.empty:
    st.info("No daily data for this Moon Epoch.")
else:
    total_items = int(daily_df["total_items"].sum())
    total_posts = int(daily_df["posts"].sum())
    total_comments = int(daily_df["comments"].sum())
    total_epoch_score_from_daily = int(daily_df["total_score"].sum())

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total submissions", f"{total_items:,}")
    c2.metric("Posts", f"{total_posts:,}")
    c3.metric("Comments", f"{total_comments:,}")
    c4.metric("Total score", f"{total_epoch_score_from_daily:,}")

    st.line_chart(
        daily_df.set_index("created_date")[["posts", "comments"]],
    )

# ---------------------------
# Flair stats (posts only)
# ---------------------------

st.subheader(f"Post Flair Stats – Moon Epoch {selected_epoch}")

flair_df = run_query(
    """
    SELECT COALESCE(post_flair_type, '') AS flair,
           COUNT(*) AS post_count,
           SUM(adjusted_score) AS total_adjusted_score
    FROM reddit_activity
    WHERE moon_week = ?
      AND post_type = 'post'
    GROUP BY post_flair_type
    ORDER BY total_adjusted_score DESC;
    """,
    (selected_epoch,),
)

if flair_df.empty:
    st.info("No posts with flair found for this Moon Epoch.")
else:
    flair_df = flair_df.rename(
        columns={
            "flair": "Flair",
            "post_count": "Post Count",
            "total_adjusted_score": "Total Adjusted Score",
        }
    )
    st.dataframe(flair_df, width="stretch")

    st.bar_chart(
        flair_df.set_index("Flair")[["Post Count", "Total Adjusted Score"]],
    )

# ---------------------------
# User search
# ---------------------------

st.subheader("🔍 User Lookup")

if not search_user:
    st.info("Enter a username in the sidebar to look up their scores.")
else:
    username = search_user.strip()

    # Overall (all epochs)
    total_df = run_query(
        """
        SELECT COALESCE(SUM(adjusted_score), 0) AS total_score
        FROM reddit_activity
        WHERE author = ?;
        """,
        (username,),
    )
    overall_total = int(total_df["total_score"].iloc[0])

    # Selected epoch score
    epoch_user_df = run_query(
        """
        SELECT COALESCE(SUM(adjusted_score), 0) AS epoch_score
        FROM reddit_activity
        WHERE author = ?
          AND moon_week = ?;
        """,
        (username, selected_epoch),
    )
    epoch_user_total = int(epoch_user_df["epoch_score"].iloc[0])

    c1, c2 = st.columns(2)
    c1.metric("Overall Adjusted Score (all epochs)", f"{overall_total:,}")
    c2.metric(f"Adjusted Score (Moon Epoch {selected_epoch})", f"{epoch_user_total:,}")

    # All content for this user in the selected epoch
    user_items_df = run_query(
        """
        SELECT created_date,
               post_type,
               post_flair_type,
               score,
               adjusted_score,
               CASE
                   WHEN comment_link IS NOT NULL AND LENGTH(TRIM(comment_link)) > 0
                        THEN comment_link
                   ELSE post_link
               END AS link,
               title_comment AS text
        FROM reddit_activity
        WHERE author = ?
          AND moon_week = ?
        ORDER BY created_date, post_type DESC;
        """,
        (username, selected_epoch),
    )

    st.markdown(f"#### Content submitted by **u/{username}** in Moon Epoch {selected_epoch}")
    if user_items_df.empty:
        st.info("No submissions found for this user in the selected epoch.")
    else:
        # A little cleanup / nicer column names
        user_items_df = user_items_df.rename(
            columns={
                "created_date": "Date",
                "post_type": "Type",
                "post_flair_type": "Flair",
                "score": "Score",
                "adjusted_score": "Adjusted Score",
                "link": "Link",
                "text": "Text",
            }
        )
        st.dataframe(user_items_df, width="stretch")
