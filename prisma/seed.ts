import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Seed Achievements ───────────────────────────────
  const achievements = [
    {
      name: 'First Prediction',
      slug: 'first-prediction',
      description: 'Place your first prediction on any market',
      icon: '🎯',
      reward: 10,
      criteria: { type: 'predictions_placed', threshold: 1 },
    },
    {
      name: 'First Win',
      slug: 'first-win',
      description: 'Win your first prediction',
      icon: '🏆',
      reward: 25,
      criteria: { type: 'wins', threshold: 1 },
    },
    {
      name: 'Sharp Shooter',
      slug: 'sharp-shooter',
      description: 'Win 10 predictions',
      icon: '🎯',
      reward: 50,
      criteria: { type: 'wins', threshold: 10 },
    },
    {
      name: 'Market Maven',
      slug: 'market-maven',
      description: 'Win 50 predictions',
      icon: '📈',
      reward: 100,
      criteria: { type: 'wins', threshold: 50 },
    },
    {
      name: 'Prediction Master',
      slug: 'prediction-master',
      description: 'Win 100 predictions',
      icon: '👑',
      reward: 250,
      criteria: { type: 'wins', threshold: 100 },
    },
    {
      name: 'Oracle',
      slug: 'oracle',
      description: 'Win 500 predictions',
      icon: '🔮',
      reward: 500,
      criteria: { type: 'wins', threshold: 500 },
    },
    {
      name: 'Top 10 Legend',
      slug: 'top-10-legend',
      description: 'Reach the Top 10 on the all-time leaderboard',
      icon: '⭐',
      reward: 200,
      criteria: { type: 'leaderboard_rank', threshold: 10 },
    },
    {
      name: 'Market Maker',
      slug: 'market-maker',
      description: 'Create your first market',
      icon: '🏗️',
      reward: 15,
      criteria: { type: 'markets_created', threshold: 1 },
    },
    {
      name: 'Community Builder',
      slug: 'community-builder',
      description: 'Create 10 markets',
      icon: '🌐',
      reward: 100,
      criteria: { type: 'markets_created', threshold: 10 },
    },
    {
      name: 'Recruiter',
      slug: 'recruiter',
      description: 'Refer 5 friends who join MatchMarket',
      icon: '🤝',
      reward: 150,
      criteria: { type: 'referrals', threshold: 5 },
    },
    {
      name: 'Streak Master',
      slug: 'streak-master',
      description: 'Maintain a 30-day login streak',
      icon: '🔥',
      reward: 300,
      criteria: { type: 'login_streak', threshold: 30 },
    },
    {
      name: 'High Roller',
      slug: 'high-roller',
      description: 'Accumulate a balance of 10,000 tokens',
      icon: '💰',
      reward: 100,
      criteria: { type: 'balance', threshold: 10000 },
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      update: {},
      create: achievement,
    });
  }
  console.log(`  ✅ ${achievements.length} achievements seeded`);

  // ── Seed Admin User ─────────────────────────────────
  const adminEmail = 'admin@matchmarket.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@123456', 12);
    await prisma.user.create({
      data: {
        username: 'admin',
        email: adminEmail,
        passwordHash,
        role: UserRole.ADMIN,
        balance: 100000,
      },
    });
    console.log('  ✅ Admin user created (admin@matchmarket.com / Admin@123456)');
  } else {
    console.log('  ⏭️  Admin user already exists');
  }

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
