import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(rawPassword: string) {
  return bcrypt.hash(rawPassword, ROUNDS);
}

export async function verifyPassword(rawPassword: string, hash: string) {
  return bcrypt.compare(rawPassword, hash);
}
