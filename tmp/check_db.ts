import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const userCount = await prisma.user.count();
    console.log("User count:", userCount);
    
    if (userCount > 0) {
      const firstUser = await prisma.user.findFirst();
      console.log("First user keys:", Object.keys(firstUser || {}));
      console.log("First user values (safe):", {
        id: firstUser?.id,
        username: firstUser?.username,
        email: firstUser?.email,
        bio: (firstUser as any).bio,
        privacyCode: (firstUser as any).privacyCode
      });
    }
  } catch (e) {
    console.error("Database check failed:", e);
  } finally {
    await prisma.$disconnect()
  }
}

main()
