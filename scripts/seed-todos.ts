import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleTodos = [
  {
    title: 'Review Q4 marketing budget proposal',
    description: 'Sarah mentioned we need to approve the budget by end of week',
    priority: 9,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    confidence: 0.92,
    status: 'pending' as const,
  },
  {
    title: 'Schedule team sync for project kickoff',
    description: 'Need to coordinate with engineering and design teams',
    priority: 8,
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    confidence: 0.87,
    status: 'pending' as const,
  },
  {
    title: 'Send updated contract to legal',
    description: 'Contract revisions need to be reviewed before client meeting',
    priority: 9,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    confidence: 0.95,
    status: 'pending' as const,
  },
  {
    title: 'Prepare slides for investor presentation',
    description: 'Board meeting is next week, need financials and roadmap',
    priority: 10,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    confidence: 0.89,
    status: 'pending' as const,
  },
  {
    title: 'Follow up with John about API integration',
    description: 'Waiting on response about webhook implementation',
    priority: 6,
    confidence: 0.75,
    status: 'pending' as const,
  },
  {
    title: 'Review and approve design mockups',
    description: 'Design team sent final mockups for mobile app',
    priority: 7,
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    confidence: 0.83,
    status: 'pending' as const,
  },
  {
    title: 'Update documentation for new API endpoints',
    description: 'Engineering needs docs before next release',
    priority: 5,
    confidence: 0.71,
    status: 'pending' as const,
  },
  {
    title: 'Book flights for conference',
    description: 'TechSummit 2024 in San Francisco',
    priority: 6,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    confidence: 0.88,
    status: 'pending' as const,
  },
  {
    title: 'Review candidate resumes for senior engineer role',
    description: 'HR sent 5 qualified candidates for review',
    priority: 7,
    confidence: 0.79,
    status: 'pending' as const,
  },
  {
    title: 'Approve expense report',
    description: 'Team expenses from last month need approval',
    priority: 4,
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday (overdue!)
    confidence: 0.91,
    status: 'pending' as const,
  },
  // Some completed todos
  {
    title: 'Send weekly status report',
    description: 'Completed and sent to stakeholders',
    priority: 6,
    confidence: 0.85,
    status: 'completed' as const,
  },
  {
    title: 'Review pull request for authentication feature',
    description: 'Code review completed and merged',
    priority: 8,
    confidence: 0.92,
    status: 'completed' as const,
  },
  // A dismissed todo
  {
    title: 'Update LinkedIn profile',
    description: 'Not urgent, will do later',
    priority: 3,
    confidence: 0.68,
    status: 'dismissed' as const,
  },
];

async function main() {
  console.log('Seeding todos...');

  // Create or get demo user
  let user = await prisma.user.findFirst({
    where: { email: 'demo@kinso.ai' },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'demo@kinso.ai',
        name: 'Demo User',
        password: 'demo123', // Not used for demo
      },
    });
  }

  // Delete existing todos
  await prisma.todoItem.deleteMany({
    where: { userId: user.id },
  });

  // Create sample todos
  for (const todo of sampleTodos) {
    await prisma.todoItem.create({
      data: {
        userId: user.id,
        ...todo,
        completedAt: todo.status === 'completed' ? new Date() : null,
      },
    });
  }

  console.log(`✅ Created ${sampleTodos.length} todos for user ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
