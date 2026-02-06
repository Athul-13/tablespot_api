import bcrypt from "bcrypt";
import { injectable } from "tsyringe";
import { env } from "@/config";
import type { IPasswordHasher } from "@/types/service-interfaces";

@injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, env.BCRYPT_SALT_ROUNDS);
  }

  async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
