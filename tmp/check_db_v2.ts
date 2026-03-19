import { prisma } from '../lib/prisma';

async function main() {
  try {
    const users = await prisma.user.findMany({
      take: 5,
      select: {
          id: true,
          username: true,
          email: true,
          isPrivate: true,
          // bio and privacyCode might not be in the generated types yet if they didn't push correctly
      }
    });
    console.log("Found users (partial):", JSON.stringify(users, null, 2));
    
    // Check if we can access the new fields via raw query or any caster
    const rawUsers = await prisma.$queryRaw`SELECT id, username, bio, "privacyCode" FROM "User" LIMIT 5`;
    console.log("Raw users with new fields:", JSON.stringify(rawUsers, null, 2));

  } catch (e: any) {
    console.error("Diagnostic failed:", e.message || e);
  } finally {
    await prisma.$disconnect()
  }
}

main()
