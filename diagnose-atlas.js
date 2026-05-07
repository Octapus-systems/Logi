const dns = require('dns');
const { MongoClient } = require('mongodb');
require('dotenv').config();

console.log('🔍 MongoDB Atlas Diagnostic Tool\n');

// Test 1: DNS Resolution
console.log('Test 1: DNS Resolution');
console.log('======================');
dns.resolveSrv('_mongodb._tcp.cluster0.yebi9w6.mongodb.net', (err, addresses) => {
  if (err) {
    console.log('❌ SRV Lookup Failed:', err.message);
    console.log('   This means DNS SRV records are blocked or not resolvable.');
  } else {
    console.log('✅ SRV Records Found:');
    addresses.forEach(addr => console.log('   -', addr.name, ':', addr.port));
  }
  console.log();
  
  // Test 2: Direct hostname lookup
  console.log('Test 2: Hostname Resolution');
  console.log('==========================');
  dns.lookup('cluster0.yebi9w6.mongodb.net', (err, address) => {
    if (err) {
      console.log('❌ Hostname Lookup Failed:', err.message);
    } else {
      console.log('✅ Hostname resolves to:', address);
    }
    console.log();
    
    // Test 3: Connection Test
    console.log('Test 3: MongoDB Connection');
    console.log('=========================');
    testConnection();
  });
});

async function testConnection() {
  try {
    const uri = process.env.MONGO_URI;
    console.log('Connecting to:', uri.replace(/:([^@]+)@/, ':***@')); // Hide password
    
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    
    await client.connect();
    console.log('✅ MongoDB Connected Successfully!');
    
    const db = client.db('admin');
    const result = await db.admin().ping();
    console.log('✅ Ping successful:', result);
    
    await client.close();
    console.log('✅ Connection closed properly');
  } catch (error) {
    console.log('❌ Connection Failed:', error.message);
    if (error.message.includes('authentication failed')) {
      console.log('   🔧 Fix: Check username/password in connection string');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('   🔧 Fix: Network/DNS issue. Try:');
      console.log('      - Switch to mobile hotspot');
      console.log('      - Use VPN');
      console.log('      - Check if corporate firewall blocks MongoDB');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('   🔧 Fix: Cannot resolve hostname. DNS issue.');
    } else {
      console.log('   🔧 Error code:', error.code || 'N/A');
    }
  }
  console.log();
  
  // Test 4: Environment Variables
  console.log('Test 4: Environment Variables');
  console.log('==========================');
  if (process.env.MONGO_URI) {
    console.log('✅ MONGO_URI is set');
    console.log('   Value:', process.env.MONGO_URI.replace(/:([^@]+)@/, ':***@'));
  } else {
    console.log('❌ MONGO_URI is NOT set!');
  }
}
