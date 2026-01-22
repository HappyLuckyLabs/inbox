import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleGoals = [
  // Work goals
  {
    goal: 'Close $500K in sales by Q1 2026',
    category: 'work',
    priority: 10,
    confidence: 0.92,
    keywords: JSON.stringify(['sales', 'Q1', 'revenue', 'deals']),
    status: 'active' as const,
  },
  {
    goal: 'Launch new product feature by March',
    category: 'work',
    priority: 9,
    confidence: 0.88,
    keywords: JSON.stringify(['product', 'launch', 'feature', 'release']),
    status: 'active' as const,
  },
  {
    goal: 'Hire 3 senior engineers for the team',
    category: 'work',
    priority: 8,
    confidence: 0.85,
    keywords: JSON.stringify(['hiring', 'engineering', 'team', 'recruiting']),
    status: 'active' as const,
  },
  {
    goal: 'Increase team productivity by 20%',
    category: 'work',
    priority: 7,
    confidence: 0.79,
    keywords: JSON.stringify(['productivity', 'efficiency', 'team', 'improvement']),
    status: 'active' as const,
  },

  // Personal goals
  {
    goal: 'Run a half marathon this year',
    category: 'personal',
    priority: 8,
    confidence: 0.87,
    keywords: JSON.stringify(['running', 'fitness', 'health', 'marathon']),
    status: 'active' as const,
  },
  {
    goal: 'Visit Japan in the spring',
    category: 'personal',
    priority: 7,
    confidence: 0.91,
    keywords: JSON.stringify(['travel', 'Japan', 'vacation', 'trip']),
    status: 'active' as const,
  },
  {
    goal: 'Read 24 books this year',
    category: 'personal',
    priority: 6,
    confidence: 0.83,
    keywords: JSON.stringify(['reading', 'books', 'personal growth']),
    status: 'active' as const,
  },

  // Learning goals
  {
    goal: 'Master machine learning fundamentals',
    category: 'learning',
    priority: 9,
    confidence: 0.86,
    keywords: JSON.stringify(['ML', 'learning', 'AI', 'courses']),
    status: 'active' as const,
  },
  {
    goal: 'Get AWS Solutions Architect certification',
    category: 'learning',
    priority: 8,
    confidence: 0.94,
    keywords: JSON.stringify(['AWS', 'certification', 'cloud', 'architect']),
    status: 'active' as const,
  },
  {
    goal: 'Learn Spanish conversational fluency',
    category: 'learning',
    priority: 6,
    confidence: 0.78,
    keywords: JSON.stringify(['Spanish', 'language', 'learning', 'fluency']),
    status: 'active' as const,
  },

  // Financial goals
  {
    goal: 'Save $50K for house down payment',
    category: 'financial',
    priority: 9,
    confidence: 0.89,
    keywords: JSON.stringify(['savings', 'house', 'down payment', 'real estate']),
    status: 'active' as const,
  },
  {
    goal: 'Max out 401(k) contributions',
    category: 'financial',
    priority: 8,
    confidence: 0.92,
    keywords: JSON.stringify(['401k', 'retirement', 'investment', 'savings']),
    status: 'active' as const,
  },
  {
    goal: 'Build emergency fund of 6 months expenses',
    category: 'financial',
    priority: 7,
    confidence: 0.85,
    keywords: JSON.stringify(['emergency fund', 'savings', 'financial security']),
    status: 'active' as const,
  },

  // Relationship goals
  {
    goal: 'Spend more quality time with family',
    category: 'relationship',
    priority: 8,
    confidence: 0.76,
    keywords: JSON.stringify(['family', 'time', 'quality', 'relationships']),
    status: 'active' as const,
  },
  {
    goal: 'Reconnect with old college friends',
    category: 'relationship',
    priority: 6,
    confidence: 0.81,
    keywords: JSON.stringify(['friends', 'college', 'reconnect', 'social']),
    status: 'active' as const,
  },

  // Some achieved goals
  {
    goal: 'Complete leadership training program',
    category: 'work',
    priority: 8,
    confidence: 0.93,
    keywords: JSON.stringify(['leadership', 'training', 'management']),
    status: 'achieved' as const,
  },
  {
    goal: 'Lose 15 pounds',
    category: 'personal',
    priority: 7,
    confidence: 0.88,
    keywords: JSON.stringify(['weight loss', 'fitness', 'health']),
    status: 'achieved' as const,
  },
];

async function main() {
  console.log('Seeding goals...');

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

  // Delete existing goals
  await prisma.userGoal.deleteMany({
    where: { userId: user.id },
  });

  // Create sample goals
  for (const goal of sampleGoals) {
    await prisma.userGoal.create({
      data: {
        userId: user.id,
        ...goal,
      },
    });
  }

  console.log(`✅ Created ${sampleGoals.length} goals for user ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
