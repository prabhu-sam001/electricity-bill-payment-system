const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://pavanlamani860_db:8fHwe1ijU3ptEQPr@cluster0.ps341rn.mongodb.net/?appName=Cluster0"
    );
    console.log("MongoDB Atlas connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
