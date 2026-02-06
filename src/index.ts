import { env } from "@/config";
import { logger } from "@/lib/logger";
import { createApp } from "@/app";

const app = createApp();

app.listen(env.PORT, "0.0.0.0", () => {
  logger.info("Server listening", { port: env.PORT });
});
