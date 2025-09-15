import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Check if default user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: 'demo@equitle.com' }
  });

  if (existingUser) {
    console.log('Default user already exists, skipping seed');
    return;
  }

  // Create default user with profile and preferences
  const hashedPassword = await bcrypt.hash('demo123', 12);

  const user = await prisma.user.create({
    data: {
      id: 'default-user-id',
      email: 'demo@equitle.com',
      password: hashedPassword,
      name: 'Demo User',
      firm: 'Equitle',
      role: 'admin',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      emailVerified: true,
      profile: {
        create: {
          title: 'Managing Partner',
          bio: 'Demo user for Equitle platform',
          joinDate: new Date(),
          timezone: 'America/Los_Angeles',
          language: 'en',
          theme: 'light',
        }
      },
      preferences: {
        create: {
          emailNotify: true,
          pushNotify: true,
          smsNotify: false,
          calendarNotify: true,
          dealNotify: true,
          autoSave: true,
          darkMode: false,
        }
      }
    },
    include: {
      profile: true,
      preferences: true,
    }
  });

  console.log('Created default user:', user.email);
  console.log('User ID:', user.id);
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });