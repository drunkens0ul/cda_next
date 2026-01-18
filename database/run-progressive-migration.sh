#!/bin/bash

# Quiz Progressive Submission Migration Runner
# This script applies progressive submission migrations to the database

set -e

if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable not set"
    echo "Please run: export DATABASE_URL='your_database_url'"
    exit 1
fi

echo "Applying Quiz Progressive Submission Migrations..."
echo "Database: $DATABASE_URL"
echo ""

# Run migrations
echo "Applying migration 007: Add quiz progressive submission..."
psql "$DATABASE_URL" -f "$(dirname "$0")/migrations/007_add_quiz_progressive_submission.sql"

echo ""
echo "Applying migration 008: Fix quiz responses unique constraint..."
psql "$DATABASE_URL" -f "$(dirname "$0")/migrations/008_fix_quiz_responses_unique_constraint.sql"

echo ""
echo "Migrations completed successfully!"
echo ""
echo "The following changes were made:"
echo "1. Created quiz_attempts table for tracking active quiz sessions"
echo "2. Added attempt_id column to quiz_responses table"
echo "3. Added attempt_id column to quiz_submissions table"
echo "4. Created trigger for automatic active time calculation"
echo "5. Added partial unique index to prevent duplicate answers per question"
echo ""
echo "The quiz system now supports:"
echo "- Progressive answer submission (one by one)"
echo "- Activity time tracking (actual time spent, not wall-clock)"
echo "- Resume capability (users can leave and return)"
echo "- No restart (enforced by database constraint)"
echo "- Prevent re-submission of already answered questions"

