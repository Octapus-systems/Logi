# How to Get the Correct MongoDB Connection String

## Steps to Get Standard Connection String (Non-SRV)

1. Go to https://cloud.mongodb.com
2. Click on your cluster (Cluster0)
3. Click **"Connect"** button
4. Click **"Drivers"**
5. Select **"Node.js"**
6. Select **"Version 4.1 or later"**
7. Click **"Connection string only"** (NOT the SRV string)
8. Copy the connection string

## What You'll Get

Instead of:
```
mongodb+srv://...
```

You should get something like:
```
mongodb://username:password@shard1:27017,shard2:27017,shard3:27017/database?replicaSet=xxx&ssl=true&authSource=admin
```

## Update .env

Replace the MONGO_URI in your `.env` file with this new connection string.

## Why This Fixes the Issue

- **SRV format** (`mongodb+srv://`) requires DNS lookup → **BLOCKED by your network**
- **Standard format** (`mongodb://`) connects directly to shards → **WORKS with your network**

## Alternative: Use Local MongoDB

If Atlas still doesn't work, switch to local MongoDB:

1. Install MongoDB Community Server
2. Update `.env`:
   ```
   MONGO_URI=mongodb://localhost:27017/logi
   ```
3. Run `tsx scripts/seed-user.ts` to create users locally
4. Continue development with local database

## Need Help?

Paste the connection string from Atlas (with password hidden) and I can help you configure it.
