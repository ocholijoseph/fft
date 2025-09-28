import { PrismaClient, UserRole, ExpenseCategory, BudgetPeriod } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create a family
  const family = await prisma.family.create({
    data: {
      name: 'The Smith Family',
    },
  });

  console.log(`✅ Created family: ${family.name}`);

  // Create users with different roles
  const father = await prisma.user.create({
    data: {
      email: 'father@family.com',
      name: 'John Smith',
      role: UserRole.FATHER,
      familyId: family.id,
      googleId: 'google_father_123',
    },
  });

  const mother = await prisma.user.create({
    data: {
      email: 'mother@family.com',
      name: 'Jane Smith',
      role: UserRole.MOTHER,
      familyId: family.id,
      googleId: 'google_mother_123',
    },
  });

  const child = await prisma.user.create({
    data: {
      email: 'child@family.com',
      name: 'Tommy Smith',
      role: UserRole.CHILD,
      familyId: family.id,
      googleId: 'google_child_123',
    },
  });

  console.log(`✅ Created users: ${father.name}, ${mother.name}, ${child.name}`);

  // Create sample expenses
  const expenses = [
    {
      userId: father.id,
      amount: 150.50,
      category: ExpenseCategory.FOOD,
      description: 'Weekly grocery shopping',
      date: new Date('2025-01-20'),
    },
    {
      userId: father.id,
      amount: 75.00,
      category: ExpenseCategory.TRANSPORT,
      description: 'Gas for car',
      date: new Date('2025-01-19'),
    },
    {
      userId: mother.id,
      amount: 200.00,
      category: ExpenseCategory.BILLS,
      description: 'Electricity bill',
      date: new Date('2025-01-18'),
    },
    {
      userId: mother.id,
      amount: 45.00,
      category: ExpenseCategory.ENTERTAINMENT,
      description: 'Movie tickets',
      date: new Date('2025-01-17'),
    },
    {
      userId: child.id,
      amount: 25.00,
      category: ExpenseCategory.ENTERTAINMENT,
      description: 'Video game purchase',
      date: new Date('2025-01-16'),
    },
    {
      userId: child.id,
      amount: 15.00,
      category: ExpenseCategory.FOOD,
      description: 'School lunch',
      date: new Date('2025-01-15'),
    },
  ];

  for (const expense of expenses) {
    await prisma.expense.create({
      data: expense,
    });
  }

  console.log(`✅ Created ${expenses.length} sample expenses`);

  // Create sample budgets (Father role only)
  const budgets = [
    {
      familyId: family.id,
      category: ExpenseCategory.FOOD,
      amount: 600.00,
      period: BudgetPeriod.MONTHLY,
    },
    {
      familyId: family.id,
      category: ExpenseCategory.TRANSPORT,
      amount: 300.00,
      period: BudgetPeriod.MONTHLY,
    },
    {
      familyId: family.id,
      category: ExpenseCategory.BILLS,
      amount: 800.00,
      period: BudgetPeriod.MONTHLY,
    },
    {
      familyId: family.id,
      category: ExpenseCategory.ENTERTAINMENT,
      amount: 200.00,
      period: BudgetPeriod.MONTHLY,
    },
    {
      familyId: family.id,
      category: ExpenseCategory.EDUCATION,
      amount: 500.00,
      period: BudgetPeriod.MONTHLY,
    },
  ];

  for (const budget of budgets) {
    await prisma.budget.create({
      data: budget,
    });
  }

  console.log(`✅ Created ${budgets.length} sample budgets`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Sample Data Summary:');
  console.log(`- Family: ${family.name}`);
  console.log(`- Users: Father (${father.email}), Mother (${mother.email}), Child (${child.email})`);
  console.log(`- Expenses: ${expenses.length} sample transactions`);
  console.log(`- Budgets: ${budgets.length} monthly budget categories`);
  console.log('\n🔐 Test Credentials:');
  console.log('- Father: father@family.com (FATHER role)');
  console.log('- Mother: mother@family.com (MOTHER role)');
  console.log('- Child: child@family.com (CHILD role)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });