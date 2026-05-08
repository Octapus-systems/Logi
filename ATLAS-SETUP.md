# MongoDB Atlas Setup Instructions

## Current Error
`querySrv ECONNREFUSED` - Network cannot resolve MongoDB Atlas DNS

## Fix Steps

### 1. Login to MongoDB Atlas
- Go to: https://cloud.mongodb.com
- Login with your credentials

### 2. Navigate to Network Access
1. Select your project (Cluster0)
2. Click **Network Access** in left sidebar
3. Click **Add IP Address**

### 3. Add IP Address
Choose one option:

**Option A - Your Current IP (Recommended):**
- Click "Add Current IP Address"
- Click Confirm

**Option B - Allow Anywhere (Less Secure):**
- Click "Allow Access from Anywhere"
- This sets IP: 0.0.0.0/0
- Click Confirm

### 4. Wait for Changes
- Atlas takes 1-3 minutes to apply network changes
- Status will show "Active" when ready

### 5. Test Connection
```bash
node test-db.js
```

### 6. Transfer Staff Data to Atlas
Once connected, run:
```bash
tsx scripts/seed-user.ts
```

## Still Getting Error?

### Check 1: Test DNS Resolution
```bash
nslookup cluster0.yebi9w6.mongodb.net
```
Should return IP addresses. If it fails, DNS is blocked on your network.

### Check 2: Use Different Network
- Try mobile hotspot
- Or use a different WiFi network
- Corporate networks often block MongoDB Atlas

### Check 3: Contact Network Admin
If on corporate/office network, ask IT to whitelist:
- `*.mongodb.net`
- Port 27017
- SRV record resolution

## Alternative: Use MongoDB Atlas Data API
If direct connection is blocked, you can use Atlas Data API (HTTP-based) instead of direct MongoDB connection.
