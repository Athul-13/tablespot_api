import express from "express";
import { env } from "@/config";

const app = express();

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${env.PORT}`);
});
