// src/scripts/seeds.ts
import { prisma } from "../core/db/prisma";
import { hashPwd } from "../modules/auth/svc/hash_Password";

async function main() {
  console.log(" Starting seed...");

  const email = "John@student.edu";
  const name = "John Tan";
  const password = "Password123!";
  const passwordHash = await hashPwd(password);

  // Upsert the demo student
  const student = await prisma.student.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      emailVerifiedAt: new Date(),
    },
    create: {
      name,
      email,
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(` Seeded student: ${student.name} (${student.email})`);

  // No more session/password/email-verify tables (stateless JWT),
  // so there's nothing else to clean up here.

  console.log(" Seed complete.");
}

main()
  .catch((err) => {
    console.error(" Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
