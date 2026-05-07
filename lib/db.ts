import mongoose from 'mongoose';

/**
 * Connects to MongoDB database using Mongoose
 * This function handles the database connection with proper error handling
 * and connection caching for Next.js development environment
 */
const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Check if connection already exists to avoid multiple connections in development
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB Already Connected');
      return;
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    throw error;
  }
};

export default connectDB;
