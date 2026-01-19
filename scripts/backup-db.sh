#!/bin/bash
#
# Database Backup Script
# Backs up PostgreSQL database to Google Drive using rclone
#
# Prerequisites:
#   1. Install rclone: curl https://rclone.org/install.sh | sudo bash
#   2. Configure gdrive remote: rclone config
#   3. Create backup folder: rclone mkdir gdrive:rcryptocurrency-backups
#
# Usage:
#   ./backup-db.sh
#
# Cron (daily at 3 AM):
#   0 3 * * * /path/to/backup-db.sh >> /path/to/backup.log 2>&1

set -e

# Get script directory to find .env file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

# Load DATABASE_URL from .env file
if [ -f "$ENV_FILE" ]; then
    DATABASE_URL=$(grep -E "^DATABASE_URL=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
else
    echo "ERROR: .env file not found at $ENV_FILE"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL not found in .env file"
    exit 1
fi

# Parse DATABASE_URL (format: postgresql://user:password@host:port/database)
# Example: postgresql://postgres:mypassword@localhost:5432/rcc_database
DB_USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

# Configuration
BACKUP_DIR="/tmp/db-backups"
RCLONE_REMOTE="gdrive:rcryptocurrency-backups"
RETENTION_DAYS=30

# Generate filename with date
DATE=$(date +%Y-%m-%d)
FILENAME="rcc_backup_${DATE}.sql.gz"

echo "=== Database Backup Started: $(date) ==="
echo "Database: $DB_NAME on $DB_HOST:$DB_PORT"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Dump database and compress (use PGPASSWORD to avoid password prompt)
echo "Dumping database: $DB_NAME"
PGPASSWORD="$DB_PASS" pg_dump -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME" | gzip > "$BACKUP_DIR/$FILENAME"

# Check if backup was created
if [ ! -f "$BACKUP_DIR/$FILENAME" ]; then
    echo "ERROR: Backup file was not created!"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_DIR/$FILENAME" | cut -f1)
echo "Backup created: $FILENAME ($BACKUP_SIZE)"

# Upload to Google Drive
echo "Uploading to Google Drive..."
rclone copy "$BACKUP_DIR/$FILENAME" "$RCLONE_REMOTE" --progress

# Verify upload
if rclone ls "$RCLONE_REMOTE/$FILENAME" > /dev/null 2>&1; then
    echo "Upload successful!"
else
    echo "ERROR: Upload verification failed!"
    exit 1
fi

# Clean up local backup
rm "$BACKUP_DIR/$FILENAME"
echo "Local backup removed"

# Delete old backups from Google Drive (older than RETENTION_DAYS)
echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
rclone delete "$RCLONE_REMOTE" --min-age "${RETENTION_DAYS}d" --progress

echo "=== Backup Complete: $(date) ==="
