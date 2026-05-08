const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected successfully!');
    await client.close();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
