import { createApp } from "./app.js";
import { readConfig } from "./config.js";
import { connectMongo, MongoDataStore } from "./mongo-store.js";

const config = readConfig();
await connectMongo(config.MONGODB_URI);

const app = createApp({
  store: new MongoDataStore(),
  jwtSecret: config.JWT_SECRET,
  webOrigin: config.WEB_ORIGIN,
});

app.listen(config.API_PORT, () => {
  console.log(`API listening on http://localhost:${config.API_PORT}`);
});

