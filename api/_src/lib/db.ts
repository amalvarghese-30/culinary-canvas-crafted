import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  mongoose.connection.on("error", (err) => {
    console.error("[mongodb] connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[mongodb] disconnected");
  });

  console.log("[mongodb] connected");
}
