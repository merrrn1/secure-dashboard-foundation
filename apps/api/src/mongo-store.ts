import mongoose, { Schema } from "mongoose";
import type { DashboardRecord, DataStore, UserRecord } from "./domain.js";

interface UserDocument {
  email: string;
  passwordHash: string;
  role: "operator" | "admin";
}

interface DashboardDocument {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  status: "healthy" | "attention" | "offline";
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["operator", "admin"] },
  },
  { timestamps: true },
);

const dashboardSchema = new Schema<DashboardDocument>(
  {
    ownerId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true },
    status: { type: String, required: true, enum: ["healthy", "attention", "offline"] },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { versionKey: false },
);

const UserModel = mongoose.model<UserDocument>("User", userSchema);
const DashboardModel = mongoose.model<DashboardDocument>("Dashboard", dashboardSchema);

export async function connectMongo(uri: string): Promise<void> {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}

export class MongoDataStore implements DataStore {
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const user = await UserModel.findOne({ email: email.toLowerCase() }).lean();
    if (!user) return null;

    return {
      id: user._id.toString(),
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
    };
  }

  async listDashboard(ownerId: string): Promise<DashboardRecord[]> {
    const rows = await DashboardModel.find({ ownerId }).sort({ updatedAt: -1 }).lean();
    return rows.map((row) => ({
      id: row._id.toString(),
      ownerId: row.ownerId.toString(),
      name: row.name,
      status: row.status,
      updatedAt: row.updatedAt.toISOString(),
    }));
  }
}

export const seedModels = { UserModel, DashboardModel };

