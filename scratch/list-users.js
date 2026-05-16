const { MongoClient } = require('mongodb');
require('dotenv').config();

async function listUsers() {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    
    const db = client.db();
    const users = await db.collection('users').find({}).toArray();
    
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}) [Role: ${u.role}, isActive: ${u.isActive}]`);
    });
    
    await client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listUsers();
