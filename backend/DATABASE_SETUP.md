# Database Setup Guide

## Overview

SmarTrack uses **MongoDB Atlas** (cloud-hosted MongoDB) for data storage.

## Database Configuration

- **Database Name**: `smartrack`
- **Connection**: MongoDB Atlas (cloud-hosted)
- **Collections**:
  - `links` - User's saved links
  - `collections` - User's collections/folders
  - `categories` - User's categories

## Connection String

The MongoDB connection string is configured via the `MONGODB_URI` environment variable:

```env
MONGODB_URI=mongodb+srv://smartrack_user:UW0AC5aYv8q3suiB@cluster0.iwoqnpj.mongodb.net/?appName=Cluster0
```

## Automatic Index Creation

Indexes are **automatically created** when the backend starts up (see `main.py`). This ensures optimal query performance.

### Indexes Created

#### Links Collection:
- `userId` - For filtering links by user
- `userId + isFavorite` - For favorite links queries
- `userId + isArchived` - For archived links queries
- `userId + createdAt` - For date-sorted queries
- `userId + url` - For duplicate URL checking
- `userId + category` - For category filtering
- `userId + collectionId` - For collection filtering

#### Collections Collection:
- `userId` - For filtering collections by user
- `userId + name` - For collection name queries

#### Categories Collection:
- `userId` - For filtering categories by user

## Manual Database Initialization

If you need to manually initialize the database (e.g., for testing or fixing issues), run:

```bash
cd backend
python scripts/init_db.py
```

This script will:
1. Connect to MongoDB Atlas
2. Create all necessary indexes
3. Display current index information

## Database Status

### Verify Connection

Check if the database connection is working:

```bash
curl https://your-backend.onrender.com/api/health
```

Should return: `{"status":"healthy","timestamp":"..."}`

### Check Render Environment Variables

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service
3. Go to "Environment" tab
4. Verify `MONGODB_URI` is set correctly

## MongoDB Atlas Dashboard

Access your MongoDB cluster:
- URL: https://cloud.mongodb.com
- Cluster: `cluster0`
- Database: `smartrack`

## Production Checklist

- [x] MongoDB Atlas cluster created
- [x] Connection string configured in Render
- [x] Indexes automatically created on startup
- [x] Database connection tested
- [x] Collections created automatically on first use

## Free Tier Limits

- **MongoDB Atlas Free Tier**: 512MB storage
- **Perfect for MVP**: Supports thousands of links per user

## Troubleshooting

### Connection Issues

1. **Check MONGODB_URI**: Ensure it's set in Render environment variables
2. **Check Network Access**: Verify IP whitelist in MongoDB Atlas (or allow all IPs for development)
3. **Check Logs**: View Render logs for connection errors

### Performance Issues

1. **Indexes**: Verify indexes were created (check startup logs)
2. **Query Patterns**: Most queries filter by `userId` first (indexed)
3. **Connection Pooling**: Motor (async MongoDB driver) handles connection pooling automatically

### Data Backup

MongoDB Atlas provides automatic backups:
- Go to MongoDB Atlas Dashboard
- Navigate to "Backups" tab
- Configure backup schedule (free tier: daily backups)

## Next Steps

The database is automatically initialized when the backend starts. No manual setup required! ✅

