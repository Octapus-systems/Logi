const { MongoClient } = require('mongodb');
require('dotenv').config();

async function viewUser() {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    
    const db = client.db();
    const user = await db.collection('users').findOne({ email: 'fathima@octapus.com' });
    
    if (user) {
      console.log('📋 Staff User Data:');
      console.log('==================');
      console.log('ID:', user._id);
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role);
      console.log('Lives:', user.lives);
      console.log('Active:', user.isActive);
      console.log('Created:', user.createdAt);
      console.log('Updated:', user.updatedAt);
      console.log('Password Hash:', user.password.substring(0, 20) + '...');
    } else {
      console.log('❌ User not found');
    }
    
    await client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

viewUser();
