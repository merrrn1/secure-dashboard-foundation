import bcrypt from "bcryptjs";
import { readConfig } from "./config.js";
import { connectMongo, seedModels } from "./mongo-store.js";

const config = readConfig();
await connectMongo(config.MONGODB_URI);

const email = "operator@example.com";
const password = process.env.SEED_PASSWORD ?? "local-demo-password";
const passwordHash = await bcrypt.hash(password, 12);

const user = await seedModels.UserModel.findOneAndUpdate(
  { email },
  { email, passwordHash, role: "operator" },
  { upsert: true, new: true },
);

await seedModels.DashboardModel.deleteMany({ ownerId: user._id });
await seedModels.DashboardModel.insertMany([
  { ownerId: user._id, name: "Identity verification API", status: "healthy" },
  { ownerId: user._id, name: "Ownership transfer queue", status: "attention" },
  { ownerId: user._id, name: "Audit export worker", status: "healthy" },
]);

console.log(`Seeded ${email}. Set SEED_PASSWORD to override the local demo password.`);
process.exit(0);

