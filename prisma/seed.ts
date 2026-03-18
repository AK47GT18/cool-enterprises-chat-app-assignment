import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = 'Password@1';
  const hashedPassword = await bcrypt.hash(password, 10);

  const users = [
    { username: 'alex_public', email: 'alex@example.com' },
    { username: 'jordan_social', email: 'jordan@example.com' },
    { username: 'casey_chat', email: 'casey@example.com' },
    { username: 'taylor_connect', email: 'taylor@example.com' },
    { username: 'morgan_talk', email: 'morgan@example.com' },
    { username: 'sam_hollers', email: 'sam@example.com' },
    { username: 'riley_open', email: 'riley@example.com' },
    { username: 'quinn_vibes', email: 'quinn@example.com' },
    { username: 'skyler_cool', email: 'skyler@example.com' },
    { username: 'charlie_chat', email: 'charlie@example.com' },
  ];

  console.log('Seeding public users...');

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        username: userData.username,
        hashedPassword,
        isPrivate: false,
      },
    });
  }

  console.log('Successfully seeded 10 public users.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
