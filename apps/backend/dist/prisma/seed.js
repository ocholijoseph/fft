import { PrismaClient, Role } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const father = await prisma.user.upsert({
        where: { email: 'father@example.com' },
        update: {},
        create: { email: 'father@example.com', name: 'Father', role: Role.FATHER }
    });
    const mother = await prisma.user.upsert({
        where: { email: 'mother@example.com' },
        update: {},
        create: { email: 'mother@example.com', name: 'Mother', role: Role.MOTHER }
    });
    const child = await prisma.user.upsert({
        where: { email: 'child@example.com' },
        update: {},
        create: { email: 'child@example.com', name: 'Child', role: Role.CHILD }
    });
    const categories = ['Groceries', 'Transport', 'Bills', 'Education', 'Entertainment', 'Healthcare'];
    const users = [father, mother, child];
    const now = new Date();
    const expenses = [];
    for (const user of users) {
        for (let m = 0; m < 5; m++) {
            for (let i = 0; i < 6; i++) {
                const createdAt = new Date(now.getFullYear(), now.getMonth() - (4 - m), Math.floor(Math.random() * 27) + 1);
                expenses.push({
                    amount: Math.round((Math.random() * 200 + 20) * 100) / 100,
                    category: categories[i],
                    description: `${categories[i]} expense`,
                    userId: user.id,
                    createdAt
                });
            }
        }
    }
    await prisma.expense.createMany({ data: expenses });
    await prisma.budget.upsert({ where: { category: 'Groceries' }, update: { limit: 500 }, create: { category: 'Groceries', limit: 500 } });
    await prisma.budget.upsert({ where: { category: 'Entertainment' }, update: { limit: 200 }, create: { category: 'Entertainment', limit: 200 } });
    console.log('Seeded users, expenses, and budgets');
}
main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
