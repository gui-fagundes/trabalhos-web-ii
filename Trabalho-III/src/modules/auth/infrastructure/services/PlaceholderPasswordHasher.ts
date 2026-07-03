import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { PasswordHasher } from "../../application/services/PasswordHasher.js";

const KEY_LENGTH = 64;

export class ScryptPasswordHasher implements PasswordHasher {
  public async hash(value: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derived = scryptSync(value, salt, KEY_LENGTH).toString("hex");
    return `${salt}:${derived}`;
  }

  public async compare(value: string, hash: string): Promise<boolean> {
    const [salt, digest] = hash.split(":");
    if (!salt || !digest) return false;
    const stored = Buffer.from(digest, "hex");
    const derived = scryptSync(value, salt, KEY_LENGTH);
    if (stored.length !== derived.length) return false;
    return timingSafeEqual(stored, derived);
  }
}

/** Preserva o nome antigo para não quebrar imports existentes. */
export const PlaceholderPasswordHasher = ScryptPasswordHasher;
