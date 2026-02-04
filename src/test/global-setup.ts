import { execSync } from "child_process";
import path from "path";
import dotenv from "dotenv";

export default function globalSetup(): void {
  const cwd = process.cwd();
  dotenv.config({ path: path.join(cwd, ".env") });
  execSync("npx prisma db push --accept-data-loss", {
    cwd,
    stdio: "inherit",
  });
}
