import mongoose from "mongoose";

const knownUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  registeredAt: { type: Date, required: true },
});

export const KnownUser = mongoose.model("KnownUser", knownUserSchema);
