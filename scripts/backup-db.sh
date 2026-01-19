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

# Configuration
DB_NAME="rcc_database"
DB_USER="postgres"
DB_HOST="localhost"
BACKUP_DIR="/tmp/db-backups"
RCLONE_REMOTE="gdrive:rcryptocurrency-backups"
RETENTION_DAYS=30

# Generate filename with date
DATE=$(date +%Y-%m-%d)
FILENAME="rcc_backup_${DATE}.sql.gz"

echo "=== Database Backup Started: $(date) ==="

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Dump database and compress
echo "Dumping database: $DB_NAME"
pg_dump -U "$DB_USER" -h "$DB_HOST" "$DB_NAME" | gzip > "$BACKUP_DIR/$FILENAME"

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
