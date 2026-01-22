import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleTopics = [
  {
    name: 'Q1 2026 Product Launch Planning',
    description: 'Planning and coordination for upcoming product launch in Q1',
    category: 'project',
    importance: 10,
    lastActivityAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    firstSeenAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    messageCount: 47,
  },
  {
    name: 'API Integration with Partner Platform',
    description: 'Technical discussion about integrating our API with partner systems',
    category: 'work',
    importance: 9,
    lastActivityAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    firstSeenAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    messageCount: 23,
  },
  {
    name: 'Team Building Event in March',
    description: 'Organizing team offsite and activities for March',
    category: 'event',
    importance: 7,
    lastActivityAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    firstSeenAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    messageCount: 15,
  },
  {
    name: 'Budget Approval for New Hires',
    description: 'Discussion about getting budget approval for expanding the team',
    category: 'work',
    importance: 9,
    lastActivityAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    firstSeenAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    messageCount: 18,
  },
  {
    name: 'Weekend Hiking Trip Planning',
    description: 'Planning a weekend hiking and camping trip with friends',
    category: 'personal',
    importance: 6,
    lastActivityAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    firstSeenAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    messageCount: 12,
  },
  {
    name: 'Database Performance Optimization',
    description: 'Technical project to improve database query performance',
    category: 'project',
    importance: 8,
    lastActivityAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    firstSeenAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    messageCount: 31,
  },
  {
    name: 'Conference Talk Preparation',
    description: 'Preparing slides and practice for upcoming conference presentation',
    category: 'event',
    importance: 8,
    lastActivityAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    firstSeenAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    messageCount: 19,
  },
  {
    name: 'How to implement OAuth2 flow?',
    description: 'Technical questions and discussion about OAuth2 implementation',
    category: 'question',
    importance: 7,
    lastActivityAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    firstSeenAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    messageCount: 8,
  },
  {
    name: 'Client Contract Renewal Discussion',
    description: 'Negotiating terms for client contract renewal',
    category: 'work',
    importance: 10,
    lastActivityAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    firstSeenAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    messageCount: 26,
  },
  {
    name: 'Kids Birthday Party Ideas',
    description: 'Planning and organizing birthday celebration for kids',
    category: 'personal',
    importance: 6,
    lastActivityAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    firstSeenAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    messageCount: 14,
  },
  {
    name: 'Mobile App Redesign Feedback',
    description: 'Collecting and discussing feedback on new mobile app design',
    category: 'project',
    importance: 8,
    lastActivityAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    firstSeenAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    messageCount: 22,
  },
  {
    name: 'Security Vulnerability Remediation',
    description: 'Urgent security issue requiring immediate attention and patching',
    category: 'work',
    importance: 10,
    lastActivityAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    firstSeenAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    messageCount: 35,
  },
];

async function main() {
  console.log('Seeding topics...');

  // Get demo user
  let user = await prisma.user.findFirst({
    where: { email: 'demo@kinso.ai' },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'demo@kinso.ai',
        name: 'Demo User',
        password: 'demo123',
      },
    });
  }

  // Delete existing topics
  await prisma.conversationTopic.deleteMany({
    where: { userId: user.id },
  });

  // Create sample topics
  for (const topic of sampleTopics) {
    await prisma.conversationTopic.create({
      data: {
        userId: user.id,
        ...topic,
      },
    });
  }

  console.log(`✅ Created ${sampleTopics.length} topics for user ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
