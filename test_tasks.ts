import mongoose from 'mongoose';

async function checkTasks() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/logi');
  
  const tasks = await mongoose.connection.collection('tasks').find({
    status: { $ne: 'done' }
  }).toArray();
  
  console.log(`Found ${tasks.length} pending tasks`);
  tasks.slice(0, 5).forEach(t => {
    console.log(`Task: ${t.title}`);
    console.log(`  status: ${t.status}`);
    console.log(`  isScheduled: ${t.isScheduled}`);
    console.log(`  createdAt: ${t.createdAt}`);
  });
  
  process.exit(0);
}

checkTasks();
