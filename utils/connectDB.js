import mongoose from "mongoose";

const connection = {};

const connectDB = async () => {
  if (connection.isConnected) {
    console.log("Database already connected");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGO_URI);
    connection.isConnected = db.connections[0].readyState;

    console.log(`MongoDB connected: ${db.connection.host}`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
