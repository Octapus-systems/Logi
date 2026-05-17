const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkAttendance() {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    
    const db = client.db();
    
    // Get today's date at midnight (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    console.log(`Checking attendance for date: ${today.toISOString()}`);
    
    const records = await db.collection('attendances').find({ date: today }).toArray();
    
    console.log(`Found ${records.length} records:`);
    for (const r of records) {
      const user = await db.collection('users').findOne({ _id: r.userId });
      console.log(`- User: ${user?.name || r.userId} | Status: ${r.status} | Lives: ${r.lives}`);
    }
    
    await client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAttendance();
