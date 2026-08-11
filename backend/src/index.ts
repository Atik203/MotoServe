import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { initSocket } from "./lib/socket.js";

const port = Number(process.env.PORT ?? 4000);

const app = createApp();
const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(port, () => {
  console.log(`MotoServe API listening on http://localhost:${port}`);
});
