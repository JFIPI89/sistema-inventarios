import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const checks = [
  { email: "alpha@inventarios.local", password: "alpha123" },
  { email: "beta@inventarios.local", password: "beta123" },
  { email: "gama@inventarios.local", password: "gama123" },
];

async function main() {
  for (const { email, password } of checks) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`${email}: MISSING`);
      continue;
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    console.log(`${email}: ${user.name} — ${ok ? "OK" : "BAD PASSWORD"}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
