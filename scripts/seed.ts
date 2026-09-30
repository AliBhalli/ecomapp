import { seedDatabase } from '../lib/seed'; // 💡 If your file is named 'db.ts' change this to '../lib/db'
import clientPromise from '../lib/dbConnect'; // 💡 Uses your existing database connector

async function run() {
  try {
    console.log('⏳ Connecting to MongoDB instance...');
    
    // Call the function you found in your lib folder
    const result = await seedDatabase();
    
    console.log('✅ Seeding operation complete!');
    console.log(`- Categories loaded: ${result.categories}`);
    console.log(`- Products loaded: ${result.products}`);
    console.log(`- Users configured: ${result.users}`);
  } catch (error) {
    console.error('❌ Error executing database seed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();
